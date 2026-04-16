/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
(function () {
    const outer = document.getElementById('cursor-outer');
    const dot   = document.getElementById('cursor-dot');
    if (!outer || !dot) return;

    let outerX = 0, outerY = 0, mouseX = 0, mouseY = 0, visible = false;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX; mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top  = mouseY + 'px';
        if (!visible) {
            outer.style.opacity = '1'; dot.style.opacity = '1';
            outer.style.left = mouseX + 'px'; outer.style.top = mouseY + 'px';
            outerX = mouseX; outerY = mouseY; visible = true;
        }
    });

    document.addEventListener('mouseleave', () => {
        outer.style.opacity = '0'; dot.style.opacity = '0'; visible = false;
    });

    (function animCursor() {
        outerX += (mouseX - outerX) * 0.12;
        outerY += (mouseY - outerY) * 0.12;
        outer.style.left = outerX + 'px';
        outer.style.top  = outerY + 'px';
        requestAnimationFrame(animCursor);
    })();

    const iEls = 'a, button, [role="button"], .project-card, .skill-group, .tag, .wbtn, .tb-app, .win-bar, .wtab';
    document.addEventListener('mouseover', (e) => { if (e.target.closest(iEls)) document.body.classList.add('cursor-hover'); });
    document.addEventListener('mouseout',  (e) => { if (e.target.closest(iEls)) document.body.classList.remove('cursor-hover'); });
    document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
    document.addEventListener('mouseup',   () => document.body.classList.remove('cursor-click'));
})();

/* ============================================================
   BIOS BOOT SEQUENCE
   ============================================================ */
