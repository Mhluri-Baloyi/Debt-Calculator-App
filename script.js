import * as THREE from 'three';

// --- Theme Colors ---
const themeColors = {
    light: {
        particles: 0x3498db
    },
    dark: {
        particles: 0xecf0f1
    }
};

// --- 3D Background Scene ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
const canvasContainer = document.getElementById('canvas-container');

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

const geometry = new THREE.BufferGeometry();
const vertices = [];
const numParticles = 5000;

for (let i = 0; i < numParticles; i++) {
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    vertices.push(x, y, z);
}

geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

const material = new THREE.PointsMaterial({
    color: 0x3498db,
    size: 0.02,
    transparent: true,
    opacity: 0.6
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

camera.position.z = 5;

let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

function animate() {
    requestAnimationFrame(animate);
    particles.rotation.x += 0.0001;
    particles.rotation.y += 0.0002;
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Theme Switcher ---
const themeToggle = document.getElementById('theme-toggle');

function setParticleColor(theme) {
    particles.material.color.setHex(themeColors[theme].particles);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    setParticleColor(theme);
    themeToggle.checked = theme === 'dark';
}

themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
});

// Load saved theme or use system preference
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme) {
    setTheme(savedTheme);
} else if (prefersDark) {
    setTheme('dark');
} else {
    setTheme('light'); // Default to light
}

// --- Calculator Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('debt-form');
    const resultsContainer = document.getElementById('results-container');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const totalDebt = parseFloat(document.getElementById('total-debt').value);
        const annualRate = parseFloat(document.getElementById('interest-rate').value);
        const monthlyPayment = parseFloat(document.getElementById('monthly-payment').value);

        // Clear previous results and hide
        resultsContainer.classList.remove('visible');
        resultsContainer.classList.add('hidden');

        // Validation
        const monthlyInterestRate = annualRate / 100 / 12;
        const minPayment = totalDebt * monthlyInterestRate;

        if (isNaN(totalDebt) || isNaN(annualRate) || isNaN(monthlyPayment) || totalDebt <= 0 || annualRate < 0 || monthlyPayment <= 0) {
            displayError("Please fill in all fields with valid positive numbers.");
            return;
        }

        if (monthlyPayment <= minPayment && annualRate > 0) {
             displayError(`Your monthly payment must be greater than the monthly interest (R${minPayment.toFixed(2)}) to pay off the debt.`);
            return;
        }

        // Calculation
        let months;
        if (annualRate === 0) {
            months = Math.ceil(totalDebt / monthlyPayment);
        } else {
            months = -Math.log(1 - (totalDebt * monthlyInterestRate) / monthlyPayment) / Math.log(1 + monthlyInterestRate);
            months = Math.ceil(months);
        }

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        const totalPaid = monthlyPayment * months;
        const totalInterest = totalPaid - totalDebt;

        // Display Results
        setTimeout(() => {
            displayResults({ years, remainingMonths, totalInterest, totalPaid, totalDebt });
        }, 300); // Small delay for transition
    });

    function displayError(message) {
        const summaryMessage = document.getElementById('summary-message');
        summaryMessage.innerHTML = `<span style="color: var(--error-color);">${message}</span>`;
        
        document.getElementById('payoff-time').textContent = '-';
        document.getElementById('total-interest').textContent = '-';
        document.getElementById('total-paid').textContent = '-';
        
        updateChart(0, 0);

        resultsContainer.classList.remove('hidden');
        resultsContainer.classList.add('visible');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function displayResults(data) {
        const { years, remainingMonths, totalInterest, totalPaid, totalDebt } = data;

        const summaryMessage = document.getElementById('summary-message');
        summaryMessage.innerHTML = `Based on your inputs, here is your path to becoming debt-free.`;
        summaryMessage.style.color = 'var(--text-color)';

        let timeString = '';
        if (years > 0) {
            timeString += `${years} year${years > 1 ? 's' : ''}`;
        }
        if (remainingMonths > 0) {
            if (years > 0) timeString += ' and ';
            timeString += `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
        }
        if (timeString === '') timeString = 'Less than a month';

        document.getElementById('payoff-time').textContent = timeString;
        document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
        document.getElementById('total-paid').textContent = formatCurrency(totalPaid);

        const principalPercentage = (totalDebt / totalPaid) * 100;
        const interestPercentage = (totalInterest / totalPaid) * 100;
        
        updateChart(principalPercentage, interestPercentage);

        resultsContainer.classList.remove('hidden');
        resultsContainer.classList.add('visible');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    function updateChart(principalPct, interestPct) {
        document.querySelector('.principal-bar').style.width = `${principalPct}%`;
        document.querySelector('.interest-bar').style.width = `${interestPct}%`;
    }

    function formatCurrency(amount) {
        return 'R ' + amount.toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
});