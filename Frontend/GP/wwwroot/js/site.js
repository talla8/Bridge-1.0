// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.


// Bridge premium interactions for all Home views
(() => {
  const main = document.querySelector('main[role="main"]');
  if (!main) return;

  document.body.classList.add('bridge-js-ready');

  // --- Cursor companion: a small, soft brand dot that gently follows the
  // pointer. Calm and education-appropriate (replaces the old large glow). ---
  const dot = document.querySelector('.bridge-cursor-dot');
  if (dot && window.matchMedia('(pointer: fine)').matches) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    window.addEventListener('pointermove', (event) => {
      document.body.classList.add('bridge-pointer-active');
      targetX = event.clientX;
      targetY = event.clientY;
    }, { passive: true });

    const ease = () => {
      currentX += (targetX - currentX) * 0.35;
      currentY += (targetY - currentY) * 0.35;
      dot.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
      requestAnimationFrame(ease);
    };
    requestAnimationFrame(ease);

    document.addEventListener('pointerdown', () => dot.classList.add('is-pressed'));
    document.addEventListener('pointerup', () => dot.classList.remove('is-pressed'));
  }

  const revealTargets = main.querySelectorAll('section, .card, form, table, .list-group, .row > [class*="col-"], .session-card, .empty-session-card');
  revealTargets.forEach((element, index) => {
    element.classList.add('bridge-reveal');
    element.style.transitionDelay = `${Math.min(index * 45, 360)}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('bridge-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach((element) => observer.observe(element));

  // Gentle hover lift only (no 3D wobble/rotation).
  const interactive = document.querySelectorAll('.btn, button, .card, .role-box, .teacher-sidebar-link, .activity-icon');
  interactive.forEach((element) => element.classList.add('bridge-magnetic'));

  document.querySelectorAll('.btn, button').forEach((button) => {
    button.style.position = button.style.position || 'relative';
    button.style.overflow = 'hidden';
    button.addEventListener('click', (event) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'bridge-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });

  document.querySelectorAll('[data-count], .bridge-count').forEach((element) => {
    const raw = element.getAttribute('data-count') || element.textContent;
    const target = Number(String(raw).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(target)) return;
    const duration = 900;
    const startTime = performance.now();
    const formatter = new Intl.NumberFormat();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatter.format(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });

  if (!sessionStorage.getItem('bridgeWelcomeShown')) {
    const toast = document.createElement('div');
    toast.className = 'bridge-toast';
    toast.textContent = 'Welcome to Bridge — your dashboard is ready.';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast.classList.remove('show'), 2800);
    setTimeout(() => toast.remove(), 3300);
    sessionStorage.setItem('bridgeWelcomeShown', 'true');
  }
})();