(function () {
    const biosEl  = document.getElementById('bios-screen');
    const output  = document.getElementById('biosOutput');
    const hint    = document.getElementById('biosHint');
    if (!biosEl || !output) return;

    // Date dynamique dans le header
    const biosDate = document.getElementById('biosDate');
    if (biosDate) {
        const now = new Date();
        biosDate.textContent = now.toLocaleDateString('fr-FR', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' })
            + '  ' + now.toLocaleTimeString('fr-FR');
    }

    let lineTimer = 0;

    function addLine(text, cls, delay) {
        lineTimer += delay;
        setTimeout(() => {
            const span = document.createElement('span');
            if (cls) span.className = cls;
            span.textContent = text + '\n';
            output.appendChild(span);
        }, lineTimer);
    }

    function addBlank(delay) { addLine('', '', delay); }

    addLine('Initializing hardware components...', 'bios-dim',          0);
    addLine('CPU:  Intel Core i7-1165G7 @ 2.80GHz        ', '',        120);
    addLine('GPU:  NVIDIA GeForce RTX 3060               ', '',        200);
    addLine('RAM:  16,384 MB DDR4-3200                OK', 'bios-ok',  300);
    addBlank(100);
    addLine('Scanning storage devices...', 'bios-dim',                  120);
    addLine('  ├─ NVMe0  SAMSUNG 980 PRO 512GB    [DETECTED]', 'bios-ok', 180);
    addLine('  └─ SATA1  SEAGATE HDD 2TB          [DETECTED]', 'bios-ok', 240);
    addBlank(80);
    addLine('Checking PCIe lanes...              [OK]', 'bios-ok',     160);
    addLine('Loading ACPI tables...              [OK]', 'bios-ok',     220);
    addLine('Initializing boot sequence...', '',                        280);
    addBlank(60);

    // Progress bar (~1.5s total)
    lineTimer += 80;
    setTimeout(() => {
        const p = document.createElement('span');
        p.textContent = 'Booting Alexandre-OS v2026.1...  [';
        output.appendChild(p);
        const bar = document.createElement('span');
        bar.className = 'bios-ok';
        bar.textContent = '';
        output.appendChild(bar);
        const end = document.createElement('span');
        end.textContent = '] 0%';
        output.appendChild(end);
        let pct = 0;
        const tick = setInterval(() => {
            pct = Math.min(pct + Math.floor(Math.random() * 12 + 6), 100);
            const filled = Math.floor(pct / 5);
            bar.textContent = '█'.repeat(filled);
            end.textContent = '░'.repeat(20 - filled) + `] ${pct}%`;
            if (pct >= 100) {
                clearInterval(tick);
                end.textContent = '] 100%\n';
                hint.textContent = '▶  Press any key to continue...';
                setTimeout(hideBios, 500);
            }
        }, 18);
    }, lineTimer);

    function hideBios() {
        biosEl.classList.add('hidden');
        startLogin();
    }

    // Skip on keypress
    document.addEventListener('keydown', () => { if (!biosEl.classList.contains('hidden')) hideBios(); }, { once: true });
    document.addEventListener('click',   () => { if (!biosEl.classList.contains('hidden')) hideBios(); }, { once: true });
})();

/* ============================================================
   LOGIN ANIMATION (runs after BIOS)
   ============================================================ */
function startLogin() {
    const screen    = document.getElementById('login-screen');
    const fieldUser = document.getElementById('fieldUser');
    const fieldPass = document.getElementById('fieldPass');
    const cursor1   = document.getElementById('cursor1');
    const cursor2   = document.getElementById('cursor2');
    const field2    = document.getElementById('loginField2');
    const status    = document.getElementById('loginStatus');
    const barWrap   = document.getElementById('loginBarWrap');
    const bar       = document.getElementById('loginBar');
    if (!screen) return;

    function typeText(el, text, speed, onDone) {
        let i = 0;
        const tick = () => {
            el.textContent += text[i++];
            if (i < text.length) setTimeout(tick, speed);
            else if (onDone) setTimeout(onDone, 150);
        };
        setTimeout(tick, speed);
    }

    function showStatus(msg, onDone) {
        status.textContent = msg;
        status.classList.add('show');
        if (onDone) setTimeout(onDone, 160);
    }

    function runBar(onDone) {
        barWrap.classList.add('show');
        let p = 0;
        const step = () => {
            p += Math.random() * 9 + 4;
            if (p >= 100) { bar.style.width = '100%'; setTimeout(onDone, 150); return; }
            bar.style.width = p + '%';
            setTimeout(step, 16 + Math.random() * 12);
        };
        step();
    }

    setTimeout(() => {
        cursor1.classList.add('active');
        typeText(fieldUser, 'alexandre.wang', 22, () => {
            cursor1.classList.remove('active');
            setTimeout(() => {
                field2.classList.add('show');
                cursor2.classList.add('active');
                typeText(fieldPass, '••••••••••', 16, () => {
                    cursor2.classList.remove('active');
                    setTimeout(() => {
                        showStatus('> Authentification en cours...', () => {
                            showStatus('> Chargement du portfolio...', () => {
                                runBar(() => {
                                    showStatus('> Accès autorisé ✓', () => {
                                        setTimeout(() => {
                                            screen.classList.add('hidden');
                                            onPortfolioReady();
                                        }, 180);
                                    });
                                });
                            });
                        });
                    }, 100);
                });
            }, 100);
        });
    }, 200);
}

/* ============================================================
   ON PORTFOLIO READY (after login)
   ============================================================ */
function onPortfolioReady() {
    // Animate hero blocks
    document.querySelectorAll('.hero .block').forEach(el => el.classList.add('visible'));

    // Show desktop windows + taskbar with stagger
    const deskWin = document.getElementById('deskWindows');
    const taskbar = document.getElementById('taskbar');
    if (deskWin) {
        deskWin.classList.add('visible');
        taskbar && taskbar.classList.add('visible');
        initWindowPositions();
        setTimeout(() => showWin('winTerm', 0),  400);
        setTimeout(() => showWin('winSys',  0),  650);
        setTimeout(() => showWin('winTask', 0),  900);
    }

    // Start terminal boot sequence
    setTimeout(startTerminalBoot, 600);
}

/* ============================================================
   THREE.JS — SPHÈRE INTERACTIVE
   ============================================================ */
(function () {
    const container = document.getElementById('three-bg');
    if (!container || typeof THREE === 'undefined') return;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const COUNT = 550, RADIUS = 8;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
        const phi = Math.acos(2 * Math.random() - 1), theta = Math.random() * Math.PI * 2;
        pos[i*3] = RADIUS * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = RADIUS * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = RADIUS * Math.cos(phi);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const pointMat = new THREE.PointsMaterial({ color: 0x39e75f, size: 0.055, transparent: true, opacity: 0.9, sizeAttenuation: true });
    const points = new THREE.Points(geo, pointMat);
    scene.add(points);

    const lineMat = new THREE.LineBasicMaterial({ color: 0x39e75f, transparent: true, opacity: 0.12 });
    const lineGeo = new THREE.BufferGeometry();
    const linePos = [];
    for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
            const dx = pos[i*3]-pos[j*3], dy = pos[i*3+1]-pos[j*3+1], dz = pos[i*3+2]-pos[j*3+2];
            if (Math.sqrt(dx*dx+dy*dy+dz*dz) < 2.3) {
                linePos.push(pos[i*3],pos[i*3+1],pos[i*3+2],pos[j*3],pos[j*3+1],pos[j*3+2]);
            }
        }
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    camera.position.z = 13;
    let mX = 0, mY = 0, speed = 0.0018, targetSpeed = 0.0018, breathe = 0;

    document.addEventListener('mousemove', (e) => {
        mX = (e.clientX / window.innerWidth - 0.5) * 2;
        mY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    document.addEventListener('click', () => {
        targetSpeed = 0.022; setTimeout(() => { targetSpeed = 0.0018; }, 1100);
        pointMat.color.setHex(0x88ffaa); lineMat.color.setHex(0x88ffaa);
        setTimeout(() => { pointMat.color.setHex(0x39e75f); lineMat.color.setHex(0x39e75f); }, 500);
    });
    window.addEventListener('scroll', () => {
        const r = Math.min(window.scrollY / window.innerHeight, 1);
        camera.position.z = 13 + r * 9;
    }, { passive: true });

    (function animate() {
        requestAnimationFrame(animate);
        speed += (targetSpeed - speed) * 0.04;
        points.rotation.y += speed; points.rotation.x += speed * 0.28;
        lines.rotation.y = points.rotation.y; lines.rotation.x = points.rotation.x;
        breathe += 0.008;
        const s = 1 + Math.sin(breathe) * 0.025;
        points.scale.set(s,s,s); lines.scale.set(s,s,s);
        camera.position.x += (mX * 2.5 - camera.position.x) * 0.025;
        camera.position.y += (-mY * 2.5 - camera.position.y) * 0.025;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    })();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

/* ============================================================
   BLOCK ANIMATIONS (enter + exit)
   ============================================================ */
document.querySelectorAll('.stagger').forEach(parent => {
    [...parent.children].forEach((child, i) => {
        child.style.setProperty('--delay', `${i * 90}ms`);
        if (!child.classList.contains('block') && !child.classList.contains('block-left') && !child.classList.contains('block-right')) {
            child.classList.add('block');
        }
    });
});

document.querySelectorAll('[data-delay]').forEach(el => {
    el.style.setProperty('--delay', `${el.dataset.delay}ms`);
});

const blockObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
            el.classList.add('visible'); el.classList.remove('gone');
        } else {
            el.classList.remove('visible');
            el.classList.toggle('gone', entry.boundingClientRect.top < 0);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.block, .block-left, .block-right').forEach(el => blockObs.observe(el));

/* ============================================================
   CURTAIN REVEAL (section wipe)
   ============================================================ */
const curtainObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('curtain-open');
            curtainObs.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.section:not(#hero)').forEach(s => curtainObs.observe(s));


/* ============================================================
   ACTIVE NAV + SCROLL EFFECT
   ============================================================ */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-link');
const nav       = document.getElementById('nav');

new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            const id = e.target.id;
            navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
        }
    });
}, { threshold: 0.35 }).observe && sections.forEach(s => {
    new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const id = e.target.id;
                navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
            }
        });
    }, { threshold: 0.35 }).observe(s);
});

