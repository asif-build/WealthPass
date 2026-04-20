/* 
   WEALTHPASS — JS ENGINE
   Rolex Philosophy: Slow. Deliberate. Never Playful.
*/

document.addEventListener('DOMContentLoaded', () => {

  /* ── SCROLL REVEAL ── */
  const revealElements = document.querySelectorAll('.scroll-reveal');
  
  if(revealElements.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if(entry.isIntersecting) {
          // Stagger by index for grouped elements
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });
    
    revealElements.forEach((el, i) => {
      // Auto-stagger siblings that are direct children of the same parent
      const siblings = [...el.parentElement.querySelectorAll('.scroll-reveal')];
      const siblingIndex = siblings.indexOf(el);
      if(siblingIndex > 0) {
        el.dataset.delay = siblingIndex * 120;
      }
      observer.observe(el);
    });
  }

  /* ── PAGE LOAD FADE ── */
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });

  /* ── GOLD RULE DRAW ── */
  const goldRules = document.querySelectorAll('.gold-rule');
  const ruleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.style.transition = 'width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
        entry.target.style.width = '40px';
        ruleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  goldRules.forEach(rule => {
    rule.style.width = '0';
    ruleObserver.observe(rule);
  });

  /* ── NAVBAR SCROLL TRANSPARENCY ── */
  const navbar = document.querySelector('.navbar');
  if(navbar) {
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if(y > 80) {
        navbar.style.borderBottomColor = 'rgba(26,26,26,0.8)';
      } else {
        navbar.style.borderBottomColor = 'var(--border)';
      }
      lastY = y;
    }, { passive: true });
  }

  /* ── ACTIVE NAV LINK ── */
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if(link.getAttribute('href') === path) {
      link.classList.add('active');
    }
  });

});
