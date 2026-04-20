// ====================================
// WEALTHPASS — SUCCESS PAGE SCRIPTS
// ====================================

// ---- CONFETTI ----
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const colors = [
  '#667eea', '#764ba2', '#4ade80', '#f59e0b',
  '#f87171', '#a78bfa', '#34d399', '#fbbf24'
];

const particles = [];

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = -10;
    this.size = Math.random() * 8 + 4;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.speedY = Math.random() * 3 + 2;
    this.speedX = (Math.random() - 0.5) * 3;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 6;
    this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
    this.opacity = 1;
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX;
    this.rotation += this.rotationSpeed;
    if (this.y > canvas.height - 50) {
      this.opacity -= 0.03;
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;

    if (this.shape === 'rect') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

let animActive = true;
let frameCount = 0;

function spawnParticles() {
  for (let i = 0; i < 5; i++) {
    particles.push(new Particle());
  }
}

function animateConfetti() {
  if (!animActive) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  frameCount++;
  if (frameCount < 120) { // ~4 seconds of spawning
    spawnParticles();
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].opacity <= 0 || particles[i].y > canvas.height + 20) {
      particles.splice(i, 1);
    }
  }

  if (particles.length > 0 || frameCount < 120) {
    requestAnimationFrame(animateConfetti);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animActive = false;
  }
}

animateConfetti();

// ---- PROGRESS BARS ----
const progressValues = [40, 22, 75];
const statuses = ['Submitted', 'In Progress', 'Processing'];

setTimeout(() => {
  progressValues.forEach((val, i) => {
    const bar = document.getElementById(`progress-${i}`);
    if (bar) {
      setTimeout(() => {
        bar.style.width = val + '%';
      }, i * 300);
    }
  });
}, 600);

// ---- BUTTON ACTIONS ----
window.handleDownload = () => {
  const btn = event.target.closest('button');
  btn.textContent = '⏳ Opening App Store...';
  setTimeout(() => {
    btn.textContent = '✅ Coming Soon!';
    setTimeout(() => {
      btn.textContent = '📱 Download WealthPass App';
    }, 2000);
  }, 1200);
};

window.handleShare = () => {
  if (navigator.share) {
    navigator.share({
      title: 'WealthPass — Find Unclaimed Assets',
      text: 'I found ₹6,80,000 in unclaimed assets for my family using WealthPass. If you\'ve lost a loved one, check what\'s rightfully yours.',
      url: 'https://wealthpass.in'
    }).catch(() => {});
  } else {
    const text = 'WealthPass helped me find ₹6,80,000 in unclaimed assets. Check yours at wealthpass.in';
    navigator.clipboard.writeText(text).then(() => {
      const btn = event.target.closest('button');
      btn.textContent = '✅ Link Copied!';
      setTimeout(() => { btn.textContent = '🔗 Share Your Story'; }, 2000);
    });
  }
};
