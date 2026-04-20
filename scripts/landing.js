// ====================================
// WEALTHPASS — LANDING PAGE SCRIPTS
// ====================================

// ---- NAV SCROLL EFFECT ----
const nav = document.querySelector('.landing-nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}, { passive: true });

// ---- COUNT UP ANIMATION ----
const statCards = document.querySelectorAll('.stat-card');

const formatNumber = (val, suffix, prefix) => {
  if (prefix !== undefined && prefix === '') {
    return val + suffix;
  }
  return '₹' + val.toLocaleString('en-IN') + suffix;
};

const animateCount = (element, target, suffix, prefix) => {
  const duration = 2000;
  const start = performance.now();
  const isRupee = (prefix === undefined);

  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(ease * target);
    if (isRupee) {
      element.textContent = '₹' + current.toLocaleString('en-IN') + suffix;
    } else {
      element.textContent = current + suffix;
    }
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };
  requestAnimationFrame(update);
};

// Intersection Observer for stats
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const card = entry.target;
      const idx = [...statCards].indexOf(card);
      const target = parseInt(card.dataset.target);
      const suffix = card.dataset.suffix || '';
      const prefix = card.dataset.prefix;
      const numEl = document.getElementById(`stat-${idx}`);
      animateCount(numEl, target, suffix, prefix);
      statsObserver.unobserve(card);
    }
  });
}, { threshold: 0.3 });

statCards.forEach(card => statsObserver.observe(card));

// ---- HERO FADE IN ----
document.querySelectorAll('.hero-content > *').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`;
  requestAnimationFrame(() => {
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 80 + i * 100);
  });
});

// ---- STEP CARDS OBSERVER ----
const stepCards = document.querySelectorAll('.step-card');
const stepObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '0';
      entry.target.style.transform = 'translateY(20px)';
      entry.target.style.transition = `opacity 0.5s ease, transform 0.5s ease`;
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, ([...stepCards].indexOf(entry.target)) * 150);
      stepObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

stepCards.forEach(c => { c.style.opacity = '0'; stepObserver.observe(c); });

// ---- WHY CARDS ----
const whyCards = document.querySelectorAll('.why-card');
const whyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const i = [...whyCards].indexOf(entry.target);
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 100);
      whyObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

whyCards.forEach(c => {
  c.style.opacity = '0';
  c.style.transform = 'translateY(16px)';
  c.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  whyObserver.observe(c);
});
