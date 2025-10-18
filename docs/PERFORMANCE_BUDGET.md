# Performance Budget Summary

## ✅ Status: ALL BUDGETS PASSING

**Current Bundle Size**: 41.94 KB (brotli)
**Budget**: 200 KB
**Headroom**: 79% (158 KB available for growth)

---

## Quick Reference

| Metric               | Budget | Actual   | Status                  |
| -------------------- | ------ | -------- | ----------------------- |
| **Total Initial JS** | 200 KB | 41.94 KB | ✅ **79% under budget** |
| **Load Time (3G)**   | < 3s   | 0.82s    | ✅ **73% faster**       |
| **Execute Time**     | < 2s   | 1.6s     | ✅ **20% faster**       |
| **Largest File**     | 115 KB | 23.59 KB | ✅ **79% under budget** |

---

## Commands

```bash
# Check current sizes against budget
npm run size

# Analyze what's making files large
npm run size:why

# Build (if needed) with bundle analysis
npm run build
npm run build:analyze  # Opens visualization

# Development server
npm run dev            # Vite dev server
npm start             # Simple HTTP server
```

---

## Files & Budgets

### Critical Path (Loaded on index.html)

```
src/core/app.js                    4.76 KB  (limit: 25 KB)   ✅
src/parsers/templateRenderer.js   23.59 KB  (limit: 115 KB)  ✅
src/parsers/noteParser.js          6.5 KB   (limit: 25 KB)   ✅
src/parsers/noteParser_full.js     4.25 KB  (limit: 20 KB)   ✅
src/utils/parserHelpers.js         2.84 KB  (limit: 15 KB)   ✅
───────────────────────────────────────────────────────────────
TOTAL INITIAL                     41.94 KB  (limit: 200 KB)  ✅
```

### Lazy Loaded

```
pages/meds.js                      1.42 KB  (limit: 8 KB)    ✅
src/guidelines/guidelines.js       5.78 KB  (limit: 28 KB)   ✅
src/parsers/entityExtraction.js    5.41 KB  (limit: 22 KB)   ✅
```

---

## CI Enforcement

### GitHub Actions: `.github/workflows/size-limit.yml`

**Triggers**: Push to main/master, Pull Requests
**Action**: Runs `npm run size`
**Result**: **Build fails** if any budget exceeded ❌

**PR Comments**: Size report posted automatically showing:

- Before/after comparison
- Which files changed
- How much size increased/decreased

---

## What Happens If Budget Exceeded?

### Example Failure

```bash
npm run size

❌ FAILED

Template Renderer
Size limit:   115 kB
Size:         120 kB  ❌ 5 kB over limit
```

**CI Response**:

1. ❌ Build fails
2. 🚫 Cannot merge PR
3. 📝 Comment posted explaining why
4. 👨‍💻 Developer must either:
   - Optimize the code to reduce size
   - Update budget (requires approval)
   - Split file into smaller chunks

---

## Lazy Loading

### Meds Page ✅ Already Implemented

**File**: `meds.html` (line 16)

```javascript
<script type="module">
  import { mountMeds } from './pages/meds.js';

  document.addEventListener('DOMContentLoaded', async () => {
    await mountMeds(container);
  });
</script>
```

**How it works**:

- ES6 module `import()` - native browser support
- Only loads when user navigates to meds.html
- Automatic code splitting by browser
- No build step required

**Size**: 1.42 KB (well under 8 KB budget)

---

## Architecture Decision

### Why Not Bundle Everything?

**Current**: Multi-Page App (MPA) with separate HTML files
**Alternative**: Single-Page App (SPA) with bundler

**Reasons for MPA**:

1. ✅ **Already optimal** - Files are small (< 200 KB)
2. ✅ **Natural code splitting** - Different pages load different JS
3. ✅ **Better caching** - Individual files cached separately
4. ✅ **Simpler workflow** - No build step for development
5. ✅ **Progressive enhancement** - Works without JS

**When to bundle**:

- Adding large dependencies (e.g., React, Vue)
- Total size exceeds 300 KB
- Need tree-shaking for unused imports
- Want to optimize vendor chunks

**Current Status**: Bundling not needed ✅

---

## Monitoring

### Continuous

- ✅ Size-limit runs on every PR
- ✅ Developers notified immediately if budget exceeded
- ✅ Historical size data in git history

### Manual

```bash
# Quick check
npm run size

# Detailed analysis
npm run size:why

# Visual bundle analysis (after build)
npm run build:analyze
```

---

## Configuration Files

| File                               | Purpose                     |
| ---------------------------------- | --------------------------- |
| `.size-limit.json`                 | Budget limits for each file |
| `vite.config.js`                   | Bundler config (optional)   |
| `.github/workflows/size-limit.yml` | CI enforcement              |
| `package.json`                     | NPM scripts                 |

---

## Optimization History

### Dead Code Removal (2025-10-03)

- Removed 34 unused files
- Reduced from 47 → 13 files (72%)
- Size reduction: ~220 KB

### Result

- Well under budget with significant headroom
- Room for 158 KB of future growth

---

## Future Considerations

### If Budget Approaches Limit (> 180 KB)

**Options**:

1. **Code split** - Break large files into smaller chunks
2. **Lazy load more** - Defer non-critical JS
3. **Minify** - Use Vite to minify and tree-shake
4. **Compress** - Ensure server uses Brotli compression

### If Adding Dependencies

**Check size first**:

```bash
npx bundle-phobia <package-name>
```

**Consider alternatives**:

- Use smaller alternatives
- Import only what you need
- Lazy load heavy libraries

---

## Best Practices

### ✅ DO

- Keep files focused and single-purpose
- Lazy load features not needed on page load
- Monitor size on every commit
- Use native browser features when possible
- Compress with Brotli in production

### ❌ DON'T

- Add dependencies without checking size
- Bundle everything into one file
- Ignore size-limit warnings
- Update budgets without justification
- Load everything upfront

---

## Support

**Questions?** See:

- [BUNDLE_REPORT.md](BUNDLE_REPORT.md) - Detailed analysis
- [size-limit documentation](https://github.com/ai/size-limit)
- `.size-limit.json` - Current configuration

**Commands not working?**

```bash
npm install  # Reinstall dependencies
npm run size # Should work now
```

---

**Last Updated**: 2025-10-03
**Status**: ✅ All budgets passing with 79% headroom