window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ============================================================
   MOBILE MENU
   ============================================================ */
const burger    = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');
const overlay   = document.getElementById('mobileOverlay');

function closeMenu() {
    burger.classList.remove('open'); mobileNav.classList.remove('open');
    overlay.classList.remove('open'); document.body.style.overflow = '';
}

burger.addEventListener('click', () => {
    const open = mobileNav.classList.contains('open');
    if (open) closeMenu();
    else { burger.classList.add('open'); mobileNav.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
});
overlay.addEventListener('click', closeMenu);
document.querySelectorAll('.mnav-link').forEach(l => l.addEventListener('click', closeMenu));

/* ============================================================
   SMOOTH SCROLL
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
        const t = document.querySelector(this.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
});

/* ============================================================
   TYPING EFFECT (hero)
   ============================================================ */
const phrases = [
    'Développeur Web & Desktop',
    'Étudiant BUT Informatique',
    'Parcours Déploiement Apps',
    'En recherche de stage — avr. 2026'
];
let pIdx = 0, cIdx = 0, deleting = false;
const typedEl = document.getElementById('typedText');

function typeLoop() {
    if (!typedEl) return;
    const cur = phrases[pIdx];
    typedEl.textContent = deleting ? cur.slice(0, --cIdx) : cur.slice(0, ++cIdx);
    let delay = deleting ? 28 : 62;
    if (!deleting && cIdx === cur.length) { delay = 2000; deleting = true; }
    else if (deleting && cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; delay = 350; }
    setTimeout(typeLoop, delay);
}
setTimeout(typeLoop, 2400);

/* ============================================================
   WINDOW MANAGER
   ============================================================ */
let winZ = 510;
const winStates = {}; // { id: 'open' | 'minimized' | 'closed' }

function bringToFront(win) { winZ++; win.style.zIndex = winZ; }

function showWin(id, delay) {
    const win = document.getElementById(id);
    if (!win) return;
    setTimeout(() => {
        win.classList.remove('minimized');
        win.classList.add('win-visible');
        winStates[id] = 'open';
        bringToFront(win);
        updateTaskbar();
    }, delay || 0);
}

function hideWin(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.remove('win-visible');
    setTimeout(() => { win.style.display = 'none'; }, 400);
    winStates[id] = 'closed';
    updateTaskbar();
}

function toggleWin(id) {
    const win = document.getElementById(id);
    if (!win) return;
    if (winStates[id] === 'closed' || win.style.display === 'none') {
        win.style.display = '';
        setTimeout(() => showWin(id, 0), 10);
    } else if (win.classList.contains('minimized')) {
        win.classList.remove('minimized');
        winStates[id] = 'open';
        bringToFront(win);
    } else {
        win.classList.add('minimized');
        winStates[id] = 'minimized';
    }
    updateTaskbar();
}

function updateTaskbar() {
    document.querySelectorAll('.tb-app').forEach(btn => {
        const id = btn.dataset.win;
        const win = document.getElementById(id);
        const isOpen = win && win.classList.contains('win-visible') && !win.classList.contains('minimized');
        btn.classList.toggle('tb-active', isOpen);
    });
}

function initWindowPositions() {
    const desk = document.getElementById('deskWindows');
    if (!desk) return;
    const W = desk.offsetWidth, H = desk.offsetHeight;
    const term = document.getElementById('winTerm');
    const sys  = document.getElementById('winSys');
    const task = document.getElementById('winTask');

    // Align taskbar vertically with hero-actions buttons
    const heroActions = document.querySelector('.hero-actions');
    const taskbar     = document.getElementById('taskbar');
    if (heroActions && taskbar && desk) {
        const heroRect = desk.getBoundingClientRect();
        const actRect  = heroActions.getBoundingClientRect();
        const relTop   = actRect.top - heroRect.top + actRect.height / 2 - taskbar.offsetHeight / 2;
        taskbar.style.bottom = 'auto';
        taskbar.style.top    = Math.max(0, relTop) + 'px';
    }

    if (term) { term.style.left = Math.max(0, W - 500) + 'px'; term.style.top = '85px'; }
    if (sys)  { sys.style.left  = Math.max(0, W - 400) + 'px'; sys.style.top  = Math.min(H * 0.5, H - 200) + 'px'; }
    if (task) { task.style.left = Math.max(0, W - 880) + 'px'; task.style.top = '95px'; }
}

// Close / Minimize / Maximize buttons
document.querySelectorAll('.wclose').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideWin(btn.dataset.win);
    });
});

