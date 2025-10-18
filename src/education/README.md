# Education Module

## Purpose

Static educational resources for clinical learning and AI-powered features. This folder stores reference materials that can be used as source content when expanding the project.

## ⚠️ Important Rules

- **NO VISUAL CHANGES**: This module does NOT modify existing UI components, layout, colors, typography, or CSS tokens
- **ISOLATED ROUTING**: Content only appears under `#/education` route
- **NO REFACTORING**: When adding new features, extend the site - do not refactor existing code
- **EXISTING STYLES**: All existing components retain their original spacing, fonts, and colors

## Folder Structure

```
education/
├── index.js              # Main module entry point (routing handler)
├── content/              # Markdown and text resources
│   ├── guidelines/       # Clinical guidelines
│   ├── protocols/        # Medical protocols
│   └── tutorials/        # Learning modules
├── resources/            # PDFs, images, and media
│   ├── pdfs/            # PDF documents
│   ├── images/          # Educational images
│   └── videos/          # Video references (links)
└── README.md            # This file
```

## Usage

### Accessing the Education Module

The education module is accessed via the `#/education` route:

```
https://your-site.com/#/education
```

### Adding New Content

1. **Text/Markdown**: Add `.md` or `.txt` files to `content/` subdirectories
2. **PDFs**: Add PDF files to `resources/pdfs/`
3. **Images**: Add educational images to `resources/images/`
4. **Index Updates**: Update resource manifest when adding new content

### Example Resource Structure

```javascript
{
  "id": "acs-guidelines-2024",
  "title": "ACS Guidelines 2024",
  "type": "guideline",
  "format": "pdf",
  "path": "./resources/pdfs/acs-guidelines-2024.pdf",
  "description": "Latest ACS management guidelines",
  "tags": ["acs", "guidelines", "cardiology"],
  "dateAdded": "2025-10-04"
}
```

## Integration with Router

To enable the `#/education` route, the router needs to be updated:

```javascript
// In src/core/router.js (example - DO NOT modify existing routes)
const routes = {
  // ... existing routes ...
  education: () => {
    import("./education/index.js").then((module) => {
      const education = module.educationModule;
      education.init();
      document.getElementById("main-content").innerHTML = education.render();
    });
  },
};
```

## Design Principles

1. **Non-Invasive**: Module should not affect existing site functionality
2. **Lazy Loading**: Educational resources load only when needed
3. **Extensible**: Easy to add new content types and formats
4. **Search-Ready**: Structured for future search functionality
5. **AI-Friendly**: Format suitable for AI/LLM consumption

## Future Enhancements

- [ ] Resource search functionality
- [ ] Tag-based filtering
- [ ] PDF viewer integration
- [ ] Markdown renderer
- [ ] Bookmarking system
- [ ] Progress tracking for tutorials
- [ ] AI-powered content recommendations

## Notes

- This module is intentionally minimal to start
- Add features incrementally as needed
- Always preserve existing site functionality
- Test in isolation before integrating with main app
