import os

landing_path = r'c:\Users\DELL\Desktop\WEALTHPASS\templates\landing.html'

html = """{% extends 'core/base.html' %}
{% load static %}

{% block extra_css %}
<style>
/* Landing specifics */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--black);
  position: relative;
  overflow: hidden;
}
.hero-content {
  text-align: left;
}
.hero-top-label {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 10px;
  letter-spacing: 0.22em;
  color: var(--gold);
  margin-bottom: 24px;
  display: inline-block;
  background: rgba(201,168,76,0.1);
  padding: 6px 16px;
  border-radius: 50px;
  border: 1px solid rgba(201,168,76,0.2);
}

.numbers-section {
  padding: var(--section-y) 0;
  background: var(--black);
}
.numbers-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  max-width: var(--container);
  margin: 0 auto;
}
.number-col {
  text-align: center;
  padding: 48px;
  border-right: 1px solid var(--border);
}
.number-col:last-child { border-right: none; }
.num-val {
  font-family: var(--font-serif);
  font-weight: 300;
  font-size: 56px;
  color: var(--gold);
  line-height: 1;
}

.inst-strip {
  padding: 60px 0;
  background: var(--black-soft);
  text-align: center;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.process-section { padding: var(--section-y) 0; position: relative; }
.process-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}
.process-step {
  padding: 40px 32px;
  position: relative;
}
.process-num {
  font-family: var(--font-serif);
  font-weight: 300;
  font-size: 80px;
  color: var(--border);
  position: absolute;
  top: 16px;
  right: 24px;
  line-height: 0.8;
  z-index: 0;
}

.feature-section { padding: var(--section-y) 0; position: relative; }
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  margin-top: 80px;
}
.feature-row {
  border-top: 1px solid var(--border);
  padding: 36px 0;
  display: flex;
  gap: 32px;
}

.testimonials {
  padding: var(--section-y) 0;
  background: var(--black-soft);
}
.test-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}
.test-card {
  border-top: 2px solid var(--border-gold);
  padding: 40px 32px;
  background: var(--black);
}
.comp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.comp-card {
  border-top: 2px solid var(--border-gold);
  padding: 40px 32px;
  background: var(--black-soft);
}

@media (max-width: 1024px) {
  .numbers-grid, .comp-grid, .feature-grid { grid-template-columns: 1fr 1fr; }
  .number-col:nth-child(2) { border-right: none; }
}
@media (max-width: 768px) {
  .numbers-grid, .process-grid, .comp-grid, .feature-grid, .test-grid { grid-template-columns: 1fr; }
  .number-col { border-right: none; border-bottom: 1px solid var(--border); }
}
</style>
{% endblock %}

{% block content %}
<!-- HERO -->
<section class="hero">
  <div class="hero-glow"></div>
  <div class="split-hero">
    <div class="hero-content">
      <span class="hero-top-label scroll-reveal">INDIA'S UNCLAIMED ASSET RECOVERY PLATFORM</span>
      <h1 class="hero-h1 scroll-reveal" style="font-size: clamp(48px, 6vw, 72px);">
        Your family's money.<br>
        <span style="font-style: italic;">Found. Claimed.</span><br>
        Protected.
      </h1>
      <div class="live-counter scroll-reveal" style="margin-top:24px;">
        <div class="pulse"></div>
        ₹<span id="ticker">1,02,450,00,00,000</span> sitting unclaimed
      </div>
      <p class="text-muted scroll-reveal" style="font-size: 18px; max-width: 480px; margin-bottom: 40px;">
        Find hidden assets. Claim what's yours. Get money while you wait. We cross-reference 5 government databases in 9 seconds.
      </p>
      
      <div class="hero-cta-row scroll-reveal" style="display: flex; gap: 20px;">
        <a href="{% url 'search' %}" class="btn-primary">
          <i class="ph ph-shield-check" style="font-size:18px;"></i>
          FIND ASSETS NOW &rarr;
        </a>
      </div>

      <div style="font-family: var(--font-sans); font-weight: 400; font-size: 12px; letter-spacing: 0.1em; color: var(--white-faint); margin-top: 40px; display:flex; align-items:center; gap:16px; flex-wrap:wrap;" class="scroll-reveal">
        <span><i class="ph ph-lock-key"></i> 256-Bit SSL Encrypted</span>
        <span><i class="ph ph-fingerprint"></i> Aadhaar Verified</span>
      </div>
    </div>
    
    <div class="hero-image-wrapper scroll-reveal">
      <img src="https://images.unsplash.com/photo-1579781354199-122e2d091ab7?auto=format&fit=crop&q=80&w=800" alt="Indian Family">
    </div>
  </div>
</section>

<!-- WAVE DIVIDER -->
<div class="svg-wave">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" class="shape-fill"></path>
  </svg>
</div>

<!-- INSTITUTIONS STRIP -->
<section class="inst-strip">
  <div class="container">
    <div class="label scroll-reveal" style="margin-bottom: 32px;">TRUSTED BY & INTEGRATED WITH</div>
    <div style="display:flex; justify-content:center; gap:48px; flex-wrap:wrap; opacity:0.6; align-items:center;" class="scroll-reveal">
      <h3 style="font-family:var(--font-sans); font-weight:700; letter-spacing:0.1em; font-size:24px;">RBI</h3>
      <h3 style="font-family:var(--font-sans); font-weight:700; letter-spacing:0.1em; font-size:24px;">DigiLocker</h3>
      <h3 style="font-family:var(--font-sans); font-weight:700; letter-spacing:0.1em; font-size:24px;">EPFO</h3>
      <h3 style="font-family:var(--font-sans); font-weight:700; letter-spacing:0.1em; font-size:24px;">LIC</h3>
      <h3 style="font-family:var(--font-sans); font-weight:700; letter-spacing:0.1em; font-size:24px;">NPCI</h3>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section id="how" class="process-section">
  <div class="container">
    <div class="text-center">
      <div class="label scroll-reveal">THE PROCESS</div>
      <h2 class="section-h2 scroll-reveal">Three steps to what is yours</h2>
      <div class="gold-rule center scroll-reveal"></div>
    </div>
    
    <div class="process-grid" style="margin-top: 60px;">
      <div class="card process-step scroll-reveal">
        <div class="process-num">01</div>
        <img src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600" class="step-photo" alt="Discover">
        <div class="label" style="color: var(--gold); margin-bottom: 12px;">STEP 01</div>
        <h3 class="card-h3" style="font-size: 24px; margin-bottom: 16px;">We Find Everything</h3>
        <p class="text-muted">Enter the deceased's PAN. Five government databases. Nine seconds.</p>
      </div>
      <div class="card process-step scroll-reveal">
        <div class="process-num">02</div>
        <img src="https://images.unsplash.com/photo-1628102491629-77858ab5721d?auto=format&fit=crop&q=80&w=600" class="step-photo" alt="Claim">
        <div class="label" style="color: var(--gold); margin-bottom: 12px;">STEP 02</div>
        <h3 class="card-h3" style="font-size: 24px; margin-bottom: 16px;">Pre-Filled Paperwork</h3>
        <p class="text-muted">Every form pre-filled. Nominee status detected. Legal path determined automatically.</p>
      </div>
      <div class="card process-step scroll-reveal">
        <div class="process-num">03</div>
        <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600" class="step-photo" alt="Money">
        <div class="label" style="color: var(--gold); margin-bottom: 12px;">STEP 03</div>
        <h3 class="card-h3" style="font-size: 24px; margin-bottom: 16px;">Receive What Is Yours</h3>
        <p class="text-muted">Bridge loan in two hours. Full claim in 30 to 45 days. Your family's future secured.</p>
      </div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section class="testimonials">
  <div class="container">
    <div class="text-center">
      <div class="label scroll-reveal">WHAT FAMILIES SAY</div>
      <h2 class="section-h2 scroll-reveal">Stories of recovery</h2>
      <div class="gold-rule center scroll-reveal"></div>
    </div>
    
    <div class="test-grid" style="margin-top: 60px;">
      <div class="card test-card scroll-reveal">
        <img src="https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=200" class="test-avatar" alt="Avatar">
        <p style="font-family: var(--font-serif); font-size: 20px; font-style: italic; color: var(--white); margin-bottom: 24px;">"My father had a policy none of us knew existed. WealthPass found ₹4.2 lakh in eight seconds."</p>
        <div class="label" style="color: var(--white-faint);">ANANYA SHARMA</div>
        <div style="font-family: var(--font-sans); font-weight: 300; font-size: 12px; color: var(--gold); margin-top: 4px;">Delhi | ₹4.2L Recovered</div>
      </div>
      <div class="card test-card scroll-reveal">
        <img src="https://images.unsplash.com/photo-1555952517-2e8e729e0b44?auto=format&fit=crop&q=80&w=200" class="test-avatar" alt="Avatar">
        <p style="font-family: var(--font-serif); font-size: 20px; font-style: italic; color: var(--white); margin-bottom: 24px;">"Rent was due. The claim would take two months. The bridge loan saved our family from eviction."</p>
        <div class="label" style="color: var(--white-faint);">VIKRAM NAIR</div>
        <div style="font-family: var(--font-sans); font-weight: 300; font-size: 12px; color: var(--gold); margin-top: 4px;">Bangalore | Bridge Loan</div>
      </div>
      <div class="card test-card scroll-reveal">
        <img src="https://images.unsplash.com/photo-1605406575497-2e5f039a0445?auto=format&fit=crop&q=80&w=200" class="test-avatar" alt="Avatar">
        <p style="font-family: var(--font-serif); font-size: 20px; font-style: italic; color: var(--white); margin-bottom: 24px;">"Three accounts and a provident fund. ₹8.6 lakh my husband had. I would never have known."</p>
        <div class="label" style="color: var(--white-faint);">MEENA PILLAI</div>
        <div style="font-family: var(--font-sans); font-weight: 300; font-size: 12px; color: var(--gold); margin-top: 4px;">Chennai | ₹8.6L Recovered</div>
      </div>
    </div>
  </div>
</section>

<!-- CAPABILITIES / PROBLEM -->
<section class="feature-section problem-section">
  <img src="https://images.unsplash.com/photo-1541354329998-f4d9a9f929d4?auto=format&fit=crop&q=80&w=1200" class="problem-bg" alt="Bank Texture">
  <div class="container" style="position:relative; z-index:10;">
    <div class="label scroll-reveal">CAPABILITIES</div>
    <h2 class="section-h2 scroll-reveal">Built for India's hardest moment</h2>
    <div class="gold-rule scroll-reveal"></div>
    <p class="text-muted scroll-reveal" style="font-size: 18px; max-width: 560px; margin-top: 24px;">
      When a family loses someone, the financial burden should not compound the grief. WealthPass ensures it doesn't.
    </p>
    
    <div class="feature-grid">
      <div class="feature-list">
        <div class="feature-row scroll-reveal">
          <div style="font-family: var(--font-serif); font-size: 24px; color: var(--white-faint);">01</div>
          <div>
            <h3 style="font-family: var(--font-serif); font-weight: 500; font-size: 24px; color: var(--white); margin-bottom: 8px;">Multi-Database Discovery</h3>
            <p class="text-muted">EPFO. LIC. SBI. MF Central. RBI DEAF. Simultaneously.</p>
          </div>
        </div>
        <div class="feature-row scroll-reveal">
          <div style="font-family: var(--font-serif); font-size: 24px; color: var(--white-faint);">02</div>
          <div>
            <h3 style="font-family: var(--font-serif); font-weight: 500; font-size: 24px; color: var(--white); margin-bottom: 8px;">Nominee vs Legal Heir Detection</h3>
            <p class="text-muted">The distinction that costs families crores. Detected automatically.</p>
          </div>
        </div>
        <div class="feature-row scroll-reveal">
          <div style="font-family: var(--font-serif); font-size: 24px; color: var(--white-faint);">03</div>
          <div>
            <h3 style="font-family: var(--font-serif); font-weight: 500; font-size: 24px; color: var(--white); margin-bottom: 8px;">Bridge Loan in 60 Seconds</h3>
            <p class="text-muted">Your verified claim as collateral. Money before the process ends.</p>
          </div>
        </div>
      </div>
      
      <!-- Fake UI Preview inside a card -->
      <div class="card scroll-reveal" style="background: rgba(255,255,255,0.95); color: #111; padding: 40px; border-radius: 16px; border:1px solid rgba(0,0,0,0.1);">
        <div style="font-family: var(--font-sans); font-size: 10px; font-weight: 700; letter-spacing: 0.25em; color: #999;">WEALTHPASS REPORT</div>
        <div style="height: 1px; background: #e0e0e0; margin: 16px 0 32px;"></div>
        <h3 style="font-family: var(--font-serif); font-size: 26px; font-weight: 600; margin-bottom: 24px;">Asset Discovery</h3>
        
        <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px;">
          <div style="display: flex; justify-content: space-between; border-left: 3px solid #3b82f6; padding-left: 14px;">
            <span>LIC Insurance</span><span style="font-weight: 600;">₹5,00,000</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-left: 3px solid #16a34a; padding-left: 14px;">
            <span>EPFO PF</span><span style="font-weight: 600;">₹1,42,000</span>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 20px 0; border-top: 1px solid #e0e0e0;">
          <span style="font-weight: 600;">TOTAL</span><span style="font-family: var(--font-serif); font-size: 32px; font-weight: 700; color: #059669;">₹6,42,000</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- COMPLIANCE -->
<section class="compliance" style="padding: var(--section-y) 0; border-top:1px solid var(--border);">
  <div class="container">
    <div class="text-center">
      <div class="label scroll-reveal">LEGAL FOUNDATION</div>
      <h2 class="section-h2 scroll-reveal">Built on India's infrastructure</h2>
      <div class="gold-rule center scroll-reveal"></div>
    </div>
    
    <div class="comp-grid" style="margin-top: 60px;">
      <div class="card comp-card scroll-reveal">
        <div class="label" style="color:var(--gold); margin-bottom:12px;">RBI</div>
        <h3 style="font-family:var(--font-serif); font-size:22px; color:var(--white); margin-bottom:8px;">Account Aggregator Hub</h3>
        <p class="text-muted" style="font-size:14px;">Strictly consent-based data polling matching RBI mandate standards.</p>
      </div>
      <div class="card comp-card scroll-reveal">
        <div class="label" style="color:var(--gold); margin-bottom:12px;">IRDAI</div>
        <h3 style="font-family:var(--font-serif); font-size:22px; color:var(--white); margin-bottom:8px;">Bima Sugam Exchange</h3>
        <p class="text-muted" style="font-size:14px;">Certified queries into India's central insurance repository.</p>
      </div>
      <div class="card comp-card scroll-reveal">
        <div class="label" style="color:var(--gold); margin-bottom:12px;">EPFO</div>
        <h3 style="font-family:var(--font-serif); font-size:22px; color:var(--white); margin-bottom:8px;">Unified Portal Protocol</h3>
        <p class="text-muted" style="font-size:14px;">Encrypted access bypassing legacy bottlenecks.</p>
      </div>
      <div class="card comp-card scroll-reveal">
        <div class="label" style="color:var(--gold); margin-bottom:12px;">UIDAI</div>
        <h3 style="font-family:var(--font-serif); font-size:22px; color:var(--white); margin-bottom:8px;">Aadhaar Biometric</h3>
        <p class="text-muted" style="font-size:14px;">Military-grade AUA verification eliminating impersonation.</p>
      </div>
    </div>
  </div>
</section>

<!-- TRUST BAR -->
<div class="trust-bar">
  <span><i class="ph ph-shield-check"></i> 256-Bit SSL</span>
  <span>&middot;</span>
  <span><i class="ph ph-fingerprint"></i> Aadhaar Verified</span>
  <span>&middot;</span>
  <span><i class="ph ph-bank"></i> RBI Compliant</span>
  <span>&middot;</span>
  <span><i class="ph ph-database"></i> Zero Data Sold</span>
</div>

<a href="#how" class="floating-mobile-how">
  <i class="ph ph-play-circle" style="font-size:18px;"></i> HOW IT WORKS IN 60s
</a>
<a href="#" class="floating-whatsapp">
  <i class="ph ph-whatsapp-logo" style="font-size:32px;"></i>
</a>

<script>
// Ticker
setInterval(() => {
  const ticker = document.getElementById('ticker');
  if(ticker) {
    let base = 1024500000000;
    base += Math.floor(Math.random() * 1000);
    ticker.innerText = base.toLocaleString('en-IN');
  }
}, 3000);
</script>
{% endblock %}
"""

with open(landing_path, 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated landing.html')
