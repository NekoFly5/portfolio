/* ========================================
   THREE.JS — 3D INTERACTIVE SPHERE
   ======================================== */
(function () {
    const container = document.getElementById('three-bg');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const count = 500;
    const radius = 8;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x6366f1, size: 0.05, transparent: true, opacity: 0.9, sizeAttenuation: true
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const linesMaterial = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.1 });
    const linesGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 2.2) {
                linePositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                linePositions.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
            }
        }
    }
    linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(lines);

    camera.position.z = 12;
    let mouseX = 0, mouseY = 0;
    let rotationSpeed = 0.002;
    let targetRotationSpeed = 0.002;
    let breathe = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Click — pulse the sphere: speed up rotation + color flash
    document.addEventListener('click', () => {
        targetRotationSpeed = 0.02;
        setTimeout(() => { targetRotationSpeed = 0.002; }, 1200);
        material.color.setHex(0x06b6d4);
        linesMaterial.color.setHex(0x06b6d4);
        setTimeout(() => {
            material.color.setHex(0x6366f1);
            linesMaterial.color.setHex(0x6366f1);
        }, 600);
    });

    // Scroll — zoom out as you scroll down
    window.addEventListener('scroll', () => {
        const scrollRatio = Math.min(window.scrollY / window.innerHeight, 1);
        camera.position.z = 12 + scrollRatio * 8;
    });

    function animate() {
        requestAnimationFrame(animate);
        rotationSpeed += (targetRotationSpeed - rotationSpeed) * 0.05;
        points.rotation.y += rotationSpeed;
        points.rotation.x += rotationSpeed * 0.25;
        lines.rotation.y = points.rotation.y;
        lines.rotation.x = points.rotation.x;

        // Breathing/pulsing
        breathe += 0.01;
        const s = 1 + Math.sin(breathe) * 0.03;
        points.scale.set(s, s, s);
        lines.scale.set(s, s, s);

        // Strong mouse parallax
        camera.position.x += (mouseX * 3 - camera.position.x) * 0.03;
        camera.position.y += (-mouseY * 3 - camera.position.y) * 0.03;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

/* ========================================
   INTERACTIVE PARTICLE CANVAS
   ======================================== */
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: null, y: null };
let burstParticles = [];

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

// Click — burst of particles
canvas.addEventListener('click', (e) => {
    for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 / 15) * i + Math.random() * 0.5;
        const speed = 2 + Math.random() * 3;
        burstParticles.push({
            x: e.x, y: e.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 3 + 1,
            opacity: 1,
            color: Math.random() > 0.5 ? '99, 102, 241' : '6, 182, 212'
        });
    }
});

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.baseSpeedX = (Math.random() - 0.5) * 0.5;
        this.baseSpeedY = (Math.random() - 0.5) * 0.5;
        this.speedX = this.baseSpeedX;
        this.speedY = this.baseSpeedY;
        this.opacity = Math.random() * 0.4 + 0.1;
    }
    update() {
        this.x += this.speedX; this.y += this.speedY;
        this.speedX += (this.baseSpeedX - this.speedX) * 0.02;
        this.speedY += (this.baseSpeedY - this.speedY) * 0.02;
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
        // Mouse repulsion
        if (mouse.x !== null) {
            const dx = mouse.x - this.x, dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const force = (150 - dist) / 150;
                this.speedX -= (dx / dist) * force * 3;
                this.speedY -= (dy / dist) * force * 3;
            }
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 10000), 120);
    for (let i = 0; i < count; i++) particles.push(new Particle());
}
initParticles();
window.addEventListener('resize', initParticles);

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw glowing lines from particles to cursor
    if (mouse.x !== null) {
        particles.forEach(p => {
            const dx = mouse.x - p.x, dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 200) * 0.2})`;
                ctx.lineWidth = 0.6;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        });
    }

    particles.forEach(p => { p.update(); p.draw(); });

    // Connect nearby particles
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x, dy = particles[a].y - particles[b].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 120) * 0.1})`;
                ctx.lineWidth = 0.4;
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }

    // Burst particles (from clicks)
    for (let i = burstParticles.length - 1; i >= 0; i--) {
        const bp = burstParticles[i];
        bp.x += bp.vx; bp.y += bp.vy;
        bp.vx *= 0.97; bp.vy *= 0.97;
        bp.opacity -= 0.015;
        bp.size *= 0.99;
        if (bp.opacity <= 0) { burstParticles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, bp.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${bp.color}, ${bp.opacity})`;
        ctx.fill();
    }

    requestAnimationFrame(animateParticles);
}
animateParticles();

/* ========================================
   GSAP — HERO ENTRANCE ONLY
   ======================================== */
if (typeof gsap !== 'undefined') {
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
        .from('.hero-badge', { y: 40, opacity: 0, duration: 0.8, delay: 0.3 })
        .from('.hero-greeting', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-name', { y: 40, opacity: 0, duration: 0.8, scale: 0.95 }, '-=0.3')
        .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-description', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
        .from('.hero-cta .btn', { y: 30, opacity: 0, duration: 0.5, stagger: 0.15 }, '-=0.3')
        .from('.hero-scroll', { y: 20, opacity: 0, duration: 0.5 }, '-=0.2');

    /* Magnetic buttons */
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
        });
    });
}

/* ========================================
   SCROLL REVEAL (IntersectionObserver)
   ======================================== */
const revealElements = document.querySelectorAll(
    '.section-title, .section-subtitle, .about-terminal, .about-info, ' +
    '.project-card, .skill-category, .timeline-item, .interest-card, .contact-card'
);

revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

revealElements.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 0.1}s`;
    revealObserver.observe(el);
});

/* ========================================
   TYPING EFFECT
   ======================================== */
const typingTexts = [
    "Étudiant en BUT Informatique",
    "Déploiement d'applications communicantes et sécurisées",
    "Développeur Web & Desktop",
    "En recherche de stage"
];
let textIndex = 0, charIndex = 0, isDeleting = false;
const typingEl = document.getElementById('typingText');

function typeText() {
    const current = typingTexts[textIndex];
    if (isDeleting) { typingEl.textContent = current.substring(0, charIndex - 1); charIndex--; }
    else { typingEl.textContent = current.substring(0, charIndex + 1); charIndex++; }
    let delay = isDeleting ? 35 : 70;
    if (!isDeleting && charIndex === current.length) { delay = 2500; isDeleting = true; }
    else if (isDeleting && charIndex === 0) { isDeleting = false; textIndex = (textIndex + 1) % typingTexts.length; delay = 500; }
    setTimeout(typeText, delay);
}
setTimeout(typeText, 1800);

/* ========================================
   NAVBAR
   ======================================== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 200;
    sections.forEach(section => {
        const top = section.offsetTop, height = section.offsetHeight;
        const id = section.getAttribute('id');
        if (scrollY >= top && scrollY < top + height) {
            navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + id));
        }
    });
});

/* Mobile menu */
const navToggle = document.getElementById('navToggle');
const navLinksEl = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinksEl.classList.toggle('open');
});
navLinksEl.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => { navToggle.classList.remove('active'); navLinksEl.classList.remove('open'); });
});

/* Smooth scroll */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

/* ========================================
   CURSOR GLOW
   ======================================== */
const cursorGlow = document.createElement('div');
cursorGlow.classList.add('cursor-glow');
document.body.appendChild(cursorGlow);
document.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
});

/* ========================================
   INIT AOS
   ======================================== */
if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 80 });
}
