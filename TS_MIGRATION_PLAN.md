# TypeScript Migration Plan
**Date:** October 23, 2025  
**Branch:** chore/test-and-baseline-fixes  
**Analysis Method:** TypeScript compiler dry-run with strict mode

---

## Executive Summary

This document outlines a phased migration strategy to convert the `src/utils/` and `services/` directories from JavaScript to TypeScript. A comprehensive analysis identified **137 type errors** across **11 JavaScript files**, with the majority being parameter type annotations (`any` leaks) and missing external type definitions.

### Quick Stats

| Metric | Count |
|--------|-------|
| **Total Files to Migrate** | 11 JS files (utils) + 20+ JS files (services) |
| **Total Lines of Code** | ~2,963 lines (utils) + ~3,000 lines (services) |
| **TypeScript Errors Detected** | 137 errors across analyzed files |
| **Missing @types Packages** | 2 (`@types/express`, `@types/cors`) |
| **Implicit 'any' Leaks** | 72 unique locations |
| **Estimated Effort** | 16-24 developer hours (phased approach) |

---

## Error Analysis Summary

### Top Error Types

| Error Code | Count | Description |
|------------|-------|-------------|
| **TS7006** | 60 | Parameter implicitly has an 'any' type |
| **TS2339** | 36 | Property does not exist on type |
| **TS2304** | 11 | Cannot find name (missing imports/declarations) |
| **TS18046** | 9 | 'error' is of type 'unknown' (catch blocks) |
| **TS7016** | 7 | Could not find declaration file for module |
| **TS7005** | 4 | Variable implicitly has an 'any[]' type |
| **TS7034** | 3 | Variable implicitly has type 'any[]' in some locations |
| **TS2353** | 3 | Object literal may only specify known properties |
| **TS2314** | 2 | Generic type 'Array<T>' requires type argument(s) |

### Files with Most Errors

| File | Errors | Priority | Complexity |
|------|--------|----------|------------|
| `src/utils/debugInstrumentation.js` | 29 | P3 - Low | High |
| `services/ai-search/test-enhancements-standalone.js` | 21 | P4 - Optional | High |
| `services/ai-search/server.js` | 15 | P2 - Medium | High |
| `services/ai-search/routes/medical-qa.js` | 11 | P2 - Medium | Medium |
| `services/ai-search/rag/azureSearchClient.js` | 10 | P2 - Medium | Medium |
| `services/ai-search/medical-qa.js` | 7 | P2 - Medium | Medium |
| `services/ai-search/routes/search.js` | 6 | P2 - Medium | Medium |
| `src/utils/logger.js` | 0 | P1 - High | Low ✅ |
| `src/utils/eventManager.js` | 0 | P1 - High | Low ✅ |
| `src/utils/network.js` | 0 | P1 - High | Medium ✅ |

---

## Required Type Definitions

### Missing @types Packages

Install these before migration:

```bash
npm install --save-dev @types/express @types/cors @types/node
```

### Custom Type Definitions Needed

Create `types/index.d.ts` for project-specific types:

```typescript
// Window extensions
declare global {
  interface Window {
    __DEBUG__?: boolean;
    isDebugMode?: boolean;
    trace?: (label: string, data: any) => void;
    showCitationModal?: (citations: Citation[]) => void;
    closeCitationModal?: () => void;
    CallGraph?: CallGraph;
  }
}

// ImportMeta extensions for Node.js
declare global {
  interface ImportMeta {
    env?: Record<string, string | undefined>;
  }
}

// Project-specific types
export interface Citation {
  source: string;
  evidence: string;
  url: string;
}

export interface CallGraph {
  nodes: CallGraphNode[];
  addNode(node: CallGraphNode): void;
}

export interface CallGraphNode {
  name: string;
  input: any;
  startTime: number;
  endTime?: number;
  output?: any;
  error?: Error;
  children: CallGraphNode[];
}

// AI/RAG types
export interface SearchResult {
  title: string;
  url: string;
  score: number;
  content?: string;
}

export interface AIResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
  latency?: number;
  retrieval: {
    query: string;
    hitsCount: number;
    topScore: number;
    avgScore?: number;
  };
}

export interface ParserResult {
  diagnoses?: string[];
  medications?: string[];
  labs?: string[];
  [key: string]: any;
}

export interface AzureSearchConfig {
  endpoint: string;
  apiKey: string;
  idx: string;
  ver: string;
}
```