document.querySelectorAll('.wmin').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const win = document.getElementById(btn.dataset.win);
        if (win) { win.classList.toggle('minimized'); updateTaskbar(); }
    });
});

document.querySelectorAll('.wmax').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const win = document.getElementById(btn.dataset.win);
        if (win) win.classList.toggle('maximized');
    });
});

// Taskbar buttons
document.querySelectorAll('.tb-app').forEach(btn => {
    btn.addEventListener('click', () => toggleWin(btn.dataset.win));
});

// Tab switching (System / Tasks)
document.querySelectorAll('.wtab[data-show]').forEach(tab => {
    tab.addEventListener('click', () => {
        const id = tab.dataset.show;
        const win = document.getElementById(id);
        if (!win) return;
        if (winStates[id] === 'closed' || win.style.display === 'none') {
            win.style.display = '';
            setTimeout(() => showWin(id, 0), 10);
        } else {
            win.classList.remove('minimized');
            winStates[id] = 'open';
            bringToFront(win);
        }
        updateTaskbar();
    });
});

// Bring to front on click
document.querySelectorAll('.win').forEach(win => {
    win.addEventListener('mousedown', () => bringToFront(win));
});

// Dragging (constrained inside hero)
(function () {
    let dragging = null, startX, startY, startL, startT;

    document.querySelectorAll('.win-bar').forEach(bar => {
        bar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('wbtn') || e.target.classList.contains('wtab') || e.target.tagName === 'A') return;
            dragging = bar.closest('.win');
            if (!dragging) return;
            startX = e.clientX; startY = e.clientY;
            startL = parseInt(dragging.style.left) || 0;
            startT = parseInt(dragging.style.top)  || 0;
            bringToFront(dragging);
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const desk = document.getElementById('deskWindows');
        const maxX = desk ? desk.offsetWidth  - dragging.offsetWidth  : 9999;
        const maxY = desk ? desk.offsetHeight - dragging.offsetHeight : 9999;
        const newL = Math.min(Math.max(0, startL + e.clientX - startX), maxX);
        const newT = Math.min(Math.max(0, startT + e.clientY - startY), maxY);
        dragging.style.left  = newL + 'px';
        dragging.style.top   = newT + 'px';
        dragging.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        dragging = null;
        document.body.style.userSelect = '';
    });
})();

