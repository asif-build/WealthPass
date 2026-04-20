// ====================================
// WEALTHPASS — LOAN PAGE SCRIPTS
// ====================================

const checkbox = document.getElementById('affidavit-check');
const ctaBtn = document.getElementById('loan-cta');

checkbox.addEventListener('change', () => {
  if (checkbox.checked) {
    ctaBtn.classList.remove('disabled');
    ctaBtn.style.opacity = '1';
    ctaBtn.style.pointerEvents = 'auto';
    ctaBtn.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.5)';
  } else {
    ctaBtn.classList.add('disabled');
    ctaBtn.style.opacity = '0.4';
    ctaBtn.style.pointerEvents = 'none';
    ctaBtn.style.boxShadow = 'none';
  }
});

// Prevent click if disabled (extra safety)
ctaBtn.addEventListener('click', (e) => {
  if (ctaBtn.classList.contains('disabled')) {
    e.preventDefault();
    return;
  }
  ctaBtn.textContent = '⏳ Processing...';
});
