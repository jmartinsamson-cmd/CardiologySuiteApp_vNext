import re

# Read the HTML file
with open('guidelines.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the onclick handler
onclick_handler = '''onclick="
          document.querySelectorAll('.guidelines-dx-item').forEach(i => i.style.background = '');
          this.style.background = 'rgba(220, 38, 38, 0.2)';
          var welcome = document.getElementById('guidelines-welcome');
          var content = document.getElementById('guidelines-content');
          var title = document.getElementById('guidelines-title');
          if (welcome) welcome.style.display = 'none';
          if (content) content.style.display = 'block';
          if (title) title.textContent = this.textContent + ' - Clinical Guidelines';
          alert('Selected: ' + this.textContent);
        "'''

# Find all guidelines-dx-item divs that don't already have onclick
pattern = r'<div class="guidelines-dx-item" data-diagnosis="([^"]*)"(?! onclick)([^>]*)>([^<]*)</div>'

def add_onclick(match):
    data_diagnosis = match.group(1)
    other_attrs = match.group(2)
    text_content = match.group(3)
    
    # Skip items that already have onclick
    if 'onclick' in other_attrs:
        return match.group(0)
    
    return f'<div class="guidelines-dx-item" data-diagnosis="{data_diagnosis}"{other_attrs} {onclick_handler}>{text_content}</div>'

# Apply the replacement
new_content = re.sub(pattern, add_onclick, content)

# Write back
with open('guidelines.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Added onclick handlers to ALL diagnosis items!")