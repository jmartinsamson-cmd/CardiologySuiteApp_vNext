# 🎨 CARDIOLOGY SUITE VISUAL PRESERVATION GUIDE

**Date Created:** October 2, 2025  
**Status:** STABLE - DO NOT MODIFY CORE VISUAL ELEMENTS

## 🔒 PROTECTED VISUAL COMPONENTS

### ✅ NEVER MODIFY THESE CSS SECTIONS:

1. **CSS Custom Properties (Lines 1-50 in style.css)**
   - Color scheme: `--cardio-primary`, `--cardio-secondary`
   - Theme variables: `--bg`, `--panel`, `--ink`, `--muted`
   - Shadow and glow effects

2. **Banner/Header (Lines 600-700)**
   - `#banner` styling with cardiology branding
   - Heartbeat animation (`@keyframes heartbeat`)
   - Brand gradient and positioning

3. **Enhanced Navigation (Lines 350-450)**
   - `.main-nav` breadcrumb system
   - `.breadcrumb-item` hover effects
   - Navigation container layout

4. **Sidebar Design (Lines 450-550)**
   - `#dx-rail` fixed positioning and layout
   - `.dx-rail-header` with search styling
   - `.search-input-wrapper` enhanced design

5. **Simple Diagnosis List (CURRENT STABLE)**
   - `.dx-item` simple text-only styling
   - Hover effects with left border highlight
   - Active state with red accent color

6. **Enhanced Panel System (Lines 800-1000)**
   - `.panel` gradient backgrounds and shadows
   - `.panel-h` headers with cardiac icons
   - Slide-in animations

7. **Floating Action Button (Lines 700-800)**
   - `.fab-container` positioning
   - `.fab-main` cardiac gradient button
   - `.fab-actions` animated menu

## 🚫 VISUAL STABILITY RULES

### DO NOT:

- ❌ Change the cardiology color scheme (reds/blues)
- ❌ Modify the sidebar layout or positioning
- ❌ Remove or change the heartbeat animations
- ❌ Alter the diagnosis list structure (keep simple dx-item format)
- ❌ Change the gradient backgrounds on panels
- ❌ Modify the enhanced header branding
- ❌ Remove the theme toggle functionality
- ❌ Change the FAB button design or positioning

### SAFE TO MODIFY:

- ✅ Add NEW CSS classes (don't modify existing ones)
- ✅ Add content to main panels
- ✅ Add new diagnosis items to the JavaScript array
- ✅ Modify text content in panels
- ✅ Add new functional JavaScript (don't modify existing)

## 📁 BACKUP LOCATIONS

**Main Backup:** `backups/visual-stable-2025-10-02/`

- index.html (HTML structure)
- styles/\*.css (All visual styling)
- app.js (Simple diagnosis list logic)

**Git Branch:** `visual-port-from-main` (current stable state)

## 🔄 RESTORATION PROCESS

If visual layout gets broken:

1. **Copy from backup:**

   ```powershell
   Copy-Item "backups\visual-stable-2025-10-02\*" -Destination "." -Recurse -Force
   ```

2. **Or restore from git:**
   ```bash
   git checkout HEAD -- index.html styles/ src/core/app.js
   ```

## 📊 CURRENT STABLE STATE

### Layout Structure:

- **Header:** Enhanced cardiology branding with heartbeat
- **Navigation:** Breadcrumb system with hover effects
- **Sidebar:** 300px fixed width with search and simple diagnosis list
- **Main:** Grid layout with vitals/labs panels
- **FAB:** Floating action button with cardiac styling
- **Theme:** Dark theme with cardiac red/blue accents

### Diagnosis List Format:

- Simple text-only list items (`.dx-item`)
- No icons or complex card structures
- Clean hover and active states
- A→Z sorted: Atrial Fibrillation → Pericarditis

### Color Scheme:

- Primary: `#dc2626` (Cardiac Red)
- Secondary: `#1e40af` (Medical Blue)
- Background: Dark gradient
- Accent: Blue highlights on hover

## ⚠️ EMERGENCY CONTACTS

If layout breaks and you need immediate restoration:

1. Use backup files in `backups/visual-stable-2025-10-02/`
2. Reference this guide
3. Test in Simple Browser at `http://localhost:3000`

---

**REMEMBER: This layout took significant work to perfect. Preserve it carefully!**
