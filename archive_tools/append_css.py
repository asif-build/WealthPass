import os

css_path = r'c:\Users\DELL\Desktop\WEALTHPASS\static\css\style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

css_content = css_content.replace('--radius-lg:    4px;', '--radius-lg:    16px;')
css_content = css_content.replace('--radius-sm:    2px;', '--radius-sm:    8px;')

new_css = """
/* ── FIGMA PREMIUM ADDITIONS ── */
.grain-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 9999;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}

.hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 24px 48px -12px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.progress-container {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 3px;
  background: transparent;
  z-index: 10000;
}
.progress-bar {
  height: 100%;
  background: var(--gold);
  width: 0%;
  transition: width 0.1s ease;
}

.cookie-banner {
  position: fixed;
  bottom: -100%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  background: rgba(17, 24, 39, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  border-radius: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: bottom 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 24px 48px rgba(0,0,0,0.5);
}
.cookie-banner.show {
  bottom: 24px;
}

.form-input:focus, .form-select:focus {
  border-bottom-color: var(--verified);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);
}

.btn-primary:active {
  transform: scale(0.98);
}

.trust-bar {
  background: var(--black-soft);
  border-top: 1px solid var(--border);
  padding: 16px 0;
  text-align: center;
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--white-faint);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.floating-whatsapp {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: #25D366;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(37, 211, 102, 0.4);
  z-index: 999;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.floating-whatsapp:hover {
  transform: scale(1.1);
}

.floating-mobile-how {
  display: none;
}
@media (max-width: 768px) {
  .floating-mobile-how {
    display: flex;
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--gold);
    color: var(--black);
    padding: 12px 24px;
    border-radius: 50px;
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.1em;
    z-index: 999;
    box-shadow: 0 8px 24px rgba(201, 168, 76, 0.4);
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
  }
}

.split-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 64px;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 40px;
  position: relative;
  z-index: 10;
}
.hero-image-wrapper {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 32px 64px rgba(0,0,0,0.5);
  transform: perspective(1000px) rotateY(-5deg);
}
.hero-image-wrapper img {
  width: 100%;
  height: auto;
  display: block;
}
@media (max-width: 1024px) {
  .split-hero {
    grid-template-columns: 1fr;
    text-align: center;
    padding-top: 120px;
  }
  .hero-image-wrapper {
    transform: none;
    max-width: 600px;
    margin: 0 auto;
  }
  .split-hero .hero-cta-row {
    justify-content: center;
  }
  .split-hero .gold-rule {
    margin: 24px auto;
  }
}

/* Hamburger Menu */
.hamburger {
  display: none;
  background: none;
  border: none;
  color: var(--white);
  cursor: pointer;
}
.mobile-menu {
  position: fixed;
  top: 0; right: -100%;
  width: 80%; max-width: 400px;
  height: 100vh;
  background: var(--black-soft);
  z-index: 1001;
  padding: 80px 40px;
  transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: -24px 0 48px rgba(0,0,0,0.5);
}
.mobile-menu.open {
  right: 0;
}
.mobile-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}
.mobile-overlay.open {
  opacity: 1;
  pointer-events: all;
}
@media (max-width: 768px) {
  .hamburger { display: block; }
}

.svg-wave {
  position: absolute;
  bottom: 0; left: 0; width: 100%;
  overflow: hidden;
  line-height: 0;
}
.svg-wave svg {
  position: relative;
  display: block;
  width: calc(100% + 1.3px);
  height: 60px;
}
.svg-wave .shape-fill {
  fill: var(--black-soft);
}

.live-counter {
  font-family: monospace;
  font-size: 18px;
  color: var(--verified);
  background: rgba(5, 150, 105, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}
.live-counter .pulse {
  width: 8px; height: 8px;
  background: var(--verified);
  border-radius: 50%;
  animation: s-pulse 1.5s infinite;
}
@keyframes s-pulse {
  0% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(5, 150, 105, 0); }
  100% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
}

.test-avatar {
  width: 64px; height: 64px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 24px;
  border: 2px solid var(--border-gold);
}
.step-photo {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 24px;
}
.problem-section {
  position: relative;
  padding: var(--section-y) 0;
  background: var(--black);
}
.problem-bg {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0.05;
  pointer-events: none;
}
"""

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css_content + '\n' + new_css)
print('Updated style.css')
