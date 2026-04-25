import os

# 1. Update style.css
css_path = r'c:\Users\DELL\Desktop\WEALTHPASS\static\css\style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Fix light theme to dark theme
css = css.replace('--black:        #ffffff;', '--black:        #0a0a0a;')
css = css.replace('--black-soft:   #f8f9fa;', '--black-soft:   #111111;')
css = css.replace('--black-lifted: #f1f3f5;', '--black-lifted: #1a1a1a;')
css = css.replace('--black-border: #e9ecef;', '--black-border: #333333;')

css = css.replace('--white:        #111827;', '--white:        #f8f9fa;')
css = css.replace('--white-muted:  #4b5563;', '--white-muted:  #9ca3af;')

# Fix card box-shadow
old_card_css = """
.card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 24px 48px -12px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
"""
new_card_css = """
.card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(17, 17, 17, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
"""
css = css.replace(old_card_css.strip(), new_card_css.strip())

# Add some specific styles for the process-step cards to make them look great
step_css_addition = """
.process-step {
  padding: 40px 32px;
  position: relative;
  overflow: hidden;
}
.process-step::before {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(180deg, rgba(201,168,76,0.05) 0%, transparent 100%);
  pointer-events: none;
}
"""
if ".process-step::before" not in css:
    css += "\\n" + step_css_addition

# Fix grain overlay visibility
css = css.replace("opacity='0.03'", "opacity='0.06'")

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)


# 2. Update landing.html
html_path = r'c:\Users\DELL\Desktop\WEALTHPASS\templates\landing.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Fix broken image URLs
html = html.replace('https://images.unsplash.com/photo-1579781354199-122e2d091ab7?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800')
html = html.replace('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=600')
html = html.replace('https://images.unsplash.com/photo-1628102491629-77858ab5721d?auto=format&fit=crop&q=80&w=600', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=600')

# Another layer of safety just in case the URL was partially matched
import re
html = re.sub(r'<img src="https://images.unsplash.com/photo-1589156229687[^>]+class="test-avatar"[^>]+>', '', html)
html = re.sub(r'<img src="https://images.unsplash.com/photo-1555952517[^>]+class="test-avatar"[^>]+>', '', html)
html = re.sub(r'<img src="https://images.unsplash.com/photo-1605406575497[^>]+class="test-avatar"[^>]+>', '', html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print('Fixed CSS and HTML via script')
