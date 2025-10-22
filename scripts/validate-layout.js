#!/usr/bin/env node
/**
 * Layout Validation Script
 * Validates that critical layout files are present and correctly configured
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const REQUIRED_CSS_FILES = [
  'styles/style.css',
  'styles/dx-labs.css',
  'styles/layout.css',
  'styles/note-styles.css',
  'styles/afib-enhanced.css',
  'styles/meds.css',
  'styles/guidelines.css',
];

const REQUIRED_JS_MODULES = [
  'pages/meds.js',
  'pages/guidelines.js',
];

let hasErrors = false;

console.log('🔍 Validating layout files...\n');

// Check if critical files exist
console.log('📁 Checking file existence:');
[...REQUIRED_CSS_FILES, ...REQUIRED_JS_MODULES].forEach(file => {
  const filePath = join(ROOT, file);
  if (existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.error(`  ❌ MISSING: ${file}`);
    hasErrors = true;
  }
});

// Check index.html for CSS includes
console.log('\n📄 Checking index.html stylesheet declarations:');
try {
  const indexPath = join(ROOT, 'index.html');
  const indexContent = readFileSync(indexPath, 'utf-8');
  
  let allCssPresent = true;
  REQUIRED_CSS_FILES.forEach(cssFile => {
    const linkTag = `href="${cssFile}"`;
    if (indexContent.includes(linkTag)) {
      console.log(`  ✅ ${cssFile} is linked`);
    } else {
      console.error(`  ❌ MISSING LINK: ${cssFile}`);
      allCssPresent = false;
      hasErrors = true;
    }
  });

  if (allCssPresent) {
    console.log('\n✅ All required CSS files are linked in index.html');
  }

  // Check CSS order is preserved
  const cssOrder = [];
  REQUIRED_CSS_FILES.forEach(cssFile => {
    const match = indexContent.match(new RegExp(`href="${cssFile.replace('/', '\\/')}"`));
    if (match) {
      cssOrder.push({ file: cssFile, index: match.index });
    }
  });

  const isSorted = cssOrder.every((item, idx) => {
    if (idx === 0) return true;
    return item.index > cssOrder[idx - 1].index;
  });

  if (isSorted) {
    console.log('✅ CSS files are in correct order');
  } else {
    console.error('❌ CSS files are NOT in correct order!');
    hasErrors = true;
  }

} catch (error) {
  console.error(`  ❌ Error reading index.html: ${error.message}`);
  hasErrors = true;
}

// Check key CSS classes exist
console.log('\n🎨 Checking critical CSS classes:');

const cssChecks = [
  { file: 'styles/meds.css', classes: ['.meds-page', '.meds-grid', '.med-card'] },
  { file: 'styles/guidelines.css', classes: ['#guidelines-layout', '#guidelines-sidebar', '.guidelines-tab'] },
];

cssChecks.forEach(({ file, classes }) => {
  try {
    const cssPath = join(ROOT, file);
    const cssContent = readFileSync(cssPath, 'utf-8');
    
    classes.forEach(cls => {
      if (cssContent.includes(cls)) {
        console.log(`  ✅ ${file}: ${cls}`);
      } else {
        console.error(`  ❌ MISSING CLASS in ${file}: ${cls}`);
        hasErrors = true;
      }
    });
  } catch (error) {
    console.error(`  ❌ Error reading ${file}: ${error.message}`);
    hasErrors = true;
  }
});

// Check JavaScript modules export required functions
console.log('\n📦 Checking JavaScript module exports:');

const jsChecks = [
  { file: 'pages/meds.js', exports: ['mountMeds', 'unmountMeds'] },
  { file: 'pages/guidelines.js', exports: ['mountGuidelines', 'unmountGuidelines'] },
];

jsChecks.forEach(({ file, exports }) => {
  try {
    const jsPath = join(ROOT, file);
    const jsContent = readFileSync(jsPath, 'utf-8');
    
    exports.forEach(exp => {
      const exportPattern = new RegExp(`export\\s+(function|async\\s+function)\\s+${exp}`);
      if (exportPattern.test(jsContent)) {
        console.log(`  ✅ ${file}: exports ${exp}`);
      } else {
        console.error(`  ❌ MISSING EXPORT in ${file}: ${exp}`);
        hasErrors = true;
      }
    });
  } catch (error) {
    console.error(`  ❌ Error reading ${file}: ${error.message}`);
    hasErrors = true;
  }
});

// Final result
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ VALIDATION FAILED: Layout files have issues!');
  console.error('   Please check the errors above and refer to docs/LAYOUT_PROTECTION.md');
  process.exit(1);
} else {
  console.log('✅ VALIDATION PASSED: All layout files are intact!');
  process.exit(0);
}
