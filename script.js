/* ========================================
   INIT AOS (Animate On Scroll)
   ======================================== */
AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 80
});

/* ========================================
   THREE.JS — 3D ANIMATED SPHERE NETWORK
   ======================================== */
(function () {
    const container = document.getElementById('three-bg');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create points on a sphere
    const geometry = new THREE.BufferGeometry();
    const count = 400;
    const positions = new Float32Array(count * 3);
    const radius = 8;

    for (let i = 0; i < count; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x6366f1,
        size: 0.04,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Lines connecting nearby points
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.08
    });

    const linesGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < 2.5) {
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
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animate() {
        requestAnimationFrame(animate);
        points.rotation.y += 0.002;
        points.rotation.x += 0.0005;
        lines.rotation.y += 0.002;
        lines.rotation.x += 0.0005;
        // Mouse parallax
        camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.02;
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
   PARTICLE CANVAS (overlay layer)
   ======================================== */
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: null, y: null };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.3 + 0.05;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
        if (mouse.x !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                const force = (100 - dist) / 100;
                this.x -= (dx / dist) * force * 1.5;
                this.y -= (dy / dist) * force * 1.5;
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
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 100);
    for (let i = 0; i < count; i++) particles.push(new Particle());
}
initParticles();
window.addEventListener('resize', initParticles);

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    // Connect nearby particles
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 100) * 0.08})`;
                ctx.lineWidth = 0.4;
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

/* ========================================
   GSAP — HERO ENTRANCE ANIMATIONS
   ======================================== */
gsap.registerPlugin(ScrollTrigger);

const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
heroTl
    .from('.hero-badge', { y: 40, opacity: 0, duration: 0.8, delay: 0.3 })
    .from('.hero-greeting', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
    .from('.hero-name', { y: 40, opacity: 0, duration: 0.8, scale: 0.95 }, '-=0.3')
    .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
    .from('.hero-description', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
    .from('.hero-cta .btn', { y: 30, opacity: 0, duration: 0.5, stagger: 0.15 }, '-=0.3')
    .from('.hero-scroll', { y: 20, opacity: 0, duration: 0.5 }, '-=0.2');

// Override CSS animations since GSAP handles them now
document.querySelectorAll('.hero-badge, .hero-greeting, .hero-name, .hero-subtitle, .hero-description, .hero-cta, .hero-scroll').forEach(el => {
    el.style.animation = 'none';
    el.style.opacity = '1';
});

/* GSAP ScrollTrigger for sections */
gsap.utils.toArray('.section-title').forEach(title => {
    gsap.from(title, {
        scrollTrigger: { trigger: title, start: 'top 85%', toggleActions: 'play none none none' },
        y: 40, opacity: 0, duration: 0.7
    });
});

gsap.utils.toArray('.section-subtitle').forEach(sub => {
    gsap.from(sub, {
        scrollTrigger: { trigger: sub, start: 'top 85%', toggleActions: 'play none none none' },
        y: 30, opacity: 0, duration: 0.6, delay: 0.15
    });
});

gsap.utils.toArray('.project-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
        y: 60, opacity: 0, duration: 0.7, delay: i * 0.12, ease: 'power2.out',
        onComplete: () => card.classList.add('visible')
    });
});

gsap.utils.toArray('.skill-category').forEach((cat, i) => {
    gsap.from(cat, {
        scrollTrigger: { trigger: cat, start: 'top 88%', toggleActions: 'play none none none' },
        y: 50, opacity: 0, duration: 0.6, delay: i * 0.1
    });
});

gsap.utils.toArray('.timeline-item').forEach((item, i) => {
    gsap.from(item, {
        scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none none' },
        x: -50, opacity: 0, duration: 0.7, delay: i * 0.15
    });
});

gsap.utils.toArray('.contact-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
        y: 40, opacity: 0, duration: 0.5, delay: i * 0.1
    });
});

gsap.utils.toArray('.interest-card').forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
        scale: 0.8, opacity: 0, duration: 0.5, delay: i * 0.1, ease: 'back.out(1.4)'
    });
});

// Terminal slide-in
gsap.from('.about-terminal', {
    scrollTrigger: { trigger: '.about-terminal', start: 'top 85%', toggleActions: 'play none none none' },
    x: -80, opacity: 0, duration: 0.8
});

gsap.from('.about-info', {
    scrollTrigger: { trigger: '.about-info', start: 'top 85%', toggleActions: 'play none none none' },
    x: 80, opacity: 0, duration: 0.8
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
    if (isDeleting) {
        typingEl.textContent = current.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingEl.textContent = current.substring(0, charIndex + 1);
        charIndex++;
    }
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

// Active nav link
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 200;
    sections.forEach(section => {
        const top = section.offsetTop, height = section.offsetHeight;
        const id = section.getAttribute('id');
        if (scrollY >= top && scrollY < top + height) {
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + id);
            });
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
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinksEl.classList.remove('open');
    });
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
   MAGNETIC BUTTONS EFFECT
   ======================================== */
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

/* ========================================
   CUSTOM CURSOR GLOW
   ======================================== */
const cursorGlow = document.createElement('div');
cursorGlow.classList.add('cursor-glow');
document.body.appendChild(cursorGlow);

document.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
});
