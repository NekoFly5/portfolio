/* Native scrolling drives the stage. No wheel or scrolling-key interception. */
(() => {
    'use strict';

    function start() {
        const body = document.body;
        const story = document.getElementById('story');
        const stage = document.getElementById('stage');
        const scenes = Array.from(document.querySelectorAll('.scene[data-scene]'));
        if (!story || !stage || !scenes.length) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const stageSize = window.matchMedia('(min-width: 901px) and (min-height: 680px)');
        const desktopSize = window.matchMedia('(min-width: 901px)');
        const motionToggle = document.getElementById('motionToggle');
        const progressBar = document.getElementById('storyProgress');
        const chapterLabel = document.getElementById('currentChapter');
        const rail = document.getElementById('chapterRail');
        const nextButton = document.getElementById('nextScene');
        const menuToggle = document.getElementById('menuToggle');
        const mobileNav = document.getElementById('mobileNav');
        const dialog = document.getElementById('projectDialog');
        const filters = Array.from(document.querySelectorAll('[data-filter]'));
        const archiveCards = Array.from(document.querySelectorAll('.archive-card[data-category]'));
        const titles = ['Intro', 'Glitch', 'MailSummary', 'Groupes de TD', 'Compétences', 'Parcours', 'Contact'];
        const hashes = ['hero', 'projects', 'projects', 'projects', 'skills', 'experience', 'contact'];
        const layers = scenes.map(scene => ({
            inner: scene.querySelector('.scene-inner'),
            art: Array.from(scene.querySelectorAll('.project-visual, .hero-art'))
        }));
        const simpleRevealTargets = Array.from(story.querySelectorAll('.project-visual, .scene-title, .hero-title, .contact-title, .body-copy, .journey-item, .skill-row'));
        const entranceTargets = scenes.map(scene => Array.from(scene.querySelectorAll('.scene-inner > .eyebrow, .hero-title, .hero-intro, .hero-actions, .availability, .project-copy > *, .skills-title > *, .skill-row, .journey-copy > *, .contact-title, .contact-meta, .contact-email, .social-links')));
        const dialogShell = dialog?.querySelector('.dialog-shell');
        const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const fullClip = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';

        let cinematic = false;
        let simpleView = false;
        let initialized = false;
        let activeIndex = -1;
        let frame = null;
        let layoutDirty = true;
        let hashUpdatesEnabled = false;
        let step = 1;
        let storyTop = 0;
        let menuOpen = false;
        let archiveOpener = null;
        let originalOverflow = '';
        let focusDestination = null;
        let focusTimer = null;
        let revealObserver = null;
        let simpleRevealsEnabled = false;
        let targetProgress = 0;
        let renderedProgress = 0;
        let progressNeedsSnap = true;
        let lastFrameTime = 0;
        let followNativeScroll = false;
        let nativeScrollTimer = null;
        let heroReady = false;
        let heroEntrancePlayed = false;
        const copyAnimations = new Map();
        const cardAnimations = new Map();
        const lastEntranceAt = new Map();
        let dialogAnimation = null;
        let dialogFrame = null;
        let dialogPhase = 'closed';
        let dialogVersion = 0;

        const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
        const ease = value => value * value * (3 - 2 * value);
        const watch = (query, callback) => {
            if (query.addEventListener) query.addEventListener('change', callback);
            else query.addListener(callback);
        };

        // Progress is visual information, not a stream of announcements.
        chapterLabel?.setAttribute('aria-live', 'off');
        progressBar?.setAttribute('aria-hidden', 'true');
        scenes.forEach(scene => scene.classList.add('is-revealed'));

        function cancelAnimations(animations) {
            animations.forEach(animation => animation.cancel());
            animations.clear();
        }

        function trackedAnimation(target, keyframes, options, collection) {
            if (typeof target.animate !== 'function') return;
            collection.get(target)?.cancel();
            const animation = target.animate(keyframes, options);
            collection.set(target, animation);
            animation.finished.then(() => {
                if (collection.get(target) !== animation) return;
                collection.delete(target);
                animation.cancel();
            }).catch(() => {});
        }

        function revealFocusedTarget(target) {
            [copyAnimations, cardAnimations].forEach(collection => {
                collection.forEach((animation, element) => {
                    if (element !== target && !element.contains(target)) return;
                    animation.cancel();
                    collection.delete(element);
                });
            });
            target.closest('.reveal-ready')?.classList.add('is-revealed');
        }

        function playEntrance(index) {
            if (!cinematic || reducedMotion.matches || document.hidden || dialog?.open) return;
            if (index === 0 && (!heroReady || heroEntrancePlayed)) return;
            const now = performance.now();
            // Crossing back and forth over a chapter boundary should not retrigger it.
            if (now - (lastEntranceAt.get(index) ?? -Infinity) < 1400) return;
            lastEntranceAt.set(index, now);
            if (index === 0) heroEntrancePlayed = true;
            entranceTargets[index].forEach((target, order) => {
                if (target.contains(document.activeElement)) return;
                const from = { opacity: 0.48, translate: '0 18px' };
                const to = { opacity: 1, translate: '0 0' };
                if (target.matches('h1, h2')) {
                    from.clipPath = 'inset(0 0 12% 0)';
                    to.clipPath = 'inset(0 0 0% 0)';
                }
                trackedAnimation(target, [from, to], {
                    duration: target.matches('h1, h2') ? 700 : 620,
                    delay: Math.min(order * 55, 275),
                    easing: 'cubic-bezier(.18,.75,.25,1)',
                    fill: 'backwards'
                }, copyAnimations);
            });
        }

        function releaseNativeNavigation() {
            clearTimeout(nativeScrollTimer);
            nativeScrollTimer = setTimeout(() => {
                followNativeScroll = false;
                progressNeedsSnap = true;
                requestRender();
            }, 160);
        }

        function updateHash(index) {
            const hash = hashes[index] || scenes[index].id;
            if (!hash || window.location.hash === '#' + hash) return;
            try {
                const url = new URL(window.location.href);
                url.hash = hash;
                window.history.replaceState(window.history.state, '', url.href);
            } catch (_) {
                // A restricted local preview can still navigate without history access.
            }
        }

        function indexForHash(hash) {
            let anchor;
            try { anchor = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase(); }
            catch (_) { return null; }
            if (!anchor) return null;
            const sceneIndex = scenes.findIndex(scene => scene.id.toLowerCase() === anchor || scene.dataset.anchor?.toLowerCase() === anchor);
            if (sceneIndex !== -1) return sceneIndex;
            const aliases = {
                hero: 0, accueil: 0, home: 0, about: 0,
                projects: 1, projets: 1, 'projet-glitch': 1, glitch: 1,
                'projet-mail': 2, 'projet-mailsummary': 2, 'projet-mail-automation': 2, 'mail-automation': 2,
                'projet-groupes': 3, 'projet-groupes-td': 3, 'projet-group': 3, groupes: 3,
                skills: 4, competences: 4, 'compétences': 4,
                experience: 5, experiences: 5, parcours: 5, journey: 5,
                contact: 6
            };
            const index = aliases[anchor];
            return Number.isInteger(index) && index < scenes.length ? index : null;
        }

        function focusScene(index) {
            const heading = scenes[index]?.querySelector('[data-scene-title], h1, h2') || scenes[index];
            if (!heading) return;
            revealFocusedTarget(heading);
            if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
        }

        function clearPendingFocus() {
            clearTimeout(focusTimer);
            focusTimer = null;
            focusDestination = null;
        }

        function maxScroll() {
            return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        }

        function positionForScene(index) {
            if (cinematic) return clamp(storyTop + index * step, 0, maxScroll());
            const header = document.querySelector('.site-header');
            const offset = header ? Math.min(header.getBoundingClientRect().height + 20, 110) : 84;
            return clamp(window.scrollY + scenes[index].getBoundingClientRect().top - offset, 0, maxScroll());
        }

        function closeMenu(returnFocus = false) {
            if (!mobileNav || !menuToggle) return;
            const hadFocus = mobileNav.contains(document.activeElement);
            menuOpen = false;
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
            body.classList.remove('is-menu-open');
            if (hadFocus && returnFocus) menuToggle.focus({ preventScroll: true });
            else if (hadFocus && document.activeElement instanceof HTMLElement) document.activeElement.blur();
            mobileNav.hidden = true;
        }

        function openMenu() {
            if (!mobileNav || !menuToggle || desktopSize.matches) return;
            mobileNav.hidden = false;
            menuOpen = true;
            menuToggle.setAttribute('aria-expanded', 'true');
            menuToggle.setAttribute('aria-label', 'Fermer le menu');
            body.classList.add('is-menu-open');
            mobileNav.querySelector(focusableSelector)?.focus({ preventScroll: true });
        }

        function navigate(index, { focus = false, smooth = true, hash = true } = {}) {
            if (!Number.isInteger(index) || index < 0 || index >= scenes.length) return;
            const focusWasInMenu = Boolean(mobileNav?.contains(document.activeElement));
            closeMenu(false);
            if (layoutDirty) refreshLayout(false);
            storyTop = window.scrollY + story.getBoundingClientRect().top;
            const top = positionForScene(index);
            clearPendingFocus();
            if (focus || focusWasInMenu) {
                focusDestination = { index, top };
                focusTimer = setTimeout(clearPendingFocus, 2200);
            }
            if (hash) updateHash(index);
            hashUpdatesEnabled = true;
            followNativeScroll = smooth && !reducedMotion.matches;
            progressNeedsSnap = true;
            lastFrameTime = 0;
            clearTimeout(nativeScrollTimer);
            if (followNativeScroll) releaseNativeNavigation();
            window.scrollTo({ top, behavior: followNativeScroll ? 'smooth' : 'instant' });
            requestRender();
        }

        function clearSceneStyles() {
            scenes.forEach((scene, index) => {
                ['transform', 'opacity', 'clip-path', 'visibility', 'pointer-events', 'z-index'].forEach(property => scene.style.removeProperty(property));
                scene.style.removeProperty('--scene-progress');
                scene.classList.remove('is-moving');
                scene.removeAttribute('aria-hidden');
                scene.inert = false;
                const inner = layers[index].inner;
                if (inner) {
                    inner.style.removeProperty('transform');
                    inner.style.removeProperty('opacity');
                }
                layers[index].art.forEach(art => art.style.removeProperty('transform'));
            });
        }

        function syncSimpleReveals() {
            const enabled = !cinematic && !reducedMotion.matches && 'IntersectionObserver' in window;
            if (enabled === simpleRevealsEnabled) return;
            simpleRevealsEnabled = enabled;
            revealObserver?.disconnect();
            revealObserver = null;
            simpleRevealTargets.forEach(target => target.classList.remove('reveal-ready', 'is-revealed'));
            if (!enabled) return;
            // Only individual pieces enter, so a tall section never waits offscreen.
            // The CSS starts them at readable opacity; content is visible without JS.
            revealObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-revealed');
                    revealObserver?.unobserve(entry.target);
                });
            }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
            simpleRevealTargets.forEach(target => {
                target.classList.add('reveal-ready');
                revealObserver.observe(target);
            });
        }

        function refreshLayout(preserveChapter) {
            layoutDirty = false;
            progressNeedsSnap = true;
            lastFrameTime = 0;
            const nextMode = stageSize.matches && !reducedMotion.matches && !simpleView;
            const changed = cinematic !== nextMode;
            const previousIndex = Math.max(0, activeIndex);
            if (changed) {
                cancelAnimations(copyAnimations);
                clearSceneStyles();
            }
            if (reducedMotion.matches) cancelAnimations(copyAnimations);
            cinematic = nextMode;
            body.classList.toggle('is-cinematic', cinematic);
            body.classList.toggle('is-simple-mode', simpleView);
            const viewport = Math.max(1, window.innerHeight);
            step = viewport * 1.05;
            if (cinematic) story.style.height = `${viewport + step * (scenes.length - 1)}px`;
            else story.style.removeProperty('height');
            storyTop = window.scrollY + story.getBoundingClientRect().top;
            if (motionToggle) {
                motionToggle.setAttribute('aria-pressed', String(!cinematic));
                const label = motionToggle.querySelector('[data-motion-label]');
                if (label) label.textContent = cinematic ? 'Lecture simple' : 'Mode immersif';
                else motionToggle.textContent = cinematic ? 'Lecture simple' : 'Mode immersif';
                motionToggle.disabled = !stageSize.matches || reducedMotion.matches;
                motionToggle.title = reducedMotion.matches
                    ? 'Lecture simple : la réduction des mouvements est activée dans votre système.'
                    : !stageSize.matches ? 'Le mode immersif est disponible sur un écran plus large et plus haut.' : '';
            }
            if (desktopSize.matches) closeMenu(false);
            syncSimpleReveals();
            if (initialized && changed && preserveChapter) {
                clearPendingFocus();
                window.scrollTo({ top: positionForScene(previousIndex), behavior: 'instant' });
            }
        }

        function updateActive(index) {
            if (index === activeIndex) return;
            cancelAnimations(copyAnimations);
            activeIndex = index;
            scenes.forEach((scene, sceneIndex) => {
                const active = sceneIndex === index;
                scene.classList.toggle('is-active', active);
                if (cinematic) {
                    if (!active && scene.contains(document.activeElement) && document.activeElement instanceof HTMLElement) document.activeElement.blur();
                    scene.inert = !active;
                    scene.setAttribute('aria-hidden', String(!active));
                }
            });
            document.querySelectorAll('[data-goto]').forEach(button => {
                const destination = Number(button.dataset.goto);
                const selected = destination === index;
                if (rail?.contains(button)) {
                    if (selected) button.setAttribute('aria-current', 'step');
                    else button.removeAttribute('aria-current');
                } else {
                    const inProjectChapter = destination === 1 && index >= 1 && index <= 3;
                    if (selected || inProjectChapter) button.setAttribute('aria-current', 'location');
                    else button.removeAttribute('aria-current');
                }
            });
            if (chapterLabel) chapterLabel.textContent = `${String(index).padStart(2, '0')} / ${scenes[index].dataset.chapter || scenes[index].dataset.title || titles[index] || 'Chapitre'}`;
            if (nextButton) {
                nextButton.hidden = index === scenes.length - 1;
                nextButton.setAttribute('aria-label', `Chapitre suivant : ${titles[index + 1] || ''}`);
            }
            if (hashUpdatesEnabled) updateHash(index);
            playEntrance(index);
        }

        function renderCinematic(now) {
            targetProgress = clamp((window.scrollY - storyTop) / step, 0, scenes.length - 1);
            if (progressNeedsSnap || followNativeScroll || !initialized) {
                renderedProgress = targetProgress;
                progressNeedsSnap = false;
            } else {
                const gap = lastFrameTime ? now - lastFrameTime : 0;
                const elapsed = gap > 0 && gap < 120 ? clamp(gap, 1, 40) : 16.67;
                const difference = targetProgress - renderedProgress;
                const catchup = difference * (1 - Math.exp(-elapsed / 85));
                renderedProgress += clamp(catchup, -0.65, 0.65);
                if (Math.abs(targetProgress - renderedProgress) < 0.0008) renderedProgress = targetProgress;
            }
            lastFrameTime = now;
            const progress = renderedProgress;
            const base = Math.min(Math.floor(progress), scenes.length - 1);
            const local = progress - base;
            // Keep a generous reading pause, then let the wipe breathe over 36%.
            const transition = base < scenes.length - 1 ? ease(clamp((local - 0.64) / 0.36)) : 0;
            const active = transition >= 0.52 ? base + 1 : base;
            scenes.forEach((scene, index) => {
                const outgoing = index === base;
                const incoming = index === base + 1 && transition > 0;
                const visible = outgoing || incoming;
                scene.classList.toggle('is-moving', visible && transition > 0);
                scene.style.visibility = visible ? 'visible' : 'hidden';
                scene.style.pointerEvents = index === active ? 'auto' : 'none';
                scene.style.zIndex = incoming ? '2' : outgoing ? '1' : '0';
                scene.style.opacity = outgoing ? String(1 - transition * 0.38) : incoming ? '1' : '0';
                scene.style.setProperty('--scene-progress', String(clamp(progress - index, -1, 1)));
                if (!visible) return;
                if (outgoing) {
                    scene.style.clipPath = fullClip;
                    scene.style.transform = 'none';
                } else {
                    const topEdge = clamp(transition * 1.18) * 100;
                    const bottomEdge = clamp(transition * 1.18 - 0.18) * 100;
                    scene.style.clipPath = `polygon(0 0, ${topEdge.toFixed(3)}% 0, ${bottomEdge.toFixed(3)}% 100%, 0 100%)`;
                    scene.style.transform = `translate3d(${((1 - transition) * 1.2).toFixed(3)}vw, ${((1 - transition) * 4.5).toFixed(3)}vh, 0)`;
                }
                const inner = layers[index].inner;
                if (inner) {
                    inner.style.transform = transition ? `translate3d(0, ${(outgoing ? -transition * 0.8 : (1 - transition) * 1.5).toFixed(3)}vh, 0)` : 'none';
                    inner.style.opacity = String(outgoing ? 1 - transition * 0.22 : 0.7 + transition * 0.3);
                }
                layers[index].art.forEach((art, artIndex) => {
                    const depth = 1 + artIndex * 0.12;
                    const travel = outgoing ? clamp(local) : -(1 - transition);
                    const y = Math.round(-travel * window.innerHeight * 0.027 * depth);
                    art.style.transform = `translate3d(0, ${y}px, 0)`;
                });
            });
            updateActive(active);
            // Mode switches also apply this state when the active chapter is unchanged.
            scenes.forEach((scene, index) => {
                scene.inert = index !== active;
                scene.setAttribute('aria-hidden', String(index !== active));
            });
            if (progressBar) progressBar.style.transform = `scaleX(${progress / Math.max(1, scenes.length - 1)})`;
        }

        function renderSimple() {
            const readingLine = Math.min(window.innerHeight * 0.38, 330);
            let nearest = 0;
            let distance = Infinity;
            scenes.forEach((scene, index) => {
                const bounds = scene.getBoundingClientRect();
                const currentDistance = bounds.top <= readingLine && bounds.bottom > readingLine ? 0 : Math.abs(bounds.top - readingLine);
                if (currentDistance < distance) {
                    distance = currentDistance;
                    nearest = index;
                }
            });
            updateActive(nearest);
            if (progressBar) {
                const bounds = story.getBoundingClientRect();
                const total = Math.max(1, bounds.height - window.innerHeight);
                progressBar.style.transform = `scaleX(${clamp(-bounds.top / total)})`;
            }
        }

        function render(now = performance.now()) {
            frame = null;
            if (document.hidden || dialog?.open) return;
            if (layoutDirty) refreshLayout(true);
            if (cinematic) renderCinematic(now);
            else renderSimple();
            const focusSettled = !cinematic || Math.abs(renderedProgress - focusDestination?.index) < 0.012;
            if (focusDestination && focusSettled && activeIndex === focusDestination.index && Math.abs(window.scrollY - focusDestination.top) < 5) {
                const index = focusDestination.index;
                clearPendingFocus();
                focusScene(index);
            }
            initialized = true;
            if (activeIndex === 0 && heroReady && !heroEntrancePlayed) playEntrance(0);
            if (cinematic && Math.abs(targetProgress - renderedProgress) >= 0.0008) requestRender();
        }

        function requestRender() {
            if (frame === null && !document.hidden && !dialog?.open) frame = window.requestAnimationFrame(render);
        }

        function animateArchiveCards() {
            cancelAnimations(cardAnimations);
            if (reducedMotion.matches || document.hidden || !dialog?.open) return;
            archiveCards.filter(card => !card.hidden).forEach((card, index) => {
                if (card.contains(document.activeElement)) return;
                trackedAnimation(card, [
                    { opacity: 0.6, translate: '0 10px' },
                    { opacity: 1, translate: '0 0' }
                ], {
                    duration: 240,
                    delay: Math.min(index * 25, 125),
                    easing: 'cubic-bezier(.2,.75,.25,1)',
                    fill: 'backwards'
                }, cardAnimations);
            });
        }

        function setFilter(value, animate = false) {
            cancelAnimations(cardAnimations);
            const selected = value || 'all';
            filters.forEach(button => {
                const active = button.dataset.filter === selected;
                button.setAttribute('aria-pressed', String(active));
                button.classList.toggle('is-active', active);
            });
            archiveCards.forEach(card => {
                card.hidden = selected !== 'all' && !card.dataset.category.split(/\s+/).includes(selected);
                if (card.hidden && card.contains(document.activeElement)) filters.find(button => button.dataset.filter === selected)?.focus({ preventScroll: true });
            });
            if (animate) animateArchiveCards();
        }

        function cancelDialogAnimation() {
            if (dialogFrame !== null) cancelAnimationFrame(dialogFrame);
            dialogFrame = null;
            dialogAnimation?.cancel();
            dialogAnimation = null;
        }

        function animateDialogOpen() {
            const version = ++dialogVersion;
            cancelDialogAnimation();
            dialogPhase = 'open';
            dialog.classList.remove('is-closing', 'is-open');
            if (reducedMotion.matches || document.hidden || !dialogShell || typeof dialogShell.animate !== 'function') {
                dialog.classList.remove('is-opening');
                dialog.classList.add('is-open');
                return;
            }
            dialog.classList.add('is-opening');
            dialogFrame = requestAnimationFrame(() => {
                dialogFrame = null;
                if (version !== dialogVersion || !dialog.open || dialogPhase !== 'open') return;
                dialog.classList.remove('is-opening');
                dialog.classList.add('is-open');
            });
            const animation = dialogShell.animate([
                { opacity: 0.65, translate: '0 20px' },
                { opacity: 1, translate: '0 0' }
            ], { duration: 320, easing: 'cubic-bezier(.16,.8,.24,1)' });
            dialogAnimation = animation;
            animation.finished.then(() => {
                if (dialogAnimation !== animation) return;
                dialogAnimation = null;
                animation.cancel();
            }).catch(() => {});
        }

        function closeArchive({ instant = false } = {}) {
            if (!dialog?.open || (dialogPhase === 'closing' && !instant)) return;
            const version = ++dialogVersion;
            const style = dialogShell ? getComputedStyle(dialogShell) : null;
            const from = {
                opacity: style?.opacity || '1',
                translate: style?.translate && style.translate !== 'none' ? style.translate : '0 0'
            };
            cancelDialogAnimation();
            cancelAnimations(cardAnimations);
            if (instant || reducedMotion.matches || document.hidden || !dialogShell || typeof dialogShell.animate !== 'function') {
                dialog.close();
                return;
            }
            dialogPhase = 'closing';
            dialog.classList.remove('is-opening', 'is-open');
            dialog.classList.add('is-closing');
            const animation = dialogShell.animate([
                from, { opacity: 0, translate: '0 12px' }
            ], { duration: 180, easing: 'cubic-bezier(.4,0,.8,.3)', fill: 'forwards' });
            dialogAnimation = animation;
            animation.finished.then(() => {
                if (version === dialogVersion && dialogPhase === 'closing' && dialog.open) dialog.close();
            }).catch(() => {});
        }

        function finishArchiveClose() {
            if (dialogPhase === 'closed') return;
            ++dialogVersion;
            cancelDialogAnimation();
            cancelAnimations(cardAnimations);
            dialogPhase = 'closed';
            dialog.classList.remove('is-opening', 'is-open', 'is-closing');
            body.style.overflow = originalOverflow;
            if (archiveOpener?.isConnected && archiveOpener.getClientRects().length && !archiveOpener.closest('[inert]')) archiveOpener.focus({ preventScroll: true });
            else if (archiveOpener && mobileNav?.contains(archiveOpener) && menuToggle?.getClientRects().length && !menuToggle.closest('[inert]')) menuToggle.focus({ preventScroll: true });
            else focusScene(Math.max(0, activeIndex));
            archiveOpener = null;
            progressNeedsSnap = true;
            lastFrameTime = 0;
            requestRender();
        }

        function openArchive(opener) {
            if (!dialog || typeof dialog.showModal !== 'function') return;
            if (dialog.open) {
                if (dialogPhase === 'closing') animateDialogOpen();
                return;
            }
            // A native close event can still be queued when code reopens the dialog.
            if (dialogPhase !== 'closed') finishArchiveClose();
            archiveOpener = opener;
            closeMenu(false);
            clearPendingFocus();
            cancelAnimations(copyAnimations);
            if (frame !== null) cancelAnimationFrame(frame);
            frame = null;
            clearTimeout(nativeScrollTimer);
            followNativeScroll = false;
            setFilter('all');
            originalOverflow = body.style.overflow;
            dialog.classList.add('is-opening');
            dialog.showModal();
            body.style.overflow = 'hidden';
            const title = document.getElementById('archiveTitle');
            if (title) {
                if (!title.hasAttribute('tabindex')) title.tabIndex = -1;
                title.focus({ preventScroll: true });
            } else dialog.querySelector('[data-close-dialog]')?.focus({ preventScroll: true });
            animateDialogOpen();
            animateArchiveCards();
        }

        menuToggle?.addEventListener('click', () => menuOpen ? closeMenu(true) : openMenu());
        motionToggle?.addEventListener('click', () => {
            simpleView = !simpleView;
            layoutDirty = true;
            requestRender();
        });
        nextButton?.addEventListener('click', event => navigate(Math.min(activeIndex + 1, scenes.length - 1), { focus: event.detail === 0 }));

        document.addEventListener('click', event => {
            if (!(event.target instanceof Element)) return;
            const goto = event.target.closest('[data-goto]');
            if (goto) {
                if (goto instanceof HTMLAnchorElement && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
                event.preventDefault();
                navigate(Number(goto.dataset.goto), { focus: event.detail === 0 });
                return;
            }
            const opener = event.target.closest('[data-open-archive]');
            if (opener) {
                event.preventDefault();
                openArchive(opener);
                return;
            }
            if (event.target.closest('[data-close-dialog]')) {
                closeArchive();
                return;
            }
            const filter = event.target.closest('[data-filter]');
            if (filter) {
                setFilter(filter.dataset.filter, true);
                return;
            }
            const anchor = event.target.closest('a[href^="#"]');
            if (anchor && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                const index = indexForHash(anchor.getAttribute('href'));
                if (index !== null) {
                    event.preventDefault();
                    navigate(index, { focus: event.detail === 0 });
                    return;
                }
            }
            if (menuOpen && !mobileNav?.contains(event.target) && !menuToggle?.contains(event.target)) closeMenu(false);
        });

        document.addEventListener('keydown', event => {
            if (!menuOpen || !mobileNav || !menuToggle) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeMenu(true);
            } else if (event.key === 'Tab') {
                const controls = [menuToggle, ...mobileNav.querySelectorAll(focusableSelector)].filter(element => element.getClientRects().length && !element.closest('[inert]'));
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (!first) return;
                if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });

        if (dialog) {
            dialog.addEventListener('cancel', event => {
                if (reducedMotion.matches || !dialogShell || typeof dialogShell.animate !== 'function') return;
                event.preventDefault();
                closeArchive();
            });
            dialog.addEventListener('close', () => {
                if (!dialog.open) finishArchiveClose();
            });
            dialog.addEventListener('click', event => {
                if (event.target !== dialog) return;
                const bounds = dialog.getBoundingClientRect();
                if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeArchive();
            });
        }

        document.addEventListener('focusin', event => {
            if (event.target instanceof Element) revealFocusedTarget(event.target);
        });

        window.addEventListener('scroll', () => {
            hashUpdatesEnabled = initialized;
            if (followNativeScroll) releaseNativeNavigation();
            requestRender();
        }, { passive: true });
        window.addEventListener('resize', () => {
            progressNeedsSnap = true;
            layoutDirty = true;
            requestRender();
        }, { passive: true });
        window.addEventListener('hashchange', () => {
            const index = indexForHash(window.location.hash);
            if (index !== null) navigate(index, { smooth: false, hash: false });
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (frame !== null) cancelAnimationFrame(frame);
                frame = null;
                cancelAnimations(copyAnimations);
                cancelAnimations(cardAnimations);
                if (dialogPhase === 'closing') closeArchive({ instant: true });
                else if (dialog?.open) {
                    cancelDialogAnimation();
                    dialog.classList.remove('is-opening');
                    dialog.classList.add('is-open');
                }
                clearTimeout(nativeScrollTimer);
                followNativeScroll = false;
                progressNeedsSnap = true;
                lastFrameTime = 0;
            } else if (!document.hidden) {
                layoutDirty = true;
                requestRender();
            }
        });
        const changedPreference = () => {
            cancelAnimations(copyAnimations);
            cancelAnimations(cardAnimations);
            if (reducedMotion.matches && dialogPhase === 'closing') closeArchive({ instant: true });
            else if (reducedMotion.matches && dialog?.open) {
                cancelDialogAnimation();
                dialog.classList.remove('is-opening');
                dialog.classList.add('is-open');
            }
            progressNeedsSnap = true;
            layoutDirty = true;
            requestRender();
        };
        watch(reducedMotion, changedPreference);
        watch(stageSize, changedPreference);
        watch(desktopSize, changedPreference);

        closeMenu(false);
        setFilter('all');
        refreshLayout(false);
        render();
        const initialScene = indexForHash(window.location.hash);
        if (initialScene !== null) navigate(initialScene, { smooth: false, hash: false });
        const heroImage = scenes[0].querySelector('.hero-art img');
        const imageReady = heroImage && typeof heroImage.decode === 'function'
            ? heroImage.decode()
            : Promise.resolve();
        // Text stays in the document immediately; readiness only starts its flourish.
        Promise.allSettled([document.fonts?.ready || Promise.resolve(), imageReady]).then(() => {
            heroReady = true;
            requestRender();
        });
        window.addEventListener('load', () => {
            layoutDirty = true;
            requestRender();
        }, { once: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
