# Module Dependency Matrix - Cardiology Suite

## Quick Reference Table

| Module Path | Type | Inputs | Outputs | Direct Dependencies | Imported By | Global Side Effects | LOC |
|-------------|------|--------|---------|---------------------|-------------|---------------------|-----|
| **Core & Entry** |
| `index.html` | HTML | User navigation | DOM structure | app.js | Browser | None | 340 |
| `src/core/app.js` | JS | DOM events, user input | UI updates, routing | parsers/*, utils/* | None (entry) | window.runSearch, window.checkSearchHealth, event listeners | 959 |
| **Parser Subsystem** |
| `src/parsers/noteParser.js` | JS | Clinical note text | Parsed object | smartParser.js | core/app.js | window.parseClinicalNote | ~500 |
| `src/parsers/noteParser_full.js` | JS | Clinical note text | Parsed object (full) | entityExtraction.js, normalize.js | core/app.js | window.parseClinicalNoteFull | ~800 |
| `src/parsers/noteParser_full_async.js` | JS | Clinical note text | Promise<Parsed> | scheduler.js, entityExtraction.js | parseNoteCoordinator.js, noteParser.worker.js | None | 524 |
| `src/parsers/smartParser.js` | JS | Raw text string | Parsed sections object | normalize.js, synonyms.js, entityExtraction.js | noteParser.js | None | 499 |
| `src/parsers/templateRenderer.js` | JS | Parsed object, template choice | Formatted clinical note | None (standalone) | core/app.js | window.templateRenderer, window.TemplateRendererInitialized, DOM manipulation | 3481 |
| `src/parsers/aiAnalyzer.js` | JS | Base parse result, original note | Enhanced result with AI insights | None | core/app.js | None | ~100 |
| `src/parsers/hintedParser.js` | JS | Text with hints/patterns | Parsed object | parserTrainingExamples.js | core/app.js | window.parseWithHints | ~270 |
| `src/parsers/parserTrainingExamples.js` | JS | None | Training data constants | None | hintedParser.js, core/app.js | window.TRAINING_EXAMPLES | 2556 |
| `src/parsers/parserChunker.js` | JS | Large text | Text chunks | None | noteParser.worker.js | None | ~150 |
| **Entity Extraction** |
| `src/parsers/entityExtraction.js` | JS | Text sections | Vitals, meds, labs, diagnoses objects | None | smartParser.js, noteParser_full.js | None | 759 |
| `src/parsers/normalize.js` | JS | Raw text | Normalized text, extracted dates | None | smartParser.js, entityExtraction.js | None | 159 |
| `src/parsers/synonyms.js` | JS | Header text, section body | Match scores | None | smartParser.js | SIGNAL_WORDS export | 174 |
| **Evidence & Safety** |
| `src/parsers/evidenceBasedPlan.js` | JS | Parsed data | Evidence-based plan text | None | templateRenderer.js | CLINICAL_GUIDELINES export | 230 |
| `src/parsers/clinicalSafety.js` | JS | Parsed data (meds, labs, dx) | Safety warnings array | None | templateRenderer.js (optional) | None | 140 |
| **Utility Modules** |
| `src/utils/scheduler.js` | JS | Task functions | Promises with yielding | None | noteParser_full_async.js | None | 140 |
| `src/utils/debugInstrumentation.js` | JS | None | Error tracking | None | core/app.js (side-effect) | window.onerror, window.onunhandledrejection, debugging helpers | ~650 |
| `src/utils/parserHelpers.js` | JS | Various | Helper functions | None | core/app.js (side-effect) | window helper functions | ~200 |
| `src/utils/sanitizer.js` | JS | User input strings | Sanitized strings | None | Various | None | ~50 |
| `src/utils/svgSanitizer.js` | JS | SVG elements | Sanitized SVGs | None | core/app.js | DOM mutation observer | 237 |
| `src/utils/diagnosisSanitizer.js` | JS | Diagnosis list | Filtered list | None | core/app.js, templateRenderer.js | None | 159 |
| `src/utils/jankMonitor.js` | JS | None | Performance metrics | None | core/app.js (optional) | window.JankMonitor | ~170 |
| **Feature Pages** |
| `src/guidelines/guidelines.js` | JS | None | Guidelines UI | None | core/app.js (dynamic) | renderGuidelines function | ~100 |
| `src/education/index.js` | JS | None | Education browser UI | None | core/app.js (dynamic) | renderEducation function | ~200 |
| **Services Layer** |
| `services/ai-search/server.js` | Node.js | Express HTTP requests | JSON responses | routes/*, helpers/*, @azure/search-documents | None (standalone server) | Express app on port 8081 | ~400 |
| `services/ai-search/routes/search.js` | Node.js | Search query | Search results | rag/azureSearchClient.js | server.js | None | ~80 |
| `services/ai-search/routes/analyze-note.js` | Node.js | Clinical note text | AI analysis | helpers/gpt4-analyzer.js | server.js | None | ~100 |
| `services/ai-search/routes/medical-qa.js` | Node.js | Medical question | Answer with sources | medical-qa.js, rag/azureSearchClient.js | server.js | None | ~120 |
| `services/ai-search/routes/paraphrase-hpi.js` | Node.js | HPI text | Paraphrased HPI | helpers/hpi-paraphraser.js | server.js | None | ~60 |
| `services/ai-search/helpers/gpt4-analyzer.js` | Node.js | Note text | AI insights | OpenAI SDK | routes/analyze-note.js | None | ~400 |
| `services/ai-search/helpers/hpi-paraphraser.js` | Node.js | HPI text | Paraphrased text | OpenAI SDK, lru-cache | routes/paraphrase-hpi.js | None | ~150 |
| `services/ai-search/rag/azureSearchClient.js` | Node.js | Search query | Documents array | node-fetch, @azure/search-documents | routes/*, medical-qa.js | None | ~111 |
| `services/ai-search/medical-qa.js` | Node.js | Question, options | Answer object | OpenAI SDK, rag/azureSearchClient.js | routes/medical-qa.js | None | ~178 |
| **Azure Functions API** |
| `api/src/functions/health.js` | Azure Func | HTTP request | Health status | @azure/functions | None (Azure runtime) | None | ~20 |
| `api/src/functions/medical-qa.js` | Azure Func | HTTP request | Answer JSON | @azure/functions, lib/medical-qa.js | None (Azure runtime) | None | ~40 |
| `api/src/lib/medical-qa.js` | Node.js | Question, options | Answer object | OpenAI SDK, rag/azureSearchClient.js | functions/medical-qa.js | None | ~178 |
| `api/src/lib/rag/azureSearchClient.js` | Node.js | Search query | Documents | dotenv, node-fetch | lib/medical-qa.js | None | ~70 |

---

## Dependency Depth Analysis

### Level 0 - Entry Points (No Dependencies)
- `index.html`
- `services/ai-search/server.js` (Express entry)
- `api/src/functions/*.js` (Azure Functions entry)

### Level 1 - Depends only on Level 0 or external packages
- `src/core/app.js` → imports parsers & utils
- `src/parsers/normalize.js` → no internal deps
- `src/parsers/synonyms.js` → no internal deps
- `src/utils/scheduler.js` → no internal deps
- `src/utils/sanitizer.js` → no internal deps

### Level 2 - Depends on Level 1
- `src/parsers/entityExtraction.js` → depends on normalize.js, synonyms.js
- `src/parsers/smartParser.js` → depends on normalize.js, synonyms.js, entityExtraction.js
- `services/ai-search/rag/azureSearchClient.js` → depends on external packages only

### Level 3 - Depends on Level 2
- `src/parsers/noteParser.js` → depends on smartParser.js
- `src/parsers/noteParser_full.js` → depends on entityExtraction.js
- `src/parsers/noteParser_full_async.js` → depends on entityExtraction.js, scheduler.js
- `services/ai-search/medical-qa.js` → depends on azureSearchClient.js

### Level 4 - Depends on Level 3
- `src/parsers/templateRenderer.js` → depends on noteParser.js (indirectly via window global)
- `src/parsers/aiAnalyzer.js` → calls services/ai-search
- `services/ai-search/routes/*` → depends on medical-qa.js, helpers

### Level 5 - Top-level orchestrators
- `src/core/app.js` → orchestrates all parsers, utils, routing

---

## Import/Export Patterns Summary

### Modules with NO Exports (Side-Effect Modules)
- `src/parsers/noteParser.js` - Attaches to window.parseClinicalNote
- `src/utils/debugInstrumentation.js` - Sets up global error handlers
- `src/utils/parserHelpers.js` - Adds utility functions to window

### Modules with Default Export
- `src/parsers/smartParser.js` - `export default parseNote`
- `src/parsers/noteParser_full_async.js` - `export default parseClinicalNoteFull`
- `src/parsers/parserHeuristics.js` - `export default heuristics`
- `src/utils/diagnosisSanitizer.js` - `export default { ... }`

### Modules with Named Exports Only
- `src/parsers/entityExtraction.js` - 10+ extraction functions
- `src/parsers/normalize.js` - normalize(), extractDates()
- `src/parsers/synonyms.js` - SIGNAL_WORDS, scoreMatch()
- `src/utils/scheduler.js` - 6+ async helper functions
- `src/parsers/evidenceBasedPlan.js` - plan generation functions

### Modules with Both Default and Named Exports
- `src/parsers/smartParser.js` - Default + named exports
- `src/parsers/evidenceBasedPlan.js` - Functions + CLINICAL_GUIDELINES constant

---

## Critical Communication Paths

### Path 1: User Input → Parsed Output
```
User Textarea Input
  → templateRenderer.processNote()
  → window.parseClinicalNote()
  → smartParser.parseNote()
  → entityExtraction.extract*()
  → Parsed Object
  → templateRenderer.render()
  → Formatted Output
```
**Latency:** <100ms (synchronous)  
**Failure Mode:** Returns partial parse or error message

### Path 2: AI Enhancement
```
User Click "Enhance"
  → aiAnalyzer.enrichWithAIAnalysis()
  → fetch POST http://localhost:8081/api/analyze-note
  → services/ai-search/routes/analyze-note.js
  → gpt4-analyzer.analyzeNote()
  → Azure OpenAI Chat API
  → Enhanced Result
```
**Latency:** 2-5 seconds  
**Failure Mode:** Returns base result without AI, shows error banner

### Path 3: Medical Q&A with RAG
```
User Question
  → fetch POST /api/medical-qa
  → api/src/lib/medical-qa.js
  → searchGuidelines() → Azure Search
  → Build RAG context
  → Azure OpenAI Chat API
  → Answer with Citations
```
**Latency:** 3-8 seconds  
**Failure Mode:** Error message, no answer returned

### Path 4: HPI Paraphrase
```
User Click "Paraphrase HPI"
  → fetch POST /api/paraphrase-hpi
  → hpi-paraphraser.js (checks LRU cache)
  → Azure OpenAI (if cache miss)
  → Paraphrased Text
```
**Latency:** 50ms (cache hit) or 2-3s (cache miss)  
**Failure Mode:** Returns original HPI text

---

## Global State Management

### Window-Attached Globals

| Global Name | Source Module | Type | Purpose |
|-------------|---------------|------|---------|
| `window.parseClinicalNote` | noteParser.js | Function | Main parser entry point |
| `window.parseClinicalNoteFull` | noteParser_full.js | Function | Full-featured parser |
| `window.templateRenderer` | templateRenderer.js | Object (class instance) | Template rendering instance |
| `window.TemplateRendererInitialized` | templateRenderer.js | Boolean | Ready flag for DOMContentLoaded |
| `window.parseWithHints` | hintedParser.js | Function | User-trainable parser |
| `window.testHintedParse` | hintedParser.js | Function | Testing helper |
| `window.extractVitalsFromText` | hintedParser.js | Function | Vitals extraction |
| `window.TRAINING_EXAMPLES` | parserTrainingExamples.js | Array | ML training data |
| `window.runSearch` | core/app.js | Function | AI search helper (console use) |
| `window.checkSearchHealth` | core/app.js | Function | Health check helper |
| `window.testParseButton` | index.html inline script | Function | Manual test trigger |
| `window.JankMonitor` | jankMonitor.js | Object | Performance monitoring |
| `window.onerror` | debugInstrumentation.js | Function | Global error handler |
| `window.__AZURE_SEARCH_INDEX` | core/app.js | String | Azure Search index name |
| `window.__RAG_TOP_K` | core/app.js | Number | RAG retrieval count |
| `window.__STRICT_GROUNDING` | core/app.js | Boolean | RAG mode flag |

### DOM-Based State
- Current route: `window.location.hash`
- Active nav tab: `.nav-tab.active` class
- Selected template: Radio button state in templateRenderer UI
- SmartPhrase toggle: Checkbox state
- Theme: `document.body.classList` (contains `theme-light` or not)

### LocalStorage State
- Template preferences: `localStorage.getItem('selectedTemplate')`
- SmartPhrase preference: `localStorage.getItem('smartPhraseEnabled')`
- Theme preference: `localStorage.getItem('theme')`

---

## External Dependencies (npm packages)

### Frontend (Browser)
- **None** - Vanilla JavaScript, no build dependencies for production

### Services (services/ai-search)
```json
{
  "express": "Server framework",
  "cors": "CORS middleware",
  "dotenv": "Environment variables",
  "@azure/search-documents": "Azure Search SDK",
  "openai": "OpenAI SDK for Azure",
  "lru-cache": "Caching",
  "node-fetch": "HTTP client (Node < 18)"
}
```

### Azure Functions (api/)
```json
{
  "@azure/functions": "Azure Functions runtime",
  "openai": "OpenAI SDK",
  "dotenv": "Environment variables"
}
```

---

## Performance Characteristics

| Operation | Typical Latency | Blocking | Optimization |
|-----------|----------------|----------|--------------|
| Parse clinical note (sync) | 20-100ms | Yes | Use async version for >1000 lines |
| Parse clinical note (async) | 50-200ms | No (yields to main) | Preferred for large notes |
| Template rendering | <10ms | Yes | Fast, pure JS string manipulation |
| Diagnosis search (local) | <5ms | Yes | Instant filtering, <1000 items |
| AI enhancement | 2-5s | No (fetch) | Shows loading state |
| Medical Q&A | 3-8s | No (fetch) | RAG + LLM = additive latency |
| HPI paraphrase (cached) | <50ms | No (fetch) | LRU cache hit |
| HPI paraphrase (uncached) | 2-3s | No (fetch) | OpenAI API call |
| Feature flag load | <50ms | No (fetch) | Small JSON file |
| Diagnosis data load | 100-300ms | No (fetch) | ~1MB JSON, one-time load |

---

## Security Boundaries

### Client-Side (Browser)
- **Input Sanitization:** sanitizer.js, svgSanitizer.js
- **Diagnosis Filtering:** diagnosisSanitizer.js (whitelist/blacklist)
- **No PHI Transmission:** All parsing happens client-side
- **XSS Prevention:** innerHTML avoided, textContent used

### Server-Side (services/ai-search)
- **CORS:** Configured to allow localhost + Codespaces origins
- **No Auth:** Currently open (development mode)
- **Input Validation:** Basic, should add stronger validation
- **Rate Limiting:** None (should add!)

### Azure Functions
- **Auth Level:** Anonymous (development)
- **Input Validation:** Basic parameter checks
- **Environment Variables:** Secrets in app settings (not committed)

### Azure Backend
- **API Key Auth:** Azure Search and OpenAI use API keys
- **Network Security:** Azure-managed
- **Data Residency:** Configured per Azure region

---

*End of Module Dependency Matrix*
