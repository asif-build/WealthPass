// ====================================
// WEALTHPASS — VERIFY PAGE SCRIPTS
// ====================================

const claimData = JSON.parse(sessionStorage.getItem('wp_claim_data') || '{}');
const deceasedName = claimData.deceasedName || 'Ramesh Kumar';
const claimantName = claimData.claimantName || 'Meera Kumar';
const certNum = claimData.deathCertNum || 'DELHI-2026-DR-847291';
const aadhaar = claimData.aadhaar || '7823';

const steps = [
  {
    pending: 'Connecting to Civil Registration System...',
    done: 'Civil Registration System — Connected',
    detail: null,
    delay: 800
  },
  {
    pending: 'Verifying death certificate...',
    done: 'Death Certificate — Verified',
    detail: `${certNum} — Authenticated`,
    delay: 1600
  },
  {
    pending: 'Checking deceased Aadhaar status...',
    done: 'Aadhaar Status — Confirmed',
    detail: `XXXX-${aadhaar} — Deactivated after death — Confirmed`,
    delay: 2400
  },
  {
    pending: 'Verifying claimant identity...',
    done: 'Claimant Identity — Verified',
    detail: `${claimantName} — Aadhaar OTP Verified`,
    delay: 3200
  },
  {
    pending: 'Running AI document authenticity scan...',
    done: 'AI Document Scan — Complete',
    detail: 'Document Authenticity Score: 94/100 — No tampering detected',
    delay: 4200
  },
  {
    pending: 'Checking national fraud database...',
    done: 'Fraud Database Check — Complete',
    detail: 'No fraud flags found across 3 databases',
    delay: 5200
  }
];

// Show items one by one
steps.forEach((step, i) => {
  const checkItem = document.getElementById(`check-${i}`);

  // Make it visible after stagger
  setTimeout(() => {
    checkItem.classList.add('visible');
  }, i * 200);

  // After delay, mark as done
  setTimeout(() => {
    const icon = document.getElementById(`icon-${i}`);
    const text = document.getElementById(`text-${i}`);
    const detail = document.getElementById(`detail-${i}`);

    icon.textContent = '✅';
    text.textContent = step.done;
    text.classList.add('done');

    if (step.detail && detail) {
      detail.textContent = step.detail;
      detail.style.display = 'block';
    }
  }, step.delay);
});

// Show result after all done
const VERIFICATION_SUCCESS = true; // flip to false to demo fraud screen

setTimeout(() => {
  if (VERIFICATION_SUCCESS) {
    const result = document.getElementById('verify-result');
    result.classList.add('visible');
  } else {
    const fraud = document.getElementById('fraud-result');
    fraud.style.display = 'block';
    fraud.style.opacity = '0';
    fraud.style.transform = 'translateY(12px)';
    fraud.style.transition = 'all 0.5s ease';
    document.getElementById('fraud-ref').textContent = Math.floor(Math.random() * 9000 + 1000);
    setTimeout(() => {
      fraud.style.opacity = '1';
      fraud.style.transform = 'translateY(0)';
    }, 50);
  }
}, steps[steps.length - 1].delay + 600);
