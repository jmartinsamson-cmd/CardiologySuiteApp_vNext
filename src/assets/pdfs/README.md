# Educational PDF Resources

This directory contains educational PDF resources for cardiac nurse practitioners in training.

## Directory Structure

```
src/assets/pdfs/
├── cardiology/
│   ├── shock/              # Shock types, pathophysiology, management
│   ├── arrhythmias/        # Arrhythmia management protocols
│   ├── heart-failure/      # Heart failure guidelines and management
│   ├── acs/               # Acute coronary syndrome protocols
│   └── valvular/          # Valvular heart disease
├── general/               # General clinical resources
│   ├── documentation/     # Documentation templates and examples
│   ├── procedures/        # Clinical procedures and protocols
│   └── reference/         # Quick reference guides
└── README.md             # This file
```

## Usage Guidelines

### File Naming Convention

Use descriptive, lowercase names with hyphens:

- `shock-pathophysiology-guide.pdf`
- `cardiogenic-shock-management.pdf`
- `documentation-templates.pdf`

### Integration with Website

PDFs in this directory can be referenced in the cardiac guidelines JavaScript file using:

```javascript
// Example reference in cardiac-guidelines.js
pdfs: [
  {
    title: "Shock Pathophysiology Guide",
    path: "/src/assets/pdfs/cardiology/shock/shock-pathophysiology-guide.pdf",
    description: "Comprehensive guide to shock types and management",
  },
];
```

### Size Considerations

- Keep individual PDFs under 10MB when possible
- Consider compressing large files
- Use web-optimized PDFs for faster loading

### Copyright and Attribution

- Ensure all PDFs are properly licensed for educational use
- Include attribution information in filename or metadata
- Document sources in this README when adding new files

## Adding New PDFs

When adding new educational PDFs:

1. Choose the appropriate subdirectory
2. Use descriptive filenames
3. Update any relevant sections in `src/utils/cardiac-guidelines.js`
4. Consider adding metadata or references in the JavaScript guidelines
5. Test that PDFs load properly in the web interface

## Current Files (27 Total PDFs)

### Cardiology - Core Topics

- **ECG**: ECG interpretation guide (2.7 MB)
- **Shock**: Comprehensive shock management guide (11.2 MB)
- **Heart Failure**: CHF management (6.6 MB) + Cardiomyopathy (4.7 MB)
- **ACS**: Coronary artery disease management (4.5 MB)

### Cardiology - Arrhythmias

- **Arrhythmias**: General arrhythmias guide (8.8 MB)
- **Atrial Fibrillation**: A-fib management (3.8 MB)
- **Syncope**: Syncope evaluation guide (9.5 MB)

### Cardiology - Structural

- **Valvular**: Valvular heart diseases (4.3 MB)
- **Aortic**: Aortic diseases guide (11.9 MB)
- **PAD**: Peripheral arterial disease (7.1 MB)
- **Pericardial**: Pericardial diseases (3.5 MB)
- **Murmurs**: Heart sounds & murmurs (2.0 MB)

### Cardiovascular Pharmacology (11 PDFs)

- **Anticoagulants**: Warfarin (803 KB), Heparin (1.6 MB), DOACs (1.4 MB)
- **Antiplatelets**: Antiplatelet medications (872 KB)
- **Antihypertensives**: Beta blockers (6.1 MB), ACE-I/ARBs (639 KB), CCBs (2.3 MB), Alpha blockers (2.3 MB)
- **Diuretics**: Loop (1.6 MB), Thiazide (1.4 MB), K-sparing (1.7 MB)
- **Critical Care**: Vasopressors (7.3 MB)

### General Reference

- **Hypertension**: HTN management guidelines (2.2 MB)
- **Hyperlipidemia**: Lipid management (3.4 MB)

### Search Integration

All PDFs are integrated with the website search system. Users can search by:

- **Condition**: "heart failure", "afib", "shock"
- **Medication**: "beta blocker", "warfarin", "furosemide"
- **Topic**: "pharmacology", "ecg", "murmurs"