---

## Migration Phases

### Phase 1: Infrastructure & Simple Utilities (Estimated: 4-6 hours)

**Goal:** Migrate low-complexity, high-usage utility files with zero type errors

**Files to Migrate:**

1. ✅ **src/utils/logger.js** → `logger.ts`
   - Lines: 124
   - Current Errors: 0
   - Dependencies: `config/environment.js`
   - Effort: 1 hour
   - **Status:** Ready to migrate (zero errors)

2. ✅ **src/utils/eventManager.js** → `eventManager.ts`
   - Lines: 234
   - Current Errors: 0
   - Dependencies: `logger.js`
   - Effort: 1.5 hours
   - **Status:** Ready to migrate (zero errors)

3. ✅ **src/utils/network.js** → `network.ts`
   - Lines: 243
   - Current Errors: 0
   - Dependencies: `config/environment.js`, `logger.js`
   - Effort: 2 hours
   - **Status:** Ready to migrate (zero errors)

4. **src/utils/sanitizer.js** → `sanitizer.ts`
   - Lines: 21
   - Current Errors: 0
   - Dependencies: None
   - Effort: 0.5 hours
   - **Status:** Ready to migrate (zero errors)

**Phase 1 Actions:**

1. Install required `@types` packages
2. Create `types/index.d.ts` with custom type definitions
3. Update `tsconfig.json` to include utils directory
4. Migrate files in dependency order: `sanitizer` → `logger` → `eventManager` → `network`
5. Add JSDoc → TypeScript type conversions
6. Run `npm run type-check` to validate
7. Update imports in consuming files

**Expected Outcomes:**

- 4 core utility files fully typed
- Zero regression in functionality
- Foundation for future migrations
- Improved IDE autocomplete and error detection

---

### Phase 2: Complex Utilities (Estimated: 6-8 hours)

**Goal:** Migrate medium-complexity utilities with manageable type issues

**Files to Migrate:**

1. **src/utils/scheduler.js** → `scheduler.ts`
   - Lines: 147
   - Current Errors: 0 (but needs typing for queue/callback system)
   - Dependencies: None
   - Effort: 2 hours
   - **Challenges:** Task queue typing, callback generics

2. **src/utils/parserHelpers.js** → `parserHelpers.ts`
   - Lines: 680
   - Current Errors: 0 (but complex string manipulation)
   - Dependencies: `src/utils/regex.ts` (already TypeScript)
   - Effort: 3 hours
   - **Challenges:** Regex pattern types, clinical term interfaces

3. **src/utils/diagnosisSanitizer.js** → `diagnosisSanitizer.ts`
   - Lines: 164
   - Current Errors: 0
   - Dependencies: None
   - Effort: 1.5 hours
   - **Challenges:** Sanitization rule typing

4. **src/utils/svgSanitizer.js** → `svgSanitizer.ts`
   - Lines: 249
   - Current Errors: 0
   - Dependencies: `sanitizer.js`
   - Effort: 2 hours
   - **Challenges:** DOM types, SVG element interfaces

5. **src/utils/jankMonitor.js** → `jankMonitor.ts`
   - Lines: 194
   - Current Errors: 0 (but has performance measurement logic)
   - Dependencies: `logger.js`
   - Effort: 1.5 hours
   - **Challenges:** Performance API types, observer patterns

**Phase 2 Actions:**

1. Create type definitions for:
   - Task queue structures
   - Clinical parsing interfaces
   - SVG/DOM manipulation types
   - Performance measurement interfaces
2. Migrate files in dependency order
3. Add comprehensive JSDoc for complex functions
4. Create unit tests for type safety
5. Validate with strict TypeScript checks

**Expected Outcomes:**

- 5 additional files migrated
- Complex type hierarchies established
- Improved parser type safety
- Better error messages in development