/* ============================================================
   TERMINAL
   ============================================================ */
const termLines = document.getElementById('termLines');
const termInput = document.getElementById('termInput');

function termLine(text, cls) {
    if (!termLines) return;
    const div = document.createElement('div');
    div.className = 'term-line' + (cls ? ' ' + cls : '');
    div.textContent = text;
    termLines.appendChild(div);
    termLines.scrollTop = termLines.scrollHeight;
}

function termBlank() { termLine('', 'empty'); }

function startTerminalBoot() {
    const row = document.getElementById('termRow');
    if (row) row.style.display = 'none';

    const boot = [
        { t: 'Initializing portfolio kernel...',     c: '',   d: 0   },
        { t: 'Loading modules...          [  OK  ]', c: 'ok', d: 200 },
        { t: 'Mounting filesystem...      [  OK  ]', c: 'ok', d: 350 },
        { t: 'Starting services...        [  OK  ]', c: 'ok', d: 500 },
        { t: '',                                      c: '',   d: 620 },
        { t: 'Welcome to Alexandre-OS v2026.1',      c: 'hi', d: 680 },
        { t: "Type 'help' for available commands.",   c: 'dim',d: 780 },
        { t: '',                                      c: '',   d: 860 },
    ];

    boot.forEach(({ t, c, d }) => setTimeout(() => termLine(t, c), d));

    setTimeout(() => {
        if (row) row.style.display = 'flex';
        termInput && termInput.focus();
    }, 950);
}

