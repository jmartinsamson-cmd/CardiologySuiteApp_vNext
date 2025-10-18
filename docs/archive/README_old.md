# Cardiology Suite - Optimized File Structure

## 📁 Project Organization

This project has been reorganized for optimal performance and maintainability:

```
cardiology-site/
├── src/                          # Source code
│   ├── core/                     # Main application logic
│   │   ├── app.js               # Main application (5699 lines)
│   │   ├── diagnostic.js        # Diagnostic functionality
│   │   └── quick-diagnostic.js  # Quick diagnostics
│   ├── parsers/                 # Note parsing and rendering
│   │   ├── noteParser.js        # Basic clinical note parser
│   │   ├── noteParser_full.js   # Full template-aware parser
│   │   ├── noteUtils.js         # Parser utilities
│   │   ├── templateRenderer.js  # Rendering helpers
│   │   └── legacy/              # Legacy parsers
│   │       └── note-parser.js   # Legacy parser
│   ├── utils/                   # Utility functions
│   │   ├── sanitizer.js         # Input sanitization
│   │   ├── storage.js           # Local storage utilities
│   │   ├── progressBar.js       # Progress indicators
│   │   └── cardiac-guidelines.js # Cardiac guidelines
│   └── ui/                      # User interface components
│       ├── test-functions.js    # UI test functions
│       └── test-parser.js       # Parser testing interface
├── data/                        # Application data
├── public/                      # Static assets
├── tests/                       # Test files
├── styles/                      # CSS stylesheets
├── docs/                        # Documentation
├── COPILOT_LABS_TRANSFORM.md    # Copilot Labs integration
├── README_COMMANDLINE.md        # CLI usage documentation
├── package.json                 # Project configuration
├── index.html                   # Main HTML entry point
├── sw.js                        # Service worker
└── app.js                       # Compatibility entry point
```

## 🚀 Performance Optimizations

### 1. **Modular Architecture**

- **Separation of Concerns**: Each directory has a specific purpose
- **Dependency Management**: Clear import/export relationships
- **Maintainability**: Easy to locate and modify specific functionality

### 2. **Parser Optimization**

- **Dual Parser System**:
  - `noteParser.js`: Fast, lightweight parsing for basic notes
  - `noteParser_full.js`: Comprehensive parsing for complex clinical notes
- **Lean Footprint**: Removed unused TypeScript duplicates to reduce bundle size
- **Legacy Compatibility**: Old parsers preserved in `legacy/` folder

### 3. **Efficient Loading**

- **Strategic Script Loading**: HTML loads only essential scripts
- **Service Worker**: Cached assets for offline functionality
- **Lazy Loading**: Components load on demand

## 📋 Usage Guide

### Command Line (Recommended)

```bash
# Generate cardiology notes from clinical text
cat clinical_note.txt | npm run gen:note

# Start development server
npm run start

# Start API server
npm run api
```

### Copilot Labs Integration

Use the transform recipe in `COPILOT_LABS_TRANSFORM.md` for quick note processing in VS Code.

### Web Application

Open `index.html` in a modern browser for the full web interface.

## 🔧 Development Workflow

### Adding New Features

1. **Core Logic** → `src/core/`
2. **Parsing** → `src/parsers/`
3. **Utilities** → `src/utils/`
4. **UI Components** → `src/ui/`

### Testing

- Unit tests: `tests/utils/`
- Integration tests: `tests/integration/`
- HTML tests: `tests/html/`

### Building

```bash
# TypeScript compilation (if needed)
npx tsc

# Start development
npm run start
```

## 📊 File Size Optimization

| Component                        | Size        | Purpose                   |
| -------------------------------- | ----------- | ------------------------- |
| `src/core/app.js`                | 5699 lines  | Main application logic    |
| `src/parsers/noteParser_full.js` | 339 lines   | Comprehensive parser      |
| Total Core                       | ~6000 lines | Optimized for performance |

## 🎯 Key Improvements

### Before Reorganization

- ❌ Scattered files across root directory
- ❌ Broken symlinks causing 404 errors
- ❌ Duplicate parsers without clear purpose
- ❌ Inconsistent file organization
- ❌ HTML referencing non-existent paths

### After Reorganization

- ✅ **Modular Structure**: Clear separation by functionality
- ✅ **Single Source of Truth**: No duplicate files
- ✅ **Proper Entry Points**: Clear application entry points
- ✅ **Documentation**: Comprehensive usage guides
- ✅ **Performance**: Optimized loading and caching

## 🔄 Migration Notes

### For Existing Users

- All functionality preserved
- Command-line tools work identically
- Web interface unchanged
- API endpoints unchanged

### For Developers

- Import paths updated to use `src/` prefix
- TypeScript versions available for modern development
- Legacy parsers preserved for compatibility

## 🚀 Future Enhancements

- [ ] Bundle optimization with Webpack/Rollup
- [ ] Tree shaking for unused code removal
- [ ] Code splitting for faster initial loads
- [ ] Service worker enhancements for better caching
- [ ] Progressive Web App (PWA) improvements

## 📞 Support

- **Command Line**: See `README_COMMANDLINE.md`
- **Copilot Labs**: See `COPILOT_LABS_TRANSFORM.md`
- **Web App**: Open `index.html` and use built-in help

---

**Last Updated**: August 28, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