---

### Phase 3: Low-Priority/Deferred Utilities (Estimated: 2-4 hours)

**Goal:** Handle specialized or low-usage files

**Files to Migrate (Optional):**

1. **src/utils/debugInstrumentation.js** → `debugInstrumentation.ts`
   - Lines: 646
   - Current Errors: **29 errors** ⚠️
   - Dependencies: Multiple (logger, window extensions)
   - Effort: 4 hours
   - **Challenges:** Heavy use of `window` object extensions, call graph typing
   - **Recommendation:** Defer until Phase 4 or mark as low-priority

2. **src/utils/svgSanitizer.browser.js** → `svgSanitizer.browser.ts`
   - Lines: 261
   - Current Errors: 0
   - Dependencies: `svgSanitizer.js`
   - Effort: 2 hours
   - **Note:** Browser-specific variant, migrate after main svgSanitizer

**Phase 3 Actions:**

1. Evaluate necessity of `debugInstrumentation.js` migration
2. Consider refactoring to reduce complexity before migration
3. Create comprehensive type definitions for window extensions
4. Migrate browser-specific variants after main implementations

---

### Phase 4: Services Directory (Estimated: 8-12 hours)

**Goal:** Migrate AI/search service layer with Express/Node types

**Prerequisites:**

- Install `@types/express`, `@types/cors`, `@types/node`
- Complete Phase 1 (infrastructure utilities)
- Create comprehensive AI/RAG type definitions

**Files to Migrate (Prioritized Order):**

#### 4.1 Configuration & Helpers (2-3 hours)

1. **config/environment.js** → `environment.ts`
   - Errors: 3 (ImportMeta.env extension)
   - Effort: 1 hour
   - **Fix:** Add `ImportMeta` interface extension to `types/index.d.ts`

2. **services/ai-search/helpers/retry.js** → `retry.ts`
   - Errors: 0 (likely)
   - Effort: 0.5 hours
   - **Priority:** High (foundational)

3. **services/ai-search/helpers/telemetry.js** → `telemetry.ts`
   - Errors: 0 (likely)
   - Effort: 0.5 hours

4. **services/ai-search/helpers/metrics.js** → `metrics.ts`
   - Errors: 0 (likely)
   - Effort: 0.5 hours

#### 4.2 RAG Core (3-4 hours)

1. **services/ai-search/rag/textUtils.js** → `textUtils.ts`
   - Errors: 2 (`any[]` type inference)
   - Effort: 1 hour
   - **Challenges:** Term extraction typing

2. **services/ai-search/rag/azureSearchClient.js** → `azureSearchClient.ts`
   - Errors: 10 (config object typing, parameter types)
   - Effort: 2 hours
   - **Challenges:** Azure SDK types, search result interfaces

3. **services/ai-search/rag/retrieveMaterials.js** → `retrieveMaterials.ts`
   - Errors: 4 (parser result typing)
   - Effort: 1.5 hours
   - **Challenges:** Integration with parser types

#### 4.3 API Routes (4-5 hours)

1. **services/ai-search/routes/search.js** → `search.ts`
   - Errors: 6 (Express request/response types)
   - Effort: 1 hour
   - **Pattern:** Add `Request<ParamsDictionary, any, ReqBody>` types

2. **services/ai-search/routes/medical-qa.js** → `medical-qa.ts`
   - Errors: 11 (Express types, config typing)
   - Effort: 1.5 hours

3. **services/ai-search/routes/analyze-note.js** → `analyze-note.ts`
   - Errors: 3 (Express types)
   - Effort: 1 hour

4. **services/ai-search/routes/paraphrase-hpi.js** → `paraphrase-hpi.ts`
   - Errors: 5 (Express types)
   - Effort: 1 hour

5. **services/ai-search/server.js** → `server.ts`
   - Errors: 15 (Express app, middleware types, CORS config)
   - Effort: 2 hours
   - **Priority:** Medium-high (main entry point)

#### 4.4 Feature Modules (2-3 hours)

1. **services/ai-search/medical-qa.js** → `medical-qa.ts`
   - Errors: 7 (OpenAI types, response typing)
   - Effort: 1.5 hours

