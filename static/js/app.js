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

  /* ── NUMBER COUNTER ── */
  const counters = document.querySelectorAll('.counter');
  if(counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting) {
          const target = +entry.target.getAttribute('data-target');
          const duration = 2000;
          const step = target / (duration / 16); // 60fps
          let current = 0;
          
          const updateCounter = () => {
            current += step;
            if(current < target) {
              entry.target.innerText = Math.ceil(current).toLocaleString('en-IN');
              requestAnimationFrame(updateCounter);
            } else {
              entry.target.innerText = target.toLocaleString('en-IN');
            }
          };
          updateCounter();
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
      counterObserver.observe(counter);
    });
  }

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

  /* ── WORDS STAGGER PULL-UP ANIMATION ── */
  function splitWords(element) {
    const childNodes = Array.from(element.childNodes);
    element.innerHTML = '';
    let wordCount = 0;
    
    childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.split(/(\s+)/);
        words.forEach(word => {
          if (word.trim() === '') {
            element.appendChild(document.createTextNode(word));
          } else {
            const outer = document.createElement('span');
            outer.className = 'word-outer';
            const inner = document.createElement('span');
            inner.className = 'word-inner';
            inner.textContent = word;
            inner.dataset.index = wordCount++;
            outer.appendChild(inner);
            element.appendChild(outer);
          }
        });
      } else {
        element.appendChild(node);
      }
    });
  }

  const wordObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const inners = entry.target.querySelectorAll('.word-inner');
        inners.forEach(inner => {
          const idx = parseInt(inner.dataset.index) || 0;
          setTimeout(() => {
            inner.classList.add('visible');
          }, idx * 60);
        });
        wordObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -5% 0px'
  });

  document.querySelectorAll('.animate-words').forEach(el => {
    splitWords(el);
    wordObserver.observe(el);
  });

  /* ── LETTERS SCROLL & AUTO REVEAL ── */
  function splitLetters(element) {
    const childNodes = Array.from(element.childNodes);
    element.innerHTML = '';
    let charCount = 0;
    
    childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const chars = node.textContent.split('');
        chars.forEach(char => {
          const span = document.createElement('span');
          span.className = 'char-span';
          span.textContent = char;
          span.dataset.index = charCount++;
          element.appendChild(span);
        });
      } else {
        element.appendChild(node);
      }
    });
  }

  const letterElements = document.querySelectorAll('.animate-letters');
  letterElements.forEach(el => splitLetters(el));

  function updateLettersReveal() {
    const viewportHeight = window.innerHeight;
    const currentScroll = window.scrollY;
    
    letterElements.forEach(el => {
      const charSpans = el.querySelectorAll('.char-span');
      if (!charSpans.length) return;
      
      const rect = el.getBoundingClientRect();
      const elementHeight = rect.height;
      const elementTop = rect.top + currentScroll;
      
      const start = elementTop - viewportHeight * 0.85;
      const end = elementTop + elementHeight - viewportHeight * 0.15;
      
      let progress = (currentScroll - start) / (end - start);
      progress = Math.max(0, Math.min(1, progress));
      
      const N = charSpans.length;
      charSpans.forEach(span => {
        const idx = parseInt(span.dataset.index);
        const charProgress = idx / N;
        const rangeStart = charProgress - 0.12;
        const rangeEnd = charProgress + 0.06;
        
        let opacity = 0.2;
        if (progress <= rangeStart) {
          opacity = 0.2;
        } else if (progress >= rangeEnd) {
          opacity = 1.0;
        } else {
          opacity = 0.2 + 0.8 * ((progress - rangeStart) / (rangeEnd - rangeStart));
        }
        span.style.opacity = opacity;
      });
    });
  }

  const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 50;

  if (isScrollable) {
    window.addEventListener('scroll', updateLettersReveal, { passive: true });
    window.addEventListener('resize', updateLettersReveal, { passive: true });
    updateLettersReveal();
  } else {
    // Short page - auto-reveal on load
    let startT = null;
    function anim(timestamp) {
      if (!startT) startT = timestamp;
      const elapsed = timestamp - startT;
      const duration = 1000;
      let progress = elapsed / duration;
      progress = Math.min(1, progress);
      
      letterElements.forEach(el => {
        const charSpans = el.querySelectorAll('.char-span');
        const N = charSpans.length;
        charSpans.forEach(span => {
          const idx = parseInt(span.dataset.index);
          const charProgress = idx / N;
          const rangeStart = charProgress - 0.12;
          const rangeEnd = charProgress + 0.06;
          
          let opacity = 0.2;
          if (progress <= rangeStart) {
            opacity = 0.2;
          } else if (progress >= rangeEnd) {
            opacity = 1.0;
          } else {
            opacity = 0.2 + 0.8 * ((progress - rangeStart) / (rangeEnd - rangeStart));
          }
          span.style.opacity = opacity;
        });
      });
      if (progress < 1) {
        requestAnimationFrame(anim);
      }
    }
    requestAnimationFrame(anim);
  }

});
