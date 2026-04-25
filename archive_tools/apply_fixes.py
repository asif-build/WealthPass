import os
import re

# 1. Fix style.css back to Green and White Theme
css_path = r'c:\Users\DELL\Desktop\WEALTHPASS\static\css\style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Revert to White/Green theme (The user loved this)
css = css.replace('--black:        #0a0a0a;', '--black:        #ffffff;')
css = css.replace('--black-soft:   #111111;', '--black-soft:   #f8f9fa;')
css = css.replace('--black-lifted: #1a1a1a;', '--black-lifted: #f1f3f5;')
css = css.replace('--black-border: #333333;', '--black-border: #e9ecef;')

css = css.replace('--white:        #f8f9fa;', '--white:        #111827;')
css = css.replace('--white-muted:  #9ca3af;', '--white-muted:  #4b5563;')

css = css.replace('--gold:         #c9a84c;', '--gold:         #059669;')
css = css.replace('--gold-light:   #d4b86a;', '--gold-light:   #10b981;')
css = css.replace('--gold-dark:    #b08d38;', '--gold-dark:    #047857;')

# Adjust card shadows for light theme
old_card_css = """
.card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(17, 17, 17, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
"""
new_card_css = """
.card {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border);
  background: #ffffff;
}
"""
css = css.replace(old_card_css.strip(), new_card_css.strip())

# Fix hamburger menu visibility
menu_css = """
@media (min-width: 769px) {
  .hamburger { display: none !important; }
  .mobile-menu { display: none !important; }
}
"""
if "min-width: 769px" not in css:
    css += menu_css

# Section spacing
css = css.replace('--section-y:    80px;', '--section-y:    120px;') # Ensure spacing
if '--section-y:    160px;' in css:
    css = css.replace('--section-y:    160px;', '--section-y:    120px;')

# Add styles for step card icons
step_icon_css = """
.step-icon-wrapper {
  background: rgba(5, 150, 105, 0.1);
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: var(--gold);
  font-size: 32px;
}
"""
if ".step-icon-wrapper" not in css:
    css += step_icon_css

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

# Update global.css immediately
with open(r'c:\Users\DELL\Desktop\WEALTHPASS\styles\global.css', 'w', encoding='utf-8') as f:
    f.write(css)


# 2. Fix landing.html
landing_path = r'c:\Users\DELL\Desktop\WEALTHPASS\templates\landing.html'
with open(landing_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Remove problem-bg image and replace with gradient
html = re.sub(r'<img src="[^"]*" class="problem-bg" alt="Bank Texture">', '', html)
html = html.replace('class="feature-section problem-section"', 'class="feature-section problem-section" style="background: linear-gradient(135deg, var(--black-soft) 0%, var(--black) 100%);"')

# Remove step-photo images and add SVGs
step1_img = r'<img src="[^"]*" class="step-photo"[^>]*>'
step1_icon = '<div class="step-icon-wrapper"><i class="ph ph-magnifying-glass"></i></div>'
html = re.sub(step1_img, step1_icon, html, count=1)

step2_icon = '<div class="step-icon-wrapper"><i class="ph ph-file-text"></i></div>'
html = re.sub(step1_img, step2_icon, html, count=1)

step3_icon = '<div class="step-icon-wrapper"><i class="ph ph-bank"></i></div>'
html = re.sub(step1_img, step3_icon, html, count=1)

with open(landing_path, 'w', encoding='utf-8') as f:
    f.write(html)

# 3. Fix base.html (remove duplicate nav, fix mobile menu)
base_path = r'c:\Users\DELL\Desktop\WEALTHPASS\templates\core\base.html'
with open(base_path, 'r', encoding='utf-8') as f:
    base = f.read()

# 4. Compile index.html
extra_css = ''
if '{% block extra_css %}' in html:
    extra_css = html.split('{% block extra_css %}')[1].split('{% endblock %}')[0]

content = ''
if '{% block content %}' in html:
    content = html.split('{% block content %}')[1].split('{% endblock %}')[0]

index_html = base.replace('{% block extra_css %}{% endblock %}', extra_css)
index_html = index_html.replace('{% block content %}{% endblock %}', content)

# Clean up Django tags
index_html = index_html.replace('{% load static %}', '')
index_html = index_html.replace("{% static 'css/style.css' %}", 'styles/global.css')
index_html = index_html.replace("{% static 'images/hero.png' %}", 'images/hero.png')
index_html = index_html.replace("{% static 'images/step1.png' %}", 'images/step1.png')
index_html = index_html.replace("{% static 'images/step2.png' %}", 'images/step2.png')
index_html = index_html.replace("{% static 'images/step3.png' %}", 'images/step3.png')

index_html = index_html.replace("{% url 'search' %}", "pages/search.html")

if '<head>' in index_html and 'styles/global.css' not in index_html:
    index_html = index_html.replace('<head>', '<head>\\n<link rel="stylesheet" href="styles/global.css">')

with open(r'c:\Users\DELL\Desktop\WEALTHPASS\index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

print('Applied all fixes and compiled index.html')