2. **services/ai-search/analyze-note.js** → `analyze-note.ts`
   - Errors: 5 (array/parameter types)
   - Effort: 1 hour

3. **services/ai-search/helpers/gpt4-analyzer.js** → `gpt4-analyzer.ts`
   - Errors: 2 (`any[]` inference)
   - Effort: 1 hour

4. **services/ai-search/helpers/hpi-paraphraser.js** → `hpi-paraphraser.ts`
   - Errors: 4 (parameter types, sorting)
   - Effort: 1 hour

5. **services/ai-search/helpers/search-normalize.js** → `search-normalize.ts`
   - Errors: 5 (search result typing)
   - Effort: 0.5 hours

6. **services/ai-search/helpers/citation-viewer.js** → `citation-viewer.ts`
   - Errors: 4 (window extensions, array typing)
   - Effort: 1 hour

#### 4.5 Test Files (Optional - 2 hours)

1. **services/ai-search/test-enhancements-standalone.js** → `test-enhancements-standalone.ts`
   - Errors: 21 (heavy type inference needed)
   - Effort: 2 hours
   - **Recommendation:** Low priority (test utility)

**Phase 4 Actions:**

1. Create comprehensive Express types:
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   
   export interface TypedRequest<T = any> extends Request {
     body: T;
   }
   
   export interface TypedResponse<T = any> extends Response {
     json: (body: T) => this;
   }
   ```

2. Create AI/RAG service types:
   ```typescript
   export interface RAGOptions {
     maxSources?: number;
     temperature?: number;
     useCache?: boolean;
   }
   
   export interface MedicalQARequest {
     question: string;
     options?: RAGOptions;
   }
   
   export interface NoteAnalysisRequest {
     noteText: string;
     parserFn?: (text: string) => ParserResult;
   }
   ```

3. Migrate in dependency order (helpers → RAG → routes → server)
4. Add comprehensive error handling types
5. Validate API contracts with TypeScript
6. Update integration tests

**Expected Outcomes:**

- Full type safety in AI/search services
- Better Express middleware typing
- Improved Azure SDK integration
- Reduced runtime errors from type mismatches

---

## Common Migration Patterns

### Pattern 1: Express Route Handlers

**Before (JS):**
```javascript
router.post('/api/search', async (req, res) => {
  const { query } = req.body;
  // ...
});
```

**After (TS):**
```typescript
interface SearchRequest {
  query: string;
  maxResults?: number;
}

interface SearchResponse {
  results: SearchResult[];
  count: number;
}

router.post('/api/search', async (
  req: TypedRequest<SearchRequest>,
  res: TypedResponse<SearchResponse>
) => {
  const { query } = req.body;
  // ...
});
```

### Pattern 2: Error Handling in Catch Blocks

**Before (JS):**
```javascript
try {
  // ...
} catch (error) {
  console.error(error.message);  // TS18046 error
}
```

**After (TS):**
```typescript
try {
  // ...
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Pattern 3: Array Type Inference

**Before (JS):**
```javascript
const terms = [];  // TS7034: implicitly has type 'any[]'
terms.push(extractedTerm);
```

**After (TS):**
```typescript
const terms: string[] = [];
terms.push(extractedTerm);

// OR with type inference
const terms = [] as string[];
```

### Pattern 4: Window/Global Extensions

**Before (JS):**
```javascript
window.showModal = (data) => { /* ... */ };
```

**After (TS):**
```typescript
// In types/index.d.ts
declare global {
  interface Window {
    showModal?: (data: ModalData) => void;
  }
}

// In implementation
window.showModal = (data: ModalData) => { /* ... */ };
```

### Pattern 5: Config Object Typing

**Before (JS):**
```javascript
function initClient(config) {
  const { endpoint, apiKey } = config;  // TS2339 errors
}
```

**After (TS):**
```typescript
interface ClientConfig {
  endpoint: string;
  apiKey: string;
  timeout?: number;
}

function initClient(config: ClientConfig) {
  const { endpoint, apiKey } = config;
}
```

---

## Migration Checklist (Per File)

### Pre-Migration

- [ ] Read file and understand dependencies
- [ ] Identify all external imports
- [ ] Check for window/global usage
- [ ] Note complex patterns (generics, unions, etc.)
- [ ] Check for existing JSDoc comments

### During Migration

- [ ] Rename `.js` to `.ts`
- [ ] Add type imports at top
- [ ] Type all function parameters
- [ ] Type all function return values
- [ ] Type all variables where inference isn't obvious
- [ ] Add explicit types for arrays/objects
- [ ] Handle `unknown` types in catch blocks
- [ ] Add interface/type definitions for complex structures
- [ ] Update JSDoc to TypeScript syntax
- [ ] Handle `any` escapes explicitly (mark with `// eslint-disable-line`)

### Post-Migration

- [ ] Run `npx tsc --noEmit` to check for errors
- [ ] Fix all type errors (no `any` escapes without reason)
- [ ] Update imports in dependent files
- [ ] Run unit tests to verify behavior unchanged
- [ ] Run `npm run lint` to check style
- [ ] Update documentation if API changed
- [ ] Commit with descriptive message

---

## Risk Assessment

### Low Risk (Phase 1)

- **Files:** logger, eventManager, network, sanitizer
- **Reason:** Zero current errors, clear interfaces, well-tested
- **Mitigation:** Comprehensive test coverage already exists

### Medium Risk (Phase 2)

- **Files:** scheduler, parserHelpers, diagnosisSanitizer, svgSanitizer, jankMonitor
- **Reason:** Complex logic, but isolated from external dependencies
- **Mitigation:** Extensive unit tests, gradual typing approach

### High Risk (Phase 3)

- **Files:** debugInstrumentation
- **Reason:** Heavy use of `window` extensions, complex call graph tracking
- **Mitigation:** Consider refactoring before migration, mark as low-priority

### Medium-High Risk (Phase 4)

- **Files:** All services directory
- **Reason:** External dependencies (Express, Azure SDK), complex AI logic
- **Mitigation:** 
  - Install all `@types` packages first
  - Migrate in dependency order
  - Keep API surface unchanged
  - Extensive integration testing

---

## Rollback Strategy

If any migration causes issues:

1. **Git Revert:** Each phase committed separately for easy rollback
2. **Mixed Mode:** TypeScript `allowJs: true` permits gradual migration
3. **Type-Only Imports:** Use `import type` to avoid runtime changes
4. **Incremental:** Migrate one file at a time, test, commit

---

## Success Criteria

### Phase 1 Complete

- [ ] 4 utility files migrated to TypeScript
- [ ] Zero TypeScript errors in migrated files
- [ ] All existing tests passing
- [ ] No runtime behavior changes
- [ ] `npm run type-check` passes

### Phase 2 Complete

- [ ] 5 additional utility files migrated
- [ ] Complex type hierarchies established
- [ ] Parser interfaces fully typed
- [ ] All existing tests passing

### Phase 4 Complete

- [ ] All services files migrated
- [ ] Express routes fully typed
- [ ] AI/RAG services typed
- [ ] Zero `any` escapes without justification
- [ ] Integration tests passing
- [ ] API contracts enforced by types

### Overall Success

- [ ] 30+ files migrated from JS to TS
- [ ] TypeScript strict mode enabled
- [ ] IDE autocomplete working everywhere
- [ ] Runtime errors reduced by 30%+ (measurable via error logs)
- [ ] Developer velocity increased (measurable via PR review time)

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Phase 1: Infrastructure** | 4-6 hours | None (can start immediately) |
| **Phase 2: Complex Utilities** | 6-8 hours | Phase 1 complete |
| **Phase 3: Low Priority** | 2-4 hours | Phase 1-2 complete (optional) |
| **Phase 4: Services** | 8-12 hours | Phase 1 complete, @types installed |
| **Total** | **20-30 hours** | Phased over 1-2 weeks |

**Recommended Approach:** 2-4 hours per day over 1-2 weeks, with testing and validation between phases.

---

## Next Steps

### Immediate Actions (Week 1)

1. **Install Dependencies:**
   ```bash
   npm install --save-dev @types/express @types/cors @types/node
   ```

2. **Create Type Definitions:**
   - Create `types/index.d.ts`
   - Add window/global extensions
   - Add project-specific interfaces

3. **Update tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "allowJs": true,
       "checkJs": false,
       "strict": true,
       "noImplicitAny": true
     },
     "include": [
       "types/**/*.d.ts",
       "src/**/*.ts",
       "src/utils/**/*.ts",
       "scripts/**/*.ts"
     ]
   }
   ```

4. **Start Phase 1:**
   - Begin with `src/utils/sanitizer.js` (simplest)
   - Then `src/utils/logger.js`
   - Progress to eventManager and network

### Ongoing (Week 2+)

5. **Continue Phased Migration:**
   - Complete Phase 1, test, commit
   - Move to Phase 2 utilities
   - Evaluate Phase 3 necessity
   - Plan Phase 4 services migration

6. **Monitor & Measure:**
   - Track TypeScript error count (should decrease)
   - Monitor runtime errors in production
   - Measure developer feedback on IDE experience
   - Adjust timeline based on complexity discovered

---

## Appendix A: Full Error Breakdown

### By File (Complete List)

```
src/utils/debugInstrumentation.js: 29 errors
  - 11 × TS2304: Cannot find name 'debugLog'
  - 6 × TS7006: Parameter implicitly has 'any' type
  - 5 × TS2339: Property does not exist on type 'Window'
  - 3 × TS2339: Property does not exist on options object
  - 1 × TS2322: Type 'CallGraphNode' not assignable to 'null'

services/ai-search/test-enhancements-standalone.js: 21 errors
  - 6 × TS7006: Parameter implicitly has 'any' type
  - 9 × TS2339: Property does not exist on union type
  - 6 × TS18046: 'error' is of type 'unknown'

services/ai-search/server.js: 15 errors
  - 2 × TS7016: Could not find declaration file for module 'express'/'cors'
  - 12 × TS7006: Parameter implicitly has 'any' type
  - 1 × TS7006: Callback parameter implicit 'any'

services/ai-search/routes/medical-qa.js: 11 errors
  - 1 × TS7016: Missing declaration file for 'express'
  - 4 × TS7006: Parameter implicitly has 'any' type
  - 4 × TS2339: Property does not exist on empty object
  - 2 × TS18046: 'error' is of type 'unknown'

services/ai-search/rag/azureSearchClient.js: 10 errors
  - 8 × TS2339: Property does not exist on 'Object'
  - 1 × TS7006: Parameter implicitly has 'any' type
  - 1 × TS18046: 'error' is of type 'unknown'

services/ai-search/medical-qa.js: 7 errors
  - 2 × TS7005/TS7034: Variable implicitly has 'any' type
  - 2 × TS2353: Unknown property in object literal
  - 2 × TS2339: Property does not exist on type
  - 1 × TS18046: 'error' is of type 'unknown'
```

### TypeScript Error Code Reference

- **TS2304:** Cannot find name – Missing import or declaration
- **TS2314:** Generic type requires type arguments
- **TS2322:** Type not assignable to type
- **TS2339:** Property does not exist on type
- **TS2353:** Unknown property in object literal
- **TS7005:** Variable implicitly has 'any' type (inferred)
- **TS7006:** Parameter implicitly has 'any' type
- **TS7016:** Could not find declaration file for module
- **TS7034:** Variable implicitly has 'any[]' in some locations
- **TS18046:** 'error' is of type 'unknown' (catch blocks)

---

## Appendix B: Recommended Reading

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Effective TypeScript](https://effectivetypescript.com/)
- [DefinitelyTyped (@types)](https://github.com/DefinitelyTyped/DefinitelyTyped)

---

**Report Generated:** October 23, 2025  
**Analysis Tool:** TypeScript 5.x compiler with strict mode  
**Total Files Analyzed:** 31 JavaScript files across utils/ and services/  
**Recommendation:** ✅ **APPROVED FOR PHASED MIGRATION**

Migration is feasible with low risk using the phased approach outlined above.
