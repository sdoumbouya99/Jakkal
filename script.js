/* ═══════════════════════════════════════════════════════════
   JAKKAL — Pitch Deck Script
   Handles: slide navigation, reveal animations,
            stat counters, cursor, keyboard/swipe, progress
═══════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ─── STATE ─────────────────────────────────────────────── */
  const TOTAL_SLIDES = 11;
  let current = 0;
  let isAnimating = false;
  let touchStartX = 0;
  let touchStartY = 0;

  /* ─── ELEMENTS ───────────────────────────────────────────── */
  const deck       = document.getElementById('deck');
  const slides     = Array.from(document.querySelectorAll('.slide'));
  const dots       = Array.from(document.querySelectorAll('.nav-dot'));
  const slideNum   = document.getElementById('slideNum');
  const progressBar = document.getElementById('progressBar');
  const arrowPrev  = document.getElementById('arrowPrev');
  const arrowNext  = document.getElementById('arrowNext');
  const cursor     = document.getElementById('cursor');
  const cursorTrail = document.getElementById('cursorTrail');

  /* ─── CURSOR ─────────────────────────────────────────────── */
  let mouseX = 0, mouseY = 0;
  let trailX = 0, trailY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // Smooth trail with rAF
  function animateTrail() {
    trailX += (mouseX - trailX) * 0.14;
    trailY += (mouseY - trailY) * 0.14;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top  = trailY + 'px';
    requestAnimationFrame(animateTrail);
  }
  animateTrail();

  /* ─── REVEAL ANIMATION ───────────────────────────────────── */
  function triggerReveals(slide) {
    const els = slide.querySelectorAll('.reveal');
    // Reset first
    els.forEach(el => el.classList.remove('in'));
    // Then stagger in
    requestAnimationFrame(() => {
      els.forEach(el => {
        requestAnimationFrame(() => el.classList.add('in'));
      });
    });
  }

  /* ─── STAT COUNTER ───────────────────────────────────────── */
  function animateCounters(slide) {
    const counters = slide.querySelectorAll('.stat-number[data-target]');
    counters.forEach(el => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.textContent.startsWith('$') ? '$' : '';
      const duration = 1400;
      const start = performance.now();

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out expo
        const eased = 1 - Math.pow(2, -10 * progress);
        const value = target * eased;

        if (target === 0) {
          el.textContent = '0';
        } else if (target < 5) {
          el.textContent = prefix + value.toFixed(1) + suffix;
        } else {
          el.textContent = prefix + Math.round(value) + suffix;
        }

        if (progress < 1) requestAnimationFrame(step);
        else {
          if (target === 0) el.textContent = '0';
          else el.textContent = prefix + (target % 1 !== 0 ? target.toFixed(1) : target) + suffix;
        }
      }

      requestAnimationFrame(step);
    });
  }

  /* ─── PROGRESS ───────────────────────────────────────────── */
  function updateProgress(index) {
    const pct = ((index) / (TOTAL_SLIDES - 1)) * 100;
    progressBar.style.width = pct + '%';
  }

  /* ─── NAV UI ─────────────────────────────────────────────── */
  function updateNav(index) {
    // Dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    // Counter (01, 02 … 11)
    slideNum.textContent = String(index + 1).padStart(2, '0');
    // Arrows
    arrowPrev.classList.toggle('hidden', index === 0);
    arrowNext.classList.toggle('hidden', index === TOTAL_SLIDES - 1);
    // Progress
    updateProgress(index);
  }

  /* ─── SLIDE TRANSITION ───────────────────────────────────── */
  function goTo(index, direction = 1) {
    if (isAnimating || index === current) return;
    if (index < 0 || index >= TOTAL_SLIDES) return;

    isAnimating = true;

    const outSlide  = slides[current];
    const inSlide   = slides[index];

    // Set up incoming slide position (off-screen)
    inSlide.classList.remove('is-active', 'is-prev');
    inSlide.style.transform = direction > 0 ? 'translateX(100%)' : 'translateX(-100%)';
    inSlide.style.opacity = '0';
    inSlide.style.pointerEvents = 'none';

    // Force reflow
    void inSlide.offsetWidth;

    // Animate out
    outSlide.style.transform = direction > 0 ? 'translateX(-100%)' : 'translateX(100%)';
    outSlide.style.opacity = '0';

    // Animate in
    inSlide.style.transform = 'translateX(0)';
    inSlide.style.opacity = '1';
    inSlide.classList.add('is-active');
    inSlide.style.pointerEvents = 'all';

    // Update state
    current = index;
    updateNav(current);

    // Trigger content animations
    triggerReveals(inSlide);
    animateCounters(inSlide);

    // Release lock
    setTimeout(() => {
      outSlide.classList.remove('is-active');
      outSlide.classList.add('is-prev');
      isAnimating = false;
    }, 780);
  }

  /* ─── INIT ───────────────────────────────────────────────── */
  function init() {
    // Show only first slide
    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-prev');
      if (i !== 0) {
        s.style.transform = 'translateX(100%)';
        s.style.opacity = '0';
        s.style.pointerEvents = 'none';
      }
    });

    slides[0].classList.add('is-active');
    slides[0].style.transform = 'translateX(0)';
    slides[0].style.opacity = '1';
    slides[0].style.pointerEvents = 'all';

    updateNav(0);
    triggerReveals(slides[0]);
    animateCounters(slides[0]);
  }

  /* ─── KEYBOARD ───────────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        goTo(current + 1, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        goTo(current - 1, -1);
        break;
      case 'Home':
        e.preventDefault();
        goTo(0, -1);
        break;
      case 'End':
        e.preventDefault();
        goTo(TOTAL_SLIDES - 1, 1);
        break;
    }
  });

  /* ─── DOT CLICKS ─────────────────────────────────────────── */
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.slide, 10);
      const dir = idx > current ? 1 : -1;
      goTo(idx, dir);
    });
  });

  /* ─── ARROW CLICKS ───────────────────────────────────────── */
  arrowPrev.addEventListener('click', () => goTo(current - 1, -1));
  arrowNext.addEventListener('click', () => goTo(current + 1, 1));

  /* ─── TOUCH / SWIPE ──────────────────────────────────────── */
  deck.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  deck.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Only fire if horizontal swipe dominates
    if (absDx > 40 && absDx > absDy * 1.5) {
      if (dx < 0) goTo(current + 1, 1);
      else        goTo(current - 1, -1);
    }
  }, { passive: true });

  /* ─── MOUSE WHEEL ────────────────────────────────────────── */
  let wheelCooldown = false;
  deck.addEventListener('wheel', (e) => {
    if (wheelCooldown) return;
    wheelCooldown = true;
    setTimeout(() => { wheelCooldown = false; }, 900);

    if (e.deltaY > 0 || e.deltaX > 0) goTo(current + 1, 1);
    else                               goTo(current - 1, -1);
  }, { passive: true });

  /* ─── VOICE BARS ON SLIDE 3 ──────────────────────────────── */
  // Re-trigger animation on slide enter (handled via CSS animation)
  // No extra JS needed — CSS @keyframes on .voice-bars span runs forever

  /* ─── PROJ BARS — reset on leave ────────────────────────── */
  // CSS handles :is-active state — transition resets when class removed
  // Handled above in goTo via classList management

  /* ─── RUN ────────────────────────────────────────────────── */
  init();

})();
