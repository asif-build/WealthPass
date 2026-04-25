import os

# 1. Overwrite styles/global.css with the amazing static/css/style.css
css_path = r'c:\Users\DELL\Desktop\WEALTHPASS\static\css\style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Adjust clamp for laptop
css += "\n.hero-h1 { font-size: clamp(40px, 5vw, 64px) !important; }\n"

global_css_path = r'c:\Users\DELL\Desktop\WEALTHPASS\styles\global.css'
with open(global_css_path, 'w', encoding='utf-8') as f:
    f.write(css)
    
# clear landing.css so it doesn't conflict
with open(r'c:\Users\DELL\Desktop\WEALTHPASS\styles\landing.css', 'w', encoding='utf-8') as f:
    f.write('/* Moved to global.css */')

# 2. Compile base.html and landing.html into index.html
base_path = r'c:\Users\DELL\Desktop\WEALTHPASS\templates\core\base.html'
with open(base_path, 'r', encoding='utf-8') as f:
    base = f.read()

landing_path = r'c:\Users\DELL\Desktop\WEALTHPASS\templates\landing.html'
with open(landing_path, 'r', encoding='utf-8') as f:
    landing = f.read()

# Extract extra_css block from landing
extra_css = ''
if '{% block extra_css %}' in landing:
    extra_css = landing.split('{% block extra_css %}')[1].split('{% endblock %}')[0]

# Extract content block from landing
content = ''
if '{% block content %}' in landing:
    content = landing.split('{% block content %}')[1].split('{% endblock %}')[0]

# Now assemble into base
index_html = base.replace('{% block extra_css %}{% endblock %}', extra_css)
index_html = index_html.replace('{% block content %}{% endblock %}', content)

# Clean up Django tags
index_html = index_html.replace('{% load static %}', '')
index_html = index_html.replace("{% static 'css/style.css' %}", 'styles/global.css')
index_html = index_html.replace("{% static 'images/hero.png' %}", 'images/hero.png')
index_html = index_html.replace("{% static 'images/step1.png' %}", 'images/step1.png')
index_html = index_html.replace("{% static 'images/step2.png' %}", 'images/step2.png')
index_html = index_html.replace("{% static 'images/step3.png' %}", 'images/step3.png')

# Fix links
index_html = index_html.replace("{% url 'search' %}", "pages/search.html")

# Fix missing head tags that might have been lost
if '<head>' in index_html and 'styles/global.css' not in index_html:
    index_html = index_html.replace('<head>', '<head>\\n<link rel="stylesheet" href="styles/global.css">')

# Write to index.html
with open(r'c:\Users\DELL\Desktop\WEALTHPASS\index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

print('Successfully compiled index.html and styles/global.css')
