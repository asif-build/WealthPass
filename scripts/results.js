// ====================================
// WEALTHPASS — RESULTS PAGE SCRIPTS
// ====================================

const claimData = JSON.parse(sessionStorage.getItem('wp_claim_data') || '{}');
const deceasedName = claimData.deceasedName || 'Ramesh Kumar';
const claimantName = claimData.claimantName || 'Meera Kumar';
const relation = claimData.relation || 'spouse';

const relationLabel = {
  spouse: 'Spouse', son: 'Son', daughter: 'Daughter',
  father: 'Father', mother: 'Mother', brother: 'Brother', sister: 'Sister'
}[relation] || 'Spouse';

// Update dynamic text
document.getElementById('results-title').textContent = `✅ Assets Found for ${deceasedName}`;
document.getElementById('results-claimant').textContent = `Claimant: ${claimantName} (${relationLabel})`;

// Stagger asset card animations
const assetCards = document.querySelectorAll('.asset-card');
assetCards.forEach((card, i) => {
  setTimeout(() => {
    card.classList.add('visible');
  }, 200 + i * 200);
});

// Download form simulation
window.downloadForm = (institution) => {
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = '⏳ Preparing...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '✅ Form Ready';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2000);
  }, 1200);
};
