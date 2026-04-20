// ====================================
// WEALTHPASS — SEARCH PAGE SCRIPTS
// ====================================

// ---- FILE UPLOAD ----
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('death-cert-file');
const uploadIdle = document.getElementById('upload-idle');
const uploadPreview = document.getElementById('upload-preview');
const previewName = document.getElementById('preview-name');
const previewSize = document.getElementById('preview-size');

const showPreview = (file) => {
  previewName.textContent = file.name;
  const kb = file.size / 1024;
  const size = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  previewSize.textContent = `${size} • Uploaded`;
  uploadIdle.style.display = 'none';
  uploadPreview.classList.add('show');
};

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) showPreview(e.target.files[0]);
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) {
    fileInput.files = e.dataTransfer.files;
    showPreview(file);
  }
});

// ---- PAN AUTO UPPERCASE ----
const panInput = document.getElementById('pan-number');
panInput.addEventListener('input', () => {
  panInput.value = panInput.value.toUpperCase();
});

// ---- FORM SUBMIT ----
const form = document.getElementById('search-form');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Store form data in session
  const data = {
    deceasedName: document.getElementById('deceased-name').value || 'Ramesh Kumar',
    pan: document.getElementById('pan-number').value || 'ABCDE1234F',
    deathCertNum: document.getElementById('death-cert-num').value || 'DELHI-2026-DR-847291',
    claimantName: document.getElementById('claimant-name').value || 'Meera Kumar',
    aadhaar: document.getElementById('aadhaar-last4').value || '7823',
    relation: document.getElementById('relation').value || 'spouse',
    mobile: document.getElementById('mobile').value || '9876543210'
  };

  sessionStorage.setItem('wp_claim_data', JSON.stringify(data));

  // Button loading state
  submitBtn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:10px;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
    Scanning databases...
  </span>`;
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.75';

  setTimeout(() => {
    window.location.href = 'verify.html';
  }, 1800);
});
