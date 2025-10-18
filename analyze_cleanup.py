#!/usr/bin/env python3
"""
Comprehensive CSS and HTML cleanup analyzer for Cardiology Suite
Identifies duplicate classes, unused styles, and removable files
"""

import os
import re
from collections import defaultdict, Counter

def analyze_project_cleanup():
    """Analyze the project for cleanup opportunities"""
    
    print("🔍 CARDIOLOGY SUITE - CLEANUP ANALYSIS REPORT")
    print("=" * 60)
    
    # 1. Identify test/debug files that can be removed
    removable_files = []
    html_files = []
    css_files = []
    
    for root, dirs, files in os.walk('.'):
        if 'backups' in root or '.git' in root or 'node_modules' in root:
            continue
            
        for file in files:
            filepath = os.path.join(root, file)
            
            if file.endswith('.html'):
                html_files.append(filepath)
                # Check for test/debug files
                if any(keyword in file.lower() for keyword in ['test', 'debug', 'inspect', 'jstest']):
                    removable_files.append(filepath)
                    
            elif file.endswith('.css'):
                css_files.append(filepath)
    
    print("🗑️  REMOVABLE FILES:")
    for file in removable_files:
        file_size = os.path.getsize(file) if os.path.exists(file) else 0
        print(f"   ❌ {file} ({file_size} bytes)")
    
    # 2. Analyze CSS for duplicates and unused classes
    print("\n🎨 CSS ANALYSIS:")
    
    css_classes = defaultdict(list)  # class_name -> [file_locations]
    html_classes = set()  # All classes used in HTML
    
    # Extract CSS class definitions
    for css_file in css_files:
        if not os.path.exists(css_file):
            continue
            
        try:
            with open(css_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # Find class definitions
            class_matches = re.findall(r'\.([a-zA-Z][\w-]*)\s*\{', content)
            for class_name in class_matches:
                css_classes[class_name].append(css_file)
                
        except Exception as e:
            print(f"   ⚠️  Error reading {css_file}: {e}")
    
    # Extract HTML class usage
    for html_file in html_files:
        if not os.path.exists(html_file):
            continue
            
        try:
            with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # Find class attributes
            class_matches = re.findall(r'class="([^"]*)"', content)
            for class_attr in class_matches:
                # Split multiple classes
                classes = class_attr.split()
                html_classes.update(classes)
                
        except Exception as e:
            print(f"   ⚠️  Error reading {html_file}: {e}")
    
    # Find duplicate CSS class definitions
    print("\n🔄 DUPLICATE CSS CLASSES:")
    duplicates_found = False
    for class_name, locations in css_classes.items():
        if len(locations) > 1:
            duplicates_found = True
            print(f"   🔄 .{class_name} defined in:")
            for loc in locations:
                print(f"      - {loc}")
    
    if not duplicates_found:
        print("   ✅ No duplicate class definitions found")
    
    # Find unused CSS classes
    print("\n❌ POTENTIALLY UNUSED CSS CLASSES:")
    unused_classes = []
    for class_name in css_classes.keys():
        if class_name not in html_classes:
            # Skip utility classes and pseudo-classes that might be used in JS
            if not any(keyword in class_name.lower() for keyword in 
                      ['hover', 'active', 'focus', 'before', 'after', 'dark', 'light']):
                unused_classes.append(class_name)
    
    if unused_classes:
        print(f"   Found {len(unused_classes)} potentially unused classes:")
        for class_name in sorted(unused_classes)[:20]:  # Show first 20
            files_with_class = css_classes[class_name]
            print(f"   ❌ .{class_name} (in {', '.join(files_with_class)})")
        if len(unused_classes) > 20:
            print(f"   ... and {len(unused_classes) - 20} more")
    else:
        print("   ✅ All CSS classes appear to be used")
    
    # 3. Analyze CSS file sizes
    print("\n📊 CSS FILE SIZES:")
    css_sizes = []
    for css_file in css_files:
        if os.path.exists(css_file):
            size = os.path.getsize(css_file)
            css_sizes.append((css_file, size))
    
    css_sizes.sort(key=lambda x: x[1], reverse=True)
    total_css_size = sum(size for _, size in css_sizes)
    
    for css_file, size in css_sizes:
        size_kb = size / 1024
        percentage = (size / total_css_size) * 100
        print(f"   📄 {css_file}: {size_kb:.1f}KB ({percentage:.1f}%)")
    
    print(f"\n   📊 Total CSS: {total_css_size/1024:.1f}KB")
    
    # 4. Check for large style.css that could be split
    main_style = './styles/style.css'
    if os.path.exists(main_style):
        size_kb = os.path.getsize(main_style) / 1024
        if size_kb > 50:  # If larger than 50KB
            print(f"\n⚠️  LARGE CSS FILE WARNING:")
            print(f"   📄 style.css is {size_kb:.1f}KB - consider splitting into modules")
    
    # 5. Summary and recommendations
    print("\n" + "=" * 60)
    print("📋 CLEANUP RECOMMENDATIONS:")
    print("=" * 60)
    
    space_saved = sum(os.path.getsize(f) for f in removable_files if os.path.exists(f))
    
    print(f"1. 🗑️  Remove {len(removable_files)} test/debug files")
    print(f"   💾 Space saved: {space_saved/1024:.1f}KB")
    
    if duplicates_found:
        print("2. 🔄 Consolidate duplicate CSS class definitions")
    
    if unused_classes:
        print(f"3. ❌ Remove {len(unused_classes)} unused CSS classes")
        estimated_savings = len(unused_classes) * 50  # Rough estimate
        print(f"   💾 Estimated space saved: {estimated_savings} bytes")
    
    if os.path.exists(main_style) and os.path.getsize(main_style) > 50000:
        print("4. 📦 Split large style.css into focused modules")
        print("   - layout.css, components.css, utilities.css, themes.css")
    
    print("\n✅ Analysis complete!")
    return {
        'removable_files': removable_files,
        'duplicate_classes': [(k, v) for k, v in css_classes.items() if len(v) > 1],
        'unused_classes': unused_classes,
        'css_sizes': css_sizes
    }

if __name__ == "__main__":
    results = analyze_project_cleanup()