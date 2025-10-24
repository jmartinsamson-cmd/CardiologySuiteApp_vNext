# Cardiology Suite - Communication & Data Flow Analysis

**Analysis Date:** October 23, 2025  
**Branch:** chore/test-and-baseline-fixes  
**Analyzed By:** Automated Architecture Analysis Tool

---

## Executive Summary

This document provides a comprehensive analysis of the Cardiology Suite application's architecture, data flow, module dependencies, and communication patterns. The application is a privacy-first clinical decision support tool built with vanilla JavaScript ES modules, featuring client-side clinical note parsing, Azure AI integration, and a modular feature-based architecture.

### Architecture Style
- **Pattern:** Single Page Application (SPA) with hash-based routing
- **Module System:** ES6 modules with dynamic imports
- **Build:** No build step required (dev mode uses Vite, production serves static files)
- **State Management:** Global window objects + DOM-based state
- **API Communication:** REST APIs (services/ai-search, Azure Functions)

---

## 1. APPLICATION ENTRY POINTS & BOOTSTRAP FLOW

### 1.1 Entry Point Chain

```
index.html (Static HTML entry)
    ↓
<script type="module" src="/src/core/app.js">
    ↓
app.js DOMContentLoaded event
    ↓
Imports & initializes all core modules
    ↓
Sets up hash-based routing
    ↓
Renders active route/page
```

### 1.2 Core Bootstrap Sequence

**File:** `index.html` → `src/core/app.js`

#### Phase 1: Module Loading (Synchronous Imports)
```javascript
// src/core/app.js lines 6-14
import "../utils/debugInstrumentation.js";      // Error tracking & debug helpers
import "../utils/parserHelpers.js";             // Parser utility functions
import "../parsers/noteParser.js";              // Main clinical note parser
import "../parsers/noteParser_full.js";         // Full featured parser
import "../parsers/aiAnalyzer.js";              // AI enhancement layer
import "../parsers/templateRenderer.js";        // Output template renderer
import "../parsers/parserTrainingExamples.js";  // Training data for ML
import "../parsers/hintedParser.js";            // User-trainable parser
```

#### Phase 2: DOM Ready Initialization
```javascript
document.addEventListener("DOMContentLoaded", function () {
  // 1. Set global configuration
  window.__AZURE_SEARCH_INDEX = 'cardiology-index';
  window.__RAG_TOP_K = 5;
  window.__STRICT_GROUNDING = false;
  
  // 2. Load feature flags from config/features.json
  loadFeatureFlags();
  
  // 3. Initialize theme system
  initializeTheme();
  
  // 4. Check if main page (has .dx-list element)
  const isMainPage = !!document.querySelector(".dx-list");
  if (!isMainPage) return; // Skip main init for other pages
  
  // 5. Initialize main page features
  initializeInteractions();  // Button clicks, FAB menu, etc.
  initializeSearch();        // Diagnosis search bar
  initializeLabValues();     // Lab reference table
});
```

#### Phase 3: Global Parser Attachment
Parsers attach to `window` object during module execution:
- `window.parseClinicalNote` - Main parser function
- `window.templateRenderer` - Template rendering instance
- `window.TemplateRendererInitialized` - Ready flag

---

## 2. ROUTING & NAVIGATION ARCHITECTURE

### 2.1 Hash-Based Routing Implementation

**Location:** `src/core/app.js` (lines 920-959)

```javascript
// Route definitions
const routes = {
  '': renderMain,              // #/ or #
  'main': renderMain,          // #/main
  'guidelines': renderGuidelines,  // #/guidelines
  'meds': renderMeds,          // #/meds (feature-flagged)
  'education': renderEducation     // #/education (feature-flagged)
};

// Route handler
function handleRoute() {
  const hash = window.location.hash.slice(1); // Remove #
  const path = hash.split('/')[1] || '';      // Get route path
  
  const routeHandler = routes[path] || routes[''];
  routeHandler();
  updateActiveNavTab(path || 'main');
}

// Event listeners
window.addEventListener("hashchange", handleRoute);
window.addEventListener("DOMContentLoaded", handleRoute);
```

### 2.2 Route → Render Function Mapping

| Route Path | Handler Function | Source File | Purpose |
|-----------|------------------|-------------|---------|
| `#/` or `#/main` | `renderMain()` | src/core/app.js | Main clinical note parsing interface |
| `#/guidelines` | `renderGuidelines()` | src/guidelines/guidelines.js | Evidence-based guideline browser |
| `#/meds` | `renderMeds()` | src/core/app.js | Medication reference (feature-flagged) |
| `#/education` | `renderEducation()` | src/education/index.js | Educational materials browser |

### 2.3 Feature Flags & Conditional Routes

**Config File:** `config/features.json`

```json
{
  "meds_feature": true,
  "education_feature": true
}
```

**Loading Logic:**
```javascript
function loadFeatureFlags() {
  fetch("./config/features.json")
    .then(r => r.json())
    .then(features => {
      // Show/hide nav tabs based on flags
      if (features.meds_feature === true) {
        document.getElementById("meds-nav-tab").style.display = "";
      }
    });
}
```

---

## 3. PARSER SUBSYSTEM - DATA FLOW

### 3.1 Parser Architecture Overview

```
User Input (textarea)
    ↓
window.parseClinicalNote(text)
    ↓
noteParser.js (main entry)
    ↓
[Smart Parser] → [Entity Extraction] → [Normalization]
    ↓                    ↓                    ↓
smartParser.js    entityExtraction.js    normalize.js
    ↓
Parsed Object { sections, vitals, meds, diagnoses, labs, meta }
    ↓
templateRenderer.js (normalization & formatting)
    ↓
Rendered Output (formatted templates)
    ↓
Optional: aiAnalyzer.js (AI enhancement via services/ai-search)
    ↓
Enhanced Output with AI insights
```

### 3.2 Parser Module Dependencies

#### Core Parser Chain
1. **noteParser.js** - Main entry point
   - Attaches `window.parseClinicalNote()` global
   - Delegates to specialized parsers
   - No exports (side-effect module)

2. **smartParser.js** - Intelligent section detection
   ```javascript
   export function parseNote(rawText)
   export function fallbackParse(text)
   export default parseNote
   ```
   - Imports: `normalize.js`, `synonyms.js`, `entityExtraction.js`
   - Sections: HPI, PMH, PSH, ROS, Assessment, Plan

3. **noteParser_full.js** - Full-featured parser
   - Synchronous version with complete feature set
   - Handles complex note structures
   - Attaches to window as fallback

4. **noteParser_full_async.js** - Async version
   ```javascript
   export async function parseClinicalNoteFull(text)
   ```
   - Uses `yieldToMain()` from scheduler.js
   - Better performance for large notes

#### Entity Extraction Modules

**entityExtraction.js** - Clinical entity extraction
```javascript
export function extractClinicalContext(text)
export function extractVitals(text)
export function extractMeds(text)
export function extractAllergies(text)
export function extractDiagnoses(text)
export function extractLabs(text)
export function extractProvider(text)
export function extractDemographics(text)
export function disambiguateDiagnoses(diagnoses, context, vitals)
```

#### Supporting Modules

**synonyms.js** - Pattern matching
```javascript
export const SIGNAL_WORDS = { /* ... */ }
export function scoreMatch(headerText, sectionBody = "")
```

**normalize.js** - Text normalization
```javascript
export function normalize(text)
export function extractDates(text)
```

**parserChunker.js** - Text chunking
- Splits large notes into processable chunks
- Used by parser worker for parallel processing

### 3.3 Template Rendering Flow

**File:** `src/parsers/templateRenderer.js`

```
Parsed Data Object
    ↓
normalizeSections() - Map raw keys to standard sections
    ↓
Section Normalization Map (SECTION_NORMALIZATION)
    ↓
Template Selection (CIS, Consult, Progress Note)
    ↓
generateAssessment() - Create structured assessment
    ↓
generatePlan() - Create evidence-based plan
    ↓
format() - Apply template formatting
    ↓
Copyable Output Text
```

**Key Methods:**
- `processNote(text)` - Main entry, triggers parse & render
- `normalizeSections(parsedData)` - Maps parser output to template sections
- `generateAssessment(parsedData)` - Creates assessment from diagnoses
- `generatePlan(parsedData)` - Creates management plan with guidelines
- `renderTemplate(templateName)` - Formats output for selected template

---

## 4. API & SERVICE COMMUNICATION

### 4.1 Frontend → Backend Communication Patterns

#### Pattern 1: AI Search Service (services/ai-search)

**Service:** Express.js server on port 8081  
**Purpose:** AI-powered search, note analysis, HPI paraphrasing

**Frontend API Helpers:**
```javascript
// src/core/app.js
function getSearchApiBase() {
  const origin = window.location.origin;
  // Detect Codespaces port mapping
  if (origin.includes("-8080.app.github.dev")) {
    return origin.replace("-8080.app.github.dev", "-8081.app.github.dev");
  }
  return "http://localhost:8081";
}

async function checkSearchHealth() {
  const r = await fetch(`${getSearchApiBase()}/health`, { cache: "no-store" });
  return await r.json();
}

async function runSearch(query, top = 5) {
  const r = await fetch(`${getSearchApiBase()}/search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, top })
  });
  return await r.json();
}
```

#### Pattern 2: AI Analyzer Enhancement

**File:** `src/parsers/aiAnalyzer.js`

```javascript
export async function enrichWithAIAnalysis(baseResult, originalNote) {
  const AI_SERVER_URL = "http://localhost:8081";
  
  const response = await fetch(`${AI_SERVER_URL}/api/analyze-note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      note: originalNote,
      baseResult: baseResult
    })
  });
  
  const aiData = await response.json();
  
  // Merge AI insights into base result
  return {
    ...baseResult,
    aiEnhanced: true,
    aiInsights: aiData
  };
}
```

#### Pattern 3: Azure Functions API (api/)

**Endpoint:** `/api/medical-qa`  
**Purpose:** Medical question answering with RAG

**Implementation:**
```javascript
// api/src/functions/medical-qa.js
import { answerMedicalQuestion } from '../lib/medical-qa.js';

app.http('medical-qa', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const question = /* extract from request */;
    const answer = await answerMedicalQuestion(question);
    return { jsonBody: answer };
  }
});
```

### 4.2 Service-to-Service Communication

#### AI Search → Azure Search

**File:** `services/ai-search/rag/azureSearchClient.js`

```javascript
export async function searchGuidelines(query, options = 5) {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
  const indexName = process.env.AZURE_SEARCH_INDEX;
  const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY;
  
  const url = `${endpoint}/indexes/${indexName}/docs/search?api-version=2024-07-01`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify({
      search: query,
      top: options,
      select: "id,title,content,category"
    })
  });
  
  return await res.json();
}
```

#### Medical QA → Azure OpenAI

**File:** `api/src/lib/medical-qa.js`

```javascript
export async function answerMedicalQuestion(question, options = {}) {
  const client = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
    defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
    defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
  });
  
  // 1. Search for relevant guidelines
  const searchResults = await searchGuidelines(question, options.maxSources || 5);
  
  // 2. Build context from search results
  const contextDocs = searchResults.map((doc, idx) => 
    `[${idx + 1}] ${doc.title}\\n${doc.content}`
  ).join('\\n\\n');
  
  // 3. Call Azure OpenAI with RAG context
  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    messages: [
      { role: "system", content: "You are a clinical decision support assistant..." },
      { role: "user", content: `Context:\\n${contextDocs}\\n\\nQuestion: ${question}` }
    ],
    temperature: options.temperature || 0.2
  });
  
  return {
    answer: response.choices[0].message.content,
    sources: searchResults,
    confidence: /* calculated */
  };
}
```

### 4.3 External Data Loading

#### Static JSON Data Files

| File Path | Loaded By | Purpose |
|-----------|-----------|---------|
| `config/features.json` | src/core/app.js | Feature flags |
| `data/cardiology_diagnoses/cardiology.json` | Multiple | Diagnosis reference |
| `data/labs_reference/labs_reference.json` | src/core/app.js | Lab value reference ranges |
| `data/diagnosis_whitelist.json` | src/utils/diagnosisSanitizer.js | Approved diagnoses |
| `data/diagnosis_blacklist.json` | src/utils/diagnosisSanitizer.js | Filtered diagnoses |

**Example Loading Pattern:**
```javascript
// src/core/app.js - initializeLabValues()
async function initializeLabValues() {
  const response = await fetch("./data/labs_reference/labs_reference.json");
  const labData = await response.json();
  // Render lab reference table
}
```

---

## 5. EVENT-DRIVEN INTERACTIONS

### 5.1 DOM Event Listeners

#### Core App Events (src/core/app.js)

| Element | Event | Handler | Purpose |
|---------|-------|---------|---------|
| `document` | `DOMContentLoaded` | App initialization | Bootstrap app |
| `.theme-toggle` | `click` | Toggle theme class | Dark/light mode |
| `window` | `hashchange` | `handleRoute()` | Route navigation |
| `.fab-main` | `click` | Toggle FAB menu | Floating action button |
| `.search-input` | `input` | Filter diagnoses | Real-time search |
| `.dx-list item` | `click` | Select diagnosis | Add to note |

#### Template Renderer Events

**File:** `src/parsers/templateRenderer.js`

| Element | Event | Handler | Purpose |
|---------|-------|---------|---------|
| `#vs-paste` | `input` | Auto-parse note | Real-time parsing |
| `#render-btn` | `click` | Render template | Manual render trigger |
| `#copy-btn` | `click` | Copy to clipboard | Copy formatted output |
| `.template-radio` | `change` | Switch template | Change output format |
| `#smart-phrase-toggle` | `change` | Toggle SmartPhrase | Enable/disable shortcuts |

### 5.2 Web Worker Communication

**File:** `src/parsers/parseNoteCoordinator.js`

```javascript
export async function parseNoteAsync(text, options = {}) {
  const worker = new Worker('/src/parsers/noteParser.worker.js', { type: 'module' });
  
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      if (e.data.type === 'result') {
        resolve(e.data.result);
        worker.terminate();
      } else if (e.data.type === 'progress') {
        options.onProgress?.(e.data.progress);
      }
    };
    
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };
    
    worker.postMessage({ text, options });
  });
}
```

**Worker File:** `src/parsers/noteParser.worker.js`

```javascript
self.addEventListener("message", async (event) => {
  const { text, options } = event.data;
  
  // Import parser in worker context
  const { parseClinicalNoteFull } = await import('./noteParser_full_async.js');
  
  try {
    const result = await parseClinicalNoteFull(text);
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
});
```

---

## 6. MODULE DEPENDENCY MATRIX

### 6.1 Frontend Core Modules

| Module | Exports | Imports From | Imported By | Global Side Effects |
|--------|---------|--------------|-------------|---------------------|
| `src/core/app.js` | None | parsers/*, utils/* | None (entry point) | Event listeners, routing, window.runSearch |
| `src/parsers/noteParser.js` | None | smartParser, entityExtraction | core/app.js | window.parseClinicalNote |
| `src/parsers/smartParser.js` | parseNote, fallbackParse | normalize, synonyms, entityExtraction | noteParser.js | None |
| `src/parsers/templateRenderer.js` | TemplateRenderer class | None (standalone) | core/app.js | window.templateRenderer, window.TemplateRendererInitialized |
| `src/parsers/aiAnalyzer.js` | enrichWithAIAnalysis, checkAIAnalyzerAvailability | None | core/app.js | None |
| `src/utils/scheduler.js` | yieldToMain, yieldIfNeeded, withYielding, processArrayInChunks, runWithTimeout | None | noteParser_full_async.js | None |
| `src/utils/diagnosisSanitizer.js` | sanitizeDiagnosesList, initDiagnosisSanitizer, isDiagnosisVisible | None | core/app.js, templateRenderer.js | None |

### 6.2 Parser Subsystem Dependencies

```
normalize.js (text normalization)
    ↑
synonyms.js (pattern matching) ← SIGNAL_WORDS
    ↑
entityExtraction.js (entity extraction)
    ↑
smartParser.js (main parsing logic)
    ↑
noteParser.js (entry point, attaches to window)
    ↑
templateRenderer.js (formatting & output)
```

### 6.3 Service Layer Dependencies

```
services/ai-search/server.js (Express server)
    ├→ routes/search.js (search endpoint)
    ├→ routes/analyze-note.js (note analysis)
    ├→ routes/paraphrase-hpi.js (HPI rewriting)
    └→ routes/medical-qa.js (Q&A endpoint)
         ├→ helpers/gpt4-analyzer.js
         ├→ helpers/hpi-paraphraser.js
         └→ rag/azureSearchClient.js
              └→ Azure Search REST API
              
api/src/lib/medical-qa.js (Azure Function handler)
    ├→ OpenAI SDK
    └→ rag/azureSearchClient.js
         └→ Azure Search REST API
```

### 6.4 Utility Module Dependencies

| Module | Purpose | Dependencies | Used By |
|--------|---------|--------------|---------|
| `scheduler.js` | Async scheduling helpers | None | noteParser_full_async.js |
| `debugInstrumentation.js` | Error tracking & logging | None | core/app.js (side-effect import) |
| `parserHelpers.js` | Parser utility functions | None | core/app.js (side-effect import) |
| `sanitizer.js` | Input sanitization | None | Various |
| `svgSanitizer.js` | SVG security | None | core/app.js |
| `diagnosisSanitizer.js` | Diagnosis filtering | None | core/app.js, templateRenderer.js |

---

## 7. DATA FLOW SEQUENCES

### 7.1 Clinical Note Parsing Flow (Main Use Case)

```
User pastes clinical note into #vs-paste textarea
    ↓
'input' event fires
    ↓
templateRenderer.processNote(text) called
    ↓
window.parseClinicalNote(text) invoked
    ↓
noteParser.js → smartParser.parseNote(rawText)
    ↓
┌─────────────────────────────────────────┐
│ smartParser.js                          │
│  1. normalize(text)                     │
│  2. Split into lines                    │
│  3. Score sections with synonyms.js     │
│  4. Extract entities with entityExtraction.js│
│  5. Build sections object               │
└─────────────────────────────────────────┘
    ↓
Parsed Object {
  sections: { HPI, PMH, PSH, ... },
  vitals: [...],
  meds: [...],
  diagnoses: [...],
  labs: {...},
  meta: { confidence, warnings }
}
    ↓
templateRenderer.normalizeSections(parsedData)
    ↓
Section mapping via SECTION_NORMALIZATION
    ↓
templateRenderer.generateAssessment(parsedData)
    ↓
templateRenderer.generatePlan(parsedData)
    ↓
Template formatting (CIS/Consult/Progress)
    ↓
Rendered output displayed in #output-text
    ↓
Optional: Copy to clipboard via #copy-btn
```

### 7.2 AI Enhancement Flow

```
User clicks "Enhance with AI" button
    ↓
aiAnalyzer.enrichWithAIAnalysis(baseResult, originalNote) called
    ↓
fetch POST to http://localhost:8081/api/analyze-note
    ↓
┌────────────────────────────────────────────┐
│ services/ai-search/routes/analyze-note.js  │
│  1. Receive note + base result             │
│  2. gpt4-analyzer.analyzeNote(noteText)    │
│  3. Call Azure OpenAI with clinical prompt │
│  4. Extract structured insights            │
│  5. Return enhanced data                   │
└────────────────────────────────────────────┘
    ↓
AI insights merged with base result
    ↓
{
  ...baseResult,
  aiEnhanced: true,
  aiInsights: {
    criticalFindings: [...],
    riskFactors: [...],
    recommendations: [...]
  }
}
    ↓
UI updated with AI highlights
```

### 7.3 Medical Q&A Flow (RAG Pattern)

```
User submits question via AI panel
    ↓
runSearch(query, top) called
    ↓
fetch POST to http://localhost:8081/search
    ↓
┌───────────────────────────────────────────┐
│ services/ai-search/routes/search.js       │
│  1. Receive query                         │
│  2. azureSearchClient.searchGuidelines()  │
│     ↓                                     │
│  ┌────────────────────────────────┐      │
│  │ Azure Search REST API          │      │
│  │ POST /indexes/{index}/docs/search│     │
│  │ Return top K relevant documents │      │
│  └────────────────────────────────┘      │
│  3. Format and return results             │
└───────────────────────────────────────────┘
    ↓
Display search results in UI
    ↓
Optional: Click result to get full answer via /api/medical-qa
    ↓
┌────────────────────────────────────────────┐
│ api/src/lib/medical-qa.js                  │
│  1. searchGuidelines(question, 5)          │
│  2. Build context from search results      │
│  3. Azure OpenAI chat completion           │
│  4. Calculate confidence score             │
│  5. Return answer with citations           │
└────────────────────────────────────────────┘
    ↓
Answer displayed with source citations
```

### 7.4 HPI Paraphrase Flow

```
User clicks "Paraphrase HPI" in output panel
    ↓
fetch POST to http://localhost:8081/api/paraphrase-hpi
    ↓
┌────────────────────────────────────────────┐
│ services/ai-search/helpers/hpi-paraphraser.js│
│  1. Receive original HPI text              │
│  2. Check cache (LRU)                      │
│  3. If miss, call Azure OpenAI             │
│  4. Prompt: "Rewrite in clinical style..."│
│  5. Cache result                           │
│  6. Return paraphrased text                │
└────────────────────────────────────────────┘
    ↓
Replace HPI section in output
    ↓
Mark as modified in UI
```

---

## 8. ARCHITECTURAL PATTERNS IDENTIFIED

### 8.1 Design Patterns in Use

1. **Module Pattern** - ES6 modules with explicit exports
2. **Singleton Pattern** - TemplateRenderer, global window objects
3. **Factory Pattern** - Template creation in templateRenderer.js
4. **Observer Pattern** - Event listeners, hashchange routing
5. **Strategy Pattern** - Different parser strategies (smart, full, async)
6. **Facade Pattern** - templateRenderer wraps complex parsing logic
7. **Adapter Pattern** - Section normalization maps parser output to templates
8. **Command Pattern** - Route handlers, event handlers
9. **Chain of Responsibility** - Parser pipeline (normalize → extract → score)
10. **Cache Pattern** - LRU caches in AI services

### 8.2 Anti-Patterns & Technical Debt

1. **Global State Pollution**
   - Multiple parsers attach to `window` object
   - No clear state management strategy
   - Risk of naming collisions

2. **Tight Coupling**
   - `templateRenderer.js` is monolithic (3481 lines)
   - Mixed concerns: UI, parsing, formatting, AI integration
   
3. **Implicit Dependencies**
   - Side-effect imports (noteParser.js has no exports)
   - Parser availability assumed via globals
   
4. **Inconsistent Error Handling**
   - Some functions throw, others return null
   - No unified error reporting strategy

5. **Hardcoded URLs**
   - AI service URL hardcoded in multiple places
   - No environment-based configuration in frontend

---

## 9. CRITICAL COMMUNICATION PATHS

### 9.1 Frontend → Services

**Path 1: Clinical Note Analysis**
```
User Input → templateRenderer → aiAnalyzer → services/ai-search/analyze-note → Azure OpenAI → Response
```
- **Latency:** 2-5 seconds (AI processing)
- **Retry:** None (user can retry manually)
- **Failure Mode:** Graceful degradation, shows base result

**Path 2: Search & Retrieval**
```
User Query → runSearch() → services/ai-search/search → Azure Search → Results
```
- **Latency:** 100-500ms
- **Retry:** None
- **Failure Mode:** Error displayed in UI

**Path 3: Medical Q&A**
```
Question → medical-qa API → search guidelines → Azure OpenAI RAG → Answer
```
- **Latency:** 3-8 seconds (search + LLM)
- **Retry:** None
- **Failure Mode:** Error message returned

### 9.2 Services → Azure

**Path 1: Azure Search Integration**
```
services/ai-search → Azure Search REST API
api/src/lib → Azure Search REST API
```
- **Auth:** API key in headers
- **Retry:** None (should add!)
- **Rate Limit:** Azure-managed

**Path 2: Azure OpenAI Integration**
```
services/ai-search → Azure OpenAI SDK → Chat Completions API
api/src/lib → Azure OpenAI SDK → Chat Completions API
```
- **Auth:** API key + endpoint
- **Retry:** SDK built-in (likely)
- **Rate Limit:** Token-based, no client-side handling

### 9.3 Circular Dependency Risks

**Identified Circular Import Risks:** None detected

**Reason:** No circular dependencies found because:
1. All modules use unidirectional imports
2. Parser chain has clear hierarchy (utils → extraction → parsing → rendering)
3. No module imports its importers

**Validation:**
```bash
# No cycles detected in import graph
```

---

*Continued in FLOW_ANALYSIS_PART2.md...*
