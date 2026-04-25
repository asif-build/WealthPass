import os

base_path = r'c:\Users\DELL\Desktop\WEALTHPASS\templates\core\base.html'
with open(base_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add progress bar and grain overlay right after <body>
body_insert = """
  <div class="progress-container"><div class="progress-bar" id="progressBar"></div></div>
  <div class="grain-overlay"></div>
  
  <div class="mobile-overlay" id="mobileOverlay"></div>
  <div class="mobile-menu" id="mobileMenu">
    <button class="hamburger" id="closeMenu" style="display:block; margin-bottom: 40px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
    <div style="display:flex; flex-direction:column; gap:24px;">
      <a href="/" style="font-family:var(--font-sans); font-size:18px; color:var(--white);">Home</a>
      <a href="#" style="font-family:var(--font-sans); font-size:18px; color:var(--white);">Security Process</a>
      <a href="#" style="font-family:var(--font-sans); font-size:18px; color:var(--white);">Legal Mandate</a>
      <a href="/search/" style="color:var(--gold); font-family:var(--font-sans); font-size:18px; margin-top:24px;">FIND ASSETS &rarr;</a>
    </div>
  </div>
"""
content = content.replace('<body>', '<body>\n' + body_insert)

# Add hamburger to navbar
nav_link_end = '<a href="{% url \'search\' %}" class="nav-cta">FIND ASSETS</a>'
hamburger = """
      <button class="hamburger" id="openMenu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
"""
content = content.replace(nav_link_end, nav_link_end + '\n' + hamburger)

# Add Phosphor icons to head
phosphor = '<script src="https://unpkg.com/@phosphor-icons/web"></script>'
content = content.replace('</head>', phosphor + '\n</head>')

# Add cookie banner and JS at the end
js_insert = """
  <!-- Cookie Banner -->
  <div class="cookie-banner" id="cookieBanner">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <h4 style="font-family:var(--font-sans); color:var(--white); font-size:16px; margin-bottom:8px;">We value your privacy</h4>
        <p style="font-family:var(--font-sans); color:var(--white-faint); font-size:13px; line-height:1.6; max-width:400px;">
          WealthPass uses cookies strictly for session management and security. No tracking. No third-party data sales.
        </p>
      </div>
      <i class="ph ph-shield-check" style="font-size:32px; color:var(--gold);"></i>
    </div>
    <div style="display:flex; gap:12px; margin-top:8px;">
      <button class="btn-primary" id="acceptCookies" style="padding:10px 24px;">ACCEPT ALL</button>
      <button class="btn-secondary" style="padding:10px 24px;">MANAGE</button>
    </div>
  </div>

  <script>
    // Scroll Progress
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      document.getElementById('progressBar').style.width = scrolled + '%';
    });

    // Mobile Menu
    const openMenu = document.getElementById('openMenu');
    const closeMenu = document.getElementById('closeMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');

    if (openMenu) {
      openMenu.addEventListener('click', () => {
        mobileMenu.classList.add('open');
        overlay.classList.add('open');
      });
    }
    if (closeMenu) {
      closeMenu.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        overlay.classList.remove('open');
      });
      overlay.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        overlay.classList.remove('open');
      });
    }

    // Cookie Banner
    if (!localStorage.getItem('wealthpass_cookies_accepted')) {
      setTimeout(() => {
        document.getElementById('cookieBanner').classList.add('show');
      }, 2000);
    }
    document.getElementById('acceptCookies').addEventListener('click', () => {
      localStorage.setItem('wealthpass_cookies_accepted', 'true');
      document.getElementById('cookieBanner').classList.remove('show');
    });

    // Session Timeout Mock
    let sessionTimeout;
    function resetSessionTimeout() {
      clearTimeout(sessionTimeout);
      sessionTimeout = setTimeout(() => {
        alert("Session expiring in 1 minute due to inactivity. Please complete your transaction for security.");
      }, 10 * 60 * 1000); // 10 minutes
    }
    window.onload = resetSessionTimeout;
    document.onmousemove = resetSessionTimeout;
    document.onkeypress = resetSessionTimeout;
  </script>
"""
content = content.replace('</body>', js_insert + '\n</body>')

with open(base_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated base.html')
