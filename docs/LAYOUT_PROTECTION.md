# Layout Protection Documentation

**Last Updated:** 2025-10-22

## 🔒 Protected Files - DO NOT MODIFY WITHOUT REVIEW

This document tracks the critical layout files that must be protected from accidental modification.

### Critical HTML Structure

**File:** `index.html`
- **Protected Section:** Lines 14-21 (Stylesheet declarations)
- **Why:** These stylesheets must be loaded in this specific order for proper cascading
- **Critical Stylesheets:**
  1. `style.css` - Global styles and theme
  2. `dx-labs.css` - Diagnosis and labs styling
  3. `layout.css` - Main layout structure
  4. `note-styles.css` - Clinical note formatting
  5. `afib-enhanced.css` - AFib-specific enhancements
  6. `meds.css` - **Required for #/meds page layout**
  7. `guidelines.css` - **Required for #/guidelines page layout**

### Protected CSS Files

#### 1. `styles/meds.css`
- **Purpose:** Medications page layout (#/meds route)
- **Key Features:**
  - Grid layout (auto-fill, minmax(350px, 1fr))
  - Card-based design with hover effects
  - Search and filter controls
- **Protected Classes:**
  - `.meds-page` - Main container
  - `.meds-grid` - Card grid layout
  - `.med-card` - Individual medication cards
  - `.meds-controls` - Search/filter bar

#### 2. `styles/guidelines.css`
- **Purpose:** Guidelines & Teaching page layout (#/guidelines route)
- **Key Features:**
  - Two-column layout (300px sidebar + flex main)
  - Diagnosis list with search
  - Tabbed interface for content
- **Protected Classes:**
  - `#guidelines-layout` - Main grid container
  - `#guidelines-sidebar` - Left diagnosis list
  - `#guidelines-main` - Right content area
  - `.guidelines-tabs` - Tab navigation
  - `.tab-panel` - Tab content panels

### Protected JavaScript Modules

#### 1. `pages/meds.js`
- **Purpose:** Medications page logic
- **Key Functions:**
  - `mountMeds(rootEl)` - Renders medications page
  - `loadMedicationsData()` - Fetches medication data
  - `renderMedicationCard(med)` - Creates card HTML
  - `initializeSearch(rootEl)` - Sets up search/filter

#### 2. `pages/guidelines.js`
- **Purpose:** Guidelines page logic
- **Key Functions:**
  - `mountGuidelines(rootEl)` - Renders guidelines page with sidebar
  - `loadDiagnosisData()` - Fetches diagnosis database
  - `initializeGuidelinesInteractivity()` - Sets up search and clicks
  - `displayDiagnosisDetails()` - Shows diagnosis info in tabs

### Layout Specifications

#### Medications Page (#/meds)
```
┌─────────────────────────────────────┐
│  Header (title + description)      │
├─────────────────────────────────────┤
│  Controls (search + filter)        │
├─────────────────────────────────────┤
│  Grid Layout (auto-fill)           │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ Card │ │ Card │ │ Card │       │
│  └──────┘ └──────┘ └──────┘       │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ Card │ │ Card │ │ Card │       │
│  └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────┘
```

#### Guidelines Page (#/guidelines)
```
┌────────────┬─────────────────────────┐
│ Sidebar    │  Main Content           │
│ (300px)    │  (flex: 1)              │
│            │                         │
│ Search     │  ┌──────────────────┐  │
│ ──────     │  │ Header           │  │
│            │  ├──────────────────┤  │
│ Diagnosis  │  │ Tabs             │  │
│ List:      │  ├──────────────────┤  │
│ • Item 1   │  │ Tab Content      │  │
│ • Item 2   │  │                  │  │
│ • Item 3   │  │                  │  │
│ ...        │  └──────────────────┘  │
└────────────┴─────────────────────────┘
```

## 🚨 Modification Guidelines

### Before Making Changes

1. **Document the reason** for the change
2. **Test on all routes** (main, #/meds, #/guidelines)
3. **Verify responsive behavior** (mobile, tablet, desktop)
4. **Check browser compatibility** (Chrome, Firefox, Safari)
5. **Update this document** with changes made

### Validation Checklist

- [ ] CSS files are still in correct order in `index.html`
- [ ] Both `meds.css` and `guidelines.css` are included
- [ ] Medications page displays grid layout correctly
- [ ] Guidelines page shows two-column layout with sidebar
- [ ] Search functionality works on both pages
- [ ] Responsive design works on mobile devices
- [ ] No console errors on page load

## 🔧 Emergency Recovery

If layout breaks unexpectedly:

1. **Check `index.html`** - Verify all 7 CSS files are loaded in order
2. **Check CSS files** - Ensure no syntax errors
3. **Check JavaScript** - Look for module loading errors in console
4. **Clear cache** - Force refresh (Ctrl+Shift+R / Cmd+Shift+R)
5. **Check git history** - `git log --oneline --since="1 day ago" -- styles/ pages/`

## 📋 Change Log

| Date | File | Change | Reason |
|------|------|--------|--------|
| 2025-10-22 | `index.html` | Added `meds.css` and `guidelines.css` | Pages were rendering without styling |
| 2025-10-22 | `pages/guidelines.js` | Added sidebar with diagnosis list | Missing navigation on guidelines page |
| 2025-10-22 | All protected files | Added warning comments | Prevent accidental modifications |

## 🎯 Testing Protocol

Run these tests after any layout changes:

```bash
# 1. Validate data files
npm run validate:data

# 2. Run linter
npm run lint

# 3. Run visual regression tests
npm run test:visual

# 4. Test in browser
npm start
# Then visit:
# - http://localhost:8080/ (main page)
# - http://localhost:8080/#/meds (medications)
# - http://localhost:8080/#/guidelines (guidelines)
```

## 📞 Support

If you need to modify the layout:
1. Read this document fully
2. Create a backup branch
3. Test thoroughly
4. Update this document
5. Document changes in git commit message

---

**Remember:** These layouts were carefully designed for clinical workflow. Changes should be made thoughtfully and tested extensively.