const COMMANDS = {
    help: () => {
        termBlank();
        termLine('  Commandes disponibles :', 'hi');
        termLine('');
        [
            ['whoami',   'informations sur moi'],
            ['projects', 'liste des projets'],
            ['skills',   'technologies maîtrisées'],
            ['contact',  'coordonnées'],
            ['neofetch', 'aperçu système'],
            ['clear',    'effacer le terminal'],
            ['date',     'date et heure'],
            ['echo',     'afficher du texte'],
        ].forEach(([cmd, desc]) => {
            termLine(`  ${cmd.padEnd(12)} → ${desc}`, '');
        });
        termBlank();
    },
    whoami: () => {
        termBlank();
        termLine('  ┌─────────────────────────────────────┐', 'dim');
        termLine('  │  ALEXANDRE WANG                     │', 'hi');
        termLine('  ├─────────────────────────────────────┤', 'dim');
        termLine('  │  Rôle    BUT Informatique — 2ème an │', '');
        termLine('  │  École   IUT d\'Orsay, Paris Saclay  │', '');
        termLine('  │  Ville   Vitry-sur-Seine             │', '');
        termLine('  │  Stage   20 avr — 10 juil 2026      │', 'ok');
        termLine('  ├─────────────────────────────────────┤', 'dim');
        termLine('  │  FR: Natif  ·  EN: B1  ·  ZH: C1   │', '');
        termLine('  └─────────────────────────────────────┘', 'dim');
        termBlank();
    },
    projects: () => {
        termBlank();
        termLine('  Projets :', 'hi');
        [
            ['2025-2026', 'Glitch Party',                   'Node.js, Socket.io, Three.js, Docker'],
            ['2025-2026', 'Application création groupes',   'Java, PHP, SQL'],
            ['2024-2025', 'Jeu vidéo 2D',                   'C++, Git'],
            ['2024-2025', 'Site web responsive',             'HTML, CSS'],
            ['2024-2025', 'Config Réseau & Firewall',        'Linux, Réseau'],
        ].forEach(([date, name, tech], i) => {
            termLine(`  [${i+1}] ${date}  ${name.padEnd(30)} (${tech})`, '');
        });
        termBlank();
    },
    skills: () => {
        termBlank();
        termLine('  Langages  :  Java  C++  PHP  HTML/CSS  JavaScript  SQL', '');
        termLine('  Outils    :  Git  GitHub  Docker  VS Code  Penpot', '');
        termLine('  Systèmes  :  Linux  Windows  Agile  Réseau', '');
        termBlank();
    },
    contact: () => {
        termBlank();
        termLine('  email    :  wlkalexandre55@gmail.com', 'ok');
        termLine('  tel      :  07 60 33 07 04', '');
        termLine('  linkedin :  alexandre-wang-008954309', '');
        termLine('  github   :  [à renseigner]', 'warn');
        termBlank();
    },
    neofetch: () => {
        termBlank();
        const info = [
            ['OS',      'Alexandre-OS v2026.1'],
            ['Host',    'IUT d\'Orsay, Paris Saclay'],
            ['Shell',   'portfolio.sh'],
            ['CPU',     'Intel i7-1165G7 @ 2.80GHz'],
            ['RAM',     '16384 MB'],
            ['Uptime',  document.getElementById('uptimeVal')?.textContent || '00:00:00'],
        ];
        const art = [
            '   __ __ _ ',
            '  |  V  | |',
            '  | \\_/ | |__',
            '  |_| |_|____|',
            '               ',
            '  A  W  .  d e v',
        ];
        art.forEach((line, i) => {
            const infoStr = info[i] ? `  ${info[i][0].padEnd(8)} ${info[i][1]}` : '';
            termLine((line + infoStr), i < 4 ? 'ok' : 'hi');
        });
        termBlank();
    },
    clear: () => { if (termLines) termLines.innerHTML = ''; },
    date:  () => { termLine('  ' + new Date().toLocaleString('fr-FR'), 'ok'); },
    ls:    () => COMMANDS.projects(),
};

