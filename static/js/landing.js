document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const navbar = document.getElementById("landingNav");
  const progressBar = document.getElementById("progressBar");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileOverlay = document.getElementById("mobileOverlay");
  const openMenu = document.getElementById("openMenu");
  const closeMenu = document.getElementById("closeMenu");
  const menuLinks = document.querySelectorAll(".mobile-link");
  const ticker = document.getElementById("ticker");
  const floatCards = document.querySelectorAll(".float-card");
  const heroVisual = document.querySelector(".hero-visual");

  const formatIndianNumber = (value) => new Intl.NumberFormat("en-IN").format(value);

  const setProgress = () => {
    if (!progressBar) {
      return;
    }

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = `${percent}%`;
  };

  const syncNavbar = () => {
    if (!navbar) {
      return;
    }

    navbar.classList.toggle("scrolled", window.scrollY > 10);
  };

  const closeMobileMenu = () => {
    if (!mobileMenu || !mobileOverlay || !openMenu) {
      return;
    }

    mobileMenu.classList.remove("open");
    mobileOverlay.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    openMenu.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
  };

  const openMobileMenu = () => {
    if (!mobileMenu || !mobileOverlay || !openMenu) {
      return;
    }

    mobileMenu.classList.add("open");
    mobileOverlay.classList.add("open");
    mobileMenu.setAttribute("aria-hidden", "false");
    openMenu.setAttribute("aria-expanded", "true");
    body.classList.add("menu-open");
  };

  if (openMenu) {
    openMenu.addEventListener("click", openMobileMenu);
  }

  if (closeMenu) {
    closeMenu.addEventListener("click", closeMobileMenu);
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener("click", closeMobileMenu);
  }

  menuLinks.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  const revealElements = document.querySelectorAll(".scroll-reveal");

  if ("IntersectionObserver" in window && revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -60px 0px",
      }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("visible"));
  }

  const counters = document.querySelectorAll(".counter");

  if ("IntersectionObserver" in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const counter = entry.target;
          const target = Number(counter.dataset.target || 0);
          const duration = 1200;
          const start = performance.now();

          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            counter.textContent = Math.floor(target * progress).toString();

            if (progress < 1) {
              window.requestAnimationFrame(animate);
            } else {
              counter.textContent = target.toString();
            }
          };

          window.requestAnimationFrame(animate);
          observer.unobserve(counter);
        });
      },
      {
        threshold: 0.5,
      }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach((counter) => {
      counter.textContent = counter.dataset.target || "0";
    });
  }

  let tickerValue = 1024500000000;

  const syncTicker = () => {
    if (ticker) {
      ticker.textContent = formatIndianNumber(tickerValue);
    }

  };

  syncTicker();

  window.setInterval(() => {
    tickerValue += Math.floor(Math.random() * 900000) + 120000;
    syncTicker();
  }, 3200);

  if (heroVisual && window.matchMedia("(pointer:fine)").matches) {
    heroVisual.addEventListener("mousemove", (event) => {
      const rect = heroVisual.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const offsetX = (event.clientX - centerX) / rect.width;
      const offsetY = (event.clientY - centerY) / rect.height;

      floatCards.forEach((card, index) => {
        const depth = (index + 1) * 6;
        card.style.transform = `translate3d(${offsetX * depth}px, ${offsetY * depth}px, 0)`;
      });
    });

    heroVisual.addEventListener("mouseleave", () => {
      floatCards.forEach((card) => {
        card.style.transform = "";
      });
    });
  }

  const onScroll = () => {
    syncNavbar();
    setProgress();
  };

  syncNavbar();
  setProgress();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", setProgress);
});