if (termInput) {
    const history = [];
    let histIdx = -1;

    termInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const raw = termInput.value.trim();
            termInput.value = '';
            histIdx = -1;
            if (!raw) return;
            history.unshift(raw);

            termLine('alexandre@portfolio:~$ ' + raw, 'cmd');

            const [cmd, ...args] = raw.toLowerCase().split(' ');

            if (cmd === 'echo') {
                termLine('  ' + args.join(' '), 'ok');
            } else if (COMMANDS[cmd]) {
                COMMANDS[cmd]();
            } else {
                termLine(`  bash: ${cmd}: command not found`, 'err');
                termLine("  Type 'help' for available commands.", 'dim');
                termBlank();
            }
        } else if (e.key === 'ArrowUp') {
            if (histIdx < history.length - 1) termInput.value = history[++histIdx];
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            if (histIdx > 0) termInput.value = history[--histIdx];
            else { histIdx = -1; termInput.value = ''; }
            e.preventDefault();
        }
    });

    // Focus terminal on click
    document.getElementById('winTerm')?.addEventListener('click', () => termInput.focus());
}

/* ============================================================
   SYSTEM MONITOR
   ============================================================ */
(function () {
    const cpuCanvas = document.getElementById('cpuCanvas');
    const netCanvas = document.getElementById('netCanvas');
    const cpuVal    = document.getElementById('cpuVal');
    const ramBar    = document.getElementById('ramBar');
    const ramVal    = document.getElementById('ramVal');
    const netVal    = document.getElementById('netVal');
    const uptimeEl  = document.getElementById('uptimeVal');
    if (!cpuCanvas) return;

    const cpuCtx = cpuCanvas.getContext('2d');
    const netCtx = netCanvas.getContext('2d');
    const cpuData = Array(40).fill(0);
    const netData = Array(40).fill(0);
    const GREEN   = '#39e75f';
    const BGLINE  = 'rgba(57,231,95,0.06)';

    function drawGraph(ctx, data, canvas) {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = BGLINE;
        ctx.lineWidth = 0.5;
        [0.25, 0.5, 0.75].forEach(y => {
            ctx.beginPath(); ctx.moveTo(0, H * y); ctx.lineTo(W, H * y); ctx.stroke();
        });

        // Line
        ctx.beginPath();
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = GREEN;
        ctx.shadowBlur = 4;
        data.forEach((v, i) => {
            const x = (i / (data.length - 1)) * W;
            const y = H - (v / 100) * (H - 2) - 1;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill
        ctx.shadowBlur = 0;
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
        ctx.fillStyle = 'rgba(57,231,95,0.06)';
        ctx.fill();
    }

    let baseCpu = 30, baseRam = 58;
    const startTime = Date.now();

    setInterval(() => {
        // CPU
        baseCpu += (Math.random() - 0.48) * 8;
        baseCpu = Math.max(8, Math.min(88, baseCpu));
        cpuData.push(baseCpu); cpuData.shift();
        drawGraph(cpuCtx, cpuData, cpuCanvas);
        cpuVal.textContent = Math.round(baseCpu) + '%';

        // RAM
        baseRam += (Math.random() - 0.5) * 2;
        baseRam = Math.max(40, Math.min(85, baseRam));
        ramBar.style.width = baseRam + '%';
        ramVal.textContent = Math.round(baseRam) + '%';

        // NET
        const net = Math.random() * 120;
        netData.push(net); netData.shift();
        drawGraph(netCtx, netData, netCanvas);
        netVal.textContent = net < 1 ? '0 kb/s' : Math.round(net) + ' kb/s';

        // Uptime
        if (uptimeEl) {
            const s = Math.floor((Date.now() - startTime) / 1000);
            const h = String(Math.floor(s / 3600)).padStart(2,'0');
            const m = String(Math.floor((s % 3600) / 60)).padStart(2,'0');
            const sc = String(s % 60).padStart(2,'0');
            uptimeEl.textContent = `${h}:${m}:${sc}`;
        }
    }, 900);
})();

/* ============================================================
   TASK MANAGER
   ============================================================ */
(function () {
    const list = document.getElementById('taskList');
    if (!list) return;

    const PROCS = [
        { name: 'portfolio.html',  pid: 1001, baseCpu: 2.1,  mem: '45 MB'  },
        { name: 'java-runtime',    pid: 2048, baseCpu: 3.8,  mem: '312 MB' },
        { name: 'docker',          pid: 3072, baseCpu: 1.2,  mem: '256 MB' },
        { name: 'git',             pid: 512,  baseCpu: 0.1,  mem: '12 MB'  },
        { name: 'vscode',          pid: 4096, baseCpu: 1.5,  mem: '89 MB'  },
        { name: 'node',            pid: 5120, baseCpu: 0.8,  mem: '128 MB' },
        { name: 'webpack',         pid: 6144, baseCpu: 2.9,  mem: '196 MB' },
    ];

    let cpuVals = PROCS.map(p => p.baseCpu);

    function render() {
        list.innerHTML = '';
        [...PROCS]
            .map((p, i) => ({ ...p, cpu: cpuVals[i] }))
            .sort((a, b) => b.cpu - a.cpu)
            .forEach(p => {
                const row = document.createElement('div');
                row.className = 'task-row';
                const cls = p.cpu > 5 ? 'cpu-high' : p.cpu > 2 ? 'cpu-mid' : 'cpu-low';
                row.innerHTML = `
                    <span class="task-name">${p.name}</span>
                    <span class="task-pid">${p.pid}</span>
                    <span class="task-cpu ${cls}">${p.cpu.toFixed(1)}%</span>
                    <span class="task-mem">${p.mem}</span>`;
                list.appendChild(row);
            });
    }

    render();
    setInterval(() => {
        cpuVals = cpuVals.map((v, i) => {
            const next = v + (Math.random() - 0.5) * 1.2;
            return Math.max(0.1, Math.min(12, next));
        });
        render();
    }, 1200);
})();

/* ============================================================
   PROJECTS — FILTER & MODAL
   ============================================================ */
(function () {
    // Filter
    document.querySelectorAll('.proj-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.proj-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            document.querySelectorAll('.proj-card').forEach(card => {
                card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
            });
        });
    });

    // Modal
    const overlay   = document.getElementById('projModal');
    const mLabel    = document.getElementById('pmodalLabel');
    const mTitle    = document.getElementById('pmodalTitle');
    const mStar     = document.getElementById('pmodalStar');
    const mTags     = document.getElementById('pmodalTags');
    const mLinks    = document.getElementById('pmodalLinks');
    const closeBtn  = document.getElementById('pmodalClose');

    function openModal(card) {
        // Label
        mLabel.textContent = card.dataset.label || '';

        // Title
        mTitle.textContent = card.querySelector('.proj-title').textContent;

        // STAR rows
        mStar.innerHTML = '';
        card.querySelectorAll('.proj-data .star-row').forEach(row => {
            mStar.appendChild(row.cloneNode(true));
        });

        // Tags
        mTags.innerHTML = '';
        card.querySelectorAll('.proj-tags li').forEach(li => {
            const el = document.createElement('li');
            el.textContent = li.textContent;
            mTags.appendChild(el);
        });

        // Links
        mLinks.innerHTML = '';
        card.querySelectorAll('.proj-links a').forEach(a => {
            const link = document.createElement('a');
            link.href = a.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'pmodal-link';
            const icon = a.querySelector('i');
            const isGithub = icon && icon.classList.contains('fa-github');
            const isDemo   = icon && icon.classList.contains('fa-arrow-up-right-from-square');
            link.innerHTML = isGithub
                ? '<i class="fab fa-github"></i> GitHub'
                : isDemo
                    ? '<i class="fas fa-arrow-up-right-from-square"></i> Démo'
                    : a.innerHTML;
            mLinks.appendChild(link);
        });

        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.proj-more').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.closest('.proj-card')));
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
})();
