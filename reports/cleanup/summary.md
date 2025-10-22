# Cleanup Summary

Generated: 2025-10-22T14:40:29.987Z
Branch: chore/repo-cleanup (commit 39eace4)

## Files flagged by multiple tools

- src/education/index.js — tools: ts-prune, ts-morph (details: ts-prune:EducationModule; ts-prune:educationModule; ts-morph:EducationModule; ts-morph:educationModule)
- src/education/router-integration.example.js — tools: ts-prune, ts-morph (details: ts-prune:integrationGuide; ts-morph:integrationGuide)
- src/parsers/aiAnalyzer.js — tools: ts-prune, ts-morph (details: ts-prune:enrichWithAIAnalysis; ts-prune:checkAIAnalyzerAvailability; ts-morph:enrichWithAIAnalysis; ts-morph:checkAIAnalyzerAvailability)
- src/parsers/cardiology/index.js — tools: ts-prune, ts-morph (details: ts-prune:default; ts-morph:default)
- src/parsers/clinicalSafety.js — tools: ts-prune, ts-morph (details: ts-prune:validateClinicalSafety; ts-prune:generateEvidenceBasedPlan; ts-morph:validateClinicalSafety; ts-morph:generateEvidenceBasedPlan)
- src/parsers/entityExtraction.js — tools: ts-prune, ts-morph (details: ts-prune:extractClinicalContext; ts-prune:disambiguateDiagnoses; ts-morph:extractClinicalContext; ts-morph:disambiguateDiagnoses)
- src/parsers/evidenceBasedPlan.js — tools: ts-prune, ts-morph (details: ts-prune:generateEvidenceBasedPlan; ts-prune:getGuidelineReference; ts-prune:listAvailableGuidelines; ts-prune:CLINICAL_GUIDELINES; ts-morph:generateEvidenceBasedPlan; ts-morph:getGuidelineReference; ts-morph:listAvailableGuidelines; ts-morph:CLINICAL_GUIDELINES)
- src/parsers/noteParser_full_async.js — tools: ts-prune, ts-morph (details: ts-prune:MAIN_HEADERS; ts-prune:PRIOR_LINES; ts-prune:LAB_LINE_FULL; ts-prune:parseClinicalNoteFull; ts-prune:default; ts-morph:MAIN_HEADERS; ts-morph:PRIOR_LINES; ts-morph:LAB_LINE_FULL; ts-morph:parseClinicalNoteFull; ts-morph:default)
- src/parsers/parserChunker.js — tools: ts-prune, ts-morph (details: ts-prune:parseWithYield; ts-prune:parseNoteChunked; ts-morph:parseWithYield; ts-morph:parseNoteChunked)
- src/parsers/smartParser.js — tools: ts-prune, ts-morph (details: ts-prune:fallbackParse; ts-prune:default; ts-morph:fallbackParse; ts-morph:default)
- src/parsers/synonyms.js — tools: ts-prune, ts-morph (details: ts-prune:SECTION_SYNONYMS; ts-prune:buildSynonymLookup; ts-morph:SECTION_SYNONYMS; ts-morph:buildSynonymLookup)
- src/server/ai-search/azureFileContext.js — tools: ts-prune, ts-morph (details: ts-prune:streamToString; ts-prune:default; ts-morph:streamToString; ts-morph:default)
- src/utils/diagnosisSanitizer.js — tools: ts-prune, ts-morph (details: ts-prune:default; ts-morph:default)
- src/utils/regex.ts — tools: ts-prune, ts-morph (details: ts-prune:withGlobal; ts-morph:withGlobal)
- src/utils/sanitizer.js — tools: ts-prune, ts-morph (details: ts-prune:sanitize; ts-morph:sanitize)
- src/utils/scheduler.js — tools: ts-prune, ts-morph (details: ts-prune:yieldIfNeeded; ts-prune:withYielding; ts-prune:processArrayInChunks; ts-prune:runWithTimeout; ts-prune:scheduleUIUpdate; ts-prune:batchUIUpdates; ts-morph:yieldIfNeeded; ts-morph:withYielding; ts-morph:processArrayInChunks; ts-morph:runWithTimeout; ts-morph:scheduleUIUpdate; ts-morph:batchUIUpdates)
- src/utils/svgSanitizer.js — tools: ts-prune, ts-morph (details: ts-prune:sanitizeSVGViewBox; ts-prune:sanitizeAllSVGs; ts-prune:installSVGSanitizer; ts-prune:initSVGSanitizer; ts-morph:sanitizeSVGViewBox; ts-morph:sanitizeAllSVGs; ts-morph:installSVGSanitizer; ts-morph:initSVGSanitizer)
- services/ai-search/helpers/citation-viewer.js — tools: ts-prune, ts-morph (details: ts-prune:createCitationModal; ts-prune:showCitationModal; ts-prune:closeCitationModal; ts-prune:initCitationModal; ts-morph:createCitationModal; ts-morph:showCitationModal; ts-morph:closeCitationModal; ts-morph:initCitationModal)
- services/ai-search/helpers/gpt4-analyzer.js — tools: ts-prune, ts-morph (details: ts-prune:getOpenAIClient; ts-prune:analyzeNoteWithGPT4; ts-morph:getOpenAIClient; ts-morph:analyzeNoteWithGPT4)
- services/ai-search/helpers/hpi-paraphraser.js — tools: ts-prune, ts-morph (details: ts-prune:getActiveHpiDeployment; ts-morph:getActiveHpiDeployment)
- services/ai-search/helpers/metrics.js — tools: ts-prune, ts-morph (details: ts-prune:registry; ts-morph:registry)
- services/ai-search/rag/azureSearchClient.js — tools: ts-prune, ts-morph (details: ts-prune:getSearchStatus; ts-morph:getSearchStatus)
- services/ai-search/rag/retrieveMaterials.js — tools: ts-prune, ts-morph (details: ts-prune:retrieveEvidence; ts-prune:concatEvidence; ts-prune:buildClinicalQuery; ts-morph:retrieveEvidence; ts-morph:concatEvidence; ts-morph:buildClinicalQuery)
- services/ai-search/rag/textUtils.js — tools: ts-prune, ts-morph (details: ts-prune:deidentify; ts-prune:truncate; ts-prune:extractKeyTerms; ts-morph:deidentify; ts-morph:truncate; ts-morph:extractKeyTerms)
- services/ai-search/routes/analyze-note.js — tools: ts-prune, ts-morph (details: ts-prune:registerAnalyzeNoteRoutes; ts-morph:registerAnalyzeNoteRoutes)
- services/ai-search/routes/paraphrase-hpi.js — tools: ts-prune, ts-morph (details: ts-prune:registerParaphraseHPIRoutes; ts-morph:registerParaphraseHPIRoutes)
- services/ai-search/routes/search.js — tools: ts-prune, ts-morph (details: ts-prune:registerSearchRoutes; ts-morph:registerSearchRoutes)
- services/ai-search/test-enhancements.js — tools: ts-prune, ts-morph (details: ts-prune:runTests; ts-morph:runTests)

## Dead exports

- src/education/index.js :: EducationModule
- src/education/index.js :: educationModule
- src/education/router-integration.example.js :: integrationGuide
- src/parsers/aiAnalyzer.js :: enrichWithAIAnalysis
- src/parsers/aiAnalyzer.js :: checkAIAnalyzerAvailability
- src/parsers/cardiology/index.js :: default
- src/parsers/clinicalSafety.js :: validateClinicalSafety
- src/parsers/clinicalSafety.js :: generateEvidenceBasedPlan
- src/parsers/entityExtraction.js :: extractClinicalContext
- src/parsers/entityExtraction.js :: disambiguateDiagnoses
- src/parsers/evidenceBasedPlan.js :: generateEvidenceBasedPlan
- src/parsers/evidenceBasedPlan.js :: getGuidelineReference
- src/parsers/evidenceBasedPlan.js :: listAvailableGuidelines
- src/parsers/evidenceBasedPlan.js :: CLINICAL_GUIDELINES
- src/parsers/noteParser_full_async.js :: MAIN_HEADERS
- src/parsers/noteParser_full_async.js :: PRIOR_LINES
- src/parsers/noteParser_full_async.js :: LAB_LINE_FULL
- src/parsers/noteParser_full_async.js :: parseClinicalNoteFull
- src/parsers/noteParser_full_async.js :: default
- src/parsers/parserChunker.js :: parseWithYield
- src/parsers/parserChunker.js :: parseNoteChunked
- src/parsers/smartParser.js :: fallbackParse
- src/parsers/smartParser.js :: default
- src/parsers/synonyms.js :: SECTION_SYNONYMS
- src/parsers/synonyms.js :: buildSynonymLookup
- src/server/ai-search/azureFileContext.js :: streamToString
- src/server/ai-search/azureFileContext.js :: default
- src/utils/diagnosisSanitizer.js :: default
- src/utils/regex.ts :: withGlobal
- src/utils/sanitizer.js :: sanitize
- src/utils/scheduler.js :: yieldIfNeeded
- src/utils/scheduler.js :: withYielding
- src/utils/scheduler.js :: processArrayInChunks
- src/utils/scheduler.js :: runWithTimeout
- src/utils/scheduler.js :: scheduleUIUpdate
- src/utils/scheduler.js :: batchUIUpdates
- src/utils/svgSanitizer.js :: sanitizeSVGViewBox
- src/utils/svgSanitizer.js :: sanitizeAllSVGs
- src/utils/svgSanitizer.js :: installSVGSanitizer
- src/utils/svgSanitizer.js :: initSVGSanitizer
- services/ai-search/helpers/citation-viewer.js :: createCitationModal
- services/ai-search/helpers/citation-viewer.js :: showCitationModal
- services/ai-search/helpers/citation-viewer.js :: closeCitationModal
- services/ai-search/helpers/citation-viewer.js :: initCitationModal
- services/ai-search/helpers/gpt4-analyzer.js :: getOpenAIClient
- services/ai-search/helpers/gpt4-analyzer.js :: analyzeNoteWithGPT4
- services/ai-search/helpers/hpi-paraphraser.js :: getActiveHpiDeployment
- services/ai-search/helpers/metrics.js :: registry
- services/ai-search/rag/azureSearchClient.js :: getSearchStatus
- services/ai-search/rag/retrieveMaterials.js :: retrieveEvidence
- services/ai-search/rag/retrieveMaterials.js :: concatEvidence
- services/ai-search/rag/retrieveMaterials.js :: buildClinicalQuery
- services/ai-search/rag/textUtils.js :: deidentify
- services/ai-search/rag/textUtils.js :: truncate
- services/ai-search/rag/textUtils.js :: extractKeyTerms
- services/ai-search/routes/analyze-note.js :: registerAnalyzeNoteRoutes
- services/ai-search/routes/paraphrase-hpi.js :: registerParaphraseHPIRoutes
- services/ai-search/routes/search.js :: registerSearchRoutes
- services/ai-search/test-enhancements.js :: runTests

## Unused assets

- styles/unified-diagnosis.css (1757 bytes)

## ts-prune (sample)

- src/education/index.js: EducationModule
- src/education/index.js: educationModule
- src/education/router-integration.example.js: integrationGuide
- src/parsers/aiAnalyzer.js: enrichWithAIAnalysis
- src/parsers/aiAnalyzer.js: checkAIAnalyzerAvailability
- src/parsers/cardiology/index.js: default
- src/parsers/clinicalSafety.js: validateClinicalSafety
- src/parsers/clinicalSafety.js: generateEvidenceBasedPlan
- src/parsers/entityExtraction.js: extractClinicalContext
- src/parsers/entityExtraction.js: disambiguateDiagnoses
- src/parsers/evidenceBasedPlan.js: generateEvidenceBasedPlan
- src/parsers/evidenceBasedPlan.js: getGuidelineReference
- src/parsers/evidenceBasedPlan.js: listAvailableGuidelines
- src/parsers/evidenceBasedPlan.js: CLINICAL_GUIDELINES
- src/parsers/noteParser_full_async.js: MAIN_HEADERS
- src/parsers/noteParser_full_async.js: PRIOR_LINES
- src/parsers/noteParser_full_async.js: LAB_LINE_FULL
- src/parsers/noteParser_full_async.js: parseClinicalNoteFull
- src/parsers/noteParser_full_async.js: default
- src/parsers/parserChunker.js: parseWithYield
- ...

## Removal dry-run

```
PENDING: src/education/index.js (tools: ts-prune, ts-morph) details: ts-prune:EducationModule; ts-prune:educationModule; ts-morph:EducationModule; ts-morph:educationModule
PENDING: src/education/router-integration.example.js (tools: ts-prune, ts-morph) details: ts-prune:integrationGuide; ts-morph:integrationGuide
PENDING: src/parsers/aiAnalyzer.js (tools: ts-prune, ts-morph) details: ts-prune:enrichWithAIAnalysis; ts-prune:checkAIAnalyzerAvailability; ts-morph:enrichWithAIAnalysis; ts-morph:checkAIAnalyzerAvailability
PENDING: src/parsers/cardiology/index.js (tools: ts-prune, ts-morph) details: ts-prune:default; ts-morph:default
PENDING: src/parsers/clinicalSafety.js (tools: ts-prune, ts-morph) details: ts-prune:validateClinicalSafety; ts-prune:generateEvidenceBasedPlan; ts-morph:validateClinicalSafety; ts-morph:generateEvidenceBasedPlan
PENDING: src/parsers/entityExtraction.js (tools: ts-prune, ts-morph) details: ts-prune:extractClinicalContext; ts-prune:disambiguateDiagnoses; ts-morph:extractClinicalContext; ts-morph:disambiguateDiagnoses
PENDING: src/parsers/evidenceBasedPlan.js (tools: ts-prune, ts-morph) details: ts-prune:generateEvidenceBasedPlan; ts-prune:getGuidelineReference; ts-prune:listAvailableGuidelines; ts-prune:CLINICAL_GUIDELINES; ts-morph:generateEvidenceBasedPlan; ts-morph:getGuidelineReference; ts-morph:listAvailableGuidelines; ts-morph:CLINICAL_GUIDELINES
PENDING: src/parsers/noteParser_full_async.js (tools: ts-prune, ts-morph) details: ts-prune:MAIN_HEADERS; ts-prune:PRIOR_LINES; ts-prune:LAB_LINE_FULL; ts-prune:parseClinicalNoteFull; ts-prune:default; ts-morph:MAIN_HEADERS; ts-morph:PRIOR_LINES; ts-morph:LAB_LINE_FULL; ts-morph:parseClinicalNoteFull; ts-morph:default
PENDING: src/parsers/parserChunker.js (tools: ts-prune, ts-morph) details: ts-prune:parseWithYield; ts-prune:parseNoteChunked; ts-morph:parseWithYield; ts-morph:parseNoteChunked
PENDING: src/parsers/smartParser.js (tools: ts-prune, ts-morph) details: ts-prune:fallbackParse; ts-prune:default; ts-morph:fallbackParse; ts-morph:default
PENDING: src/parsers/synonyms.js (tools: ts-prune, ts-morph) details: ts-prune:SECTION_SYNONYMS; ts-prune:buildSynonymLookup; ts-morph:SECTION_SYNONYMS; ts-morph:buildSynonymLookup
PENDING: src/server/ai-search/azureFileContext.js (tools: ts-prune, ts-morph) details: ts-prune:streamToString; ts-prune:default; ts-morph:streamToString; ts-morph:default
PENDING: src/utils/diagnosisSanitizer.js (tools: ts-prune, ts-morph) details: ts-prune:default; ts-morph:default
PENDING: src/utils/regex.ts (tools: ts-prune, ts-morph) details: ts-prune:withGlobal; ts-morph:withGlobal
PENDING: src/utils/sanitizer.js (tools: ts-prune, ts-morph) details: ts-prune:sanitize; ts-morph:sanitize
PENDING: src/utils/scheduler.js (tools: ts-prune, ts-morph) details: ts-prune:yieldIfNeeded; ts-prune:withYielding; ts-prune:processArrayInChunks; ts-prune:runWithTimeout; ts-prune:scheduleUIUpdate; ts-prune:batchUIUpdates; ts-morph:yieldIfNeeded; ts-morph:withYielding; ts-morph:processArrayInChunks; ts-morph:runWithTimeout; ts-morph:scheduleUIUpdate; ts-morph:batchUIUpdates
PENDING: src/utils/svgSanitizer.js (tools: ts-prune, ts-morph) details: ts-prune:sanitizeSVGViewBox; ts-prune:sanitizeAllSVGs; ts-prune:installSVGSanitizer; ts-prune:initSVGSanitizer; ts-morph:sanitizeSVGViewBox; ts-morph:sanitizeAllSVGs; ts-morph:installSVGSanitizer; ts-morph:initSVGSanitizer
PENDING: services/ai-search/helpers/citation-viewer.js (tools: ts-prune, ts-morph) details: ts-prune:createCitationModal; ts-prune:showCitationModal; ts-prune:closeCitationModal; ts-prune:initCitationModal; ts-morph:createCitationModal; ts-morph:showCitationModal; ts-morph:closeCitationModal; ts-morph:initCitationModal
PENDING: services/ai-search/helpers/gpt4-analyzer.js (tools: ts-prune, ts-morph) details: ts-prune:getOpenAIClient; ts-prune:analyzeNoteWithGPT4; ts-morph:getOpenAIClient; ts-morph:analyzeNoteWithGPT4
PENDING: services/ai-search/helpers/hpi-paraphraser.js (tools: ts-prune, ts-morph) details: ts-prune:getActiveHpiDeployment; ts-morph:getActiveHpiDeployment
PENDING: services/ai-search/helpers/metrics.js (tools: ts-prune, ts-morph) details: ts-prune:registry; ts-morph:registry
PENDING: services/ai-search/rag/azureSearchClient.js (tools: ts-prune, ts-morph) details: ts-prune:getSearchStatus; ts-morph:getSearchStatus
PENDING: services/ai-search/rag/retrieveMaterials.js (tools: ts-prune, ts-morph) details: ts-prune:retrieveEvidence; ts-prune:concatEvidence; ts-prune:buildClinicalQuery; ts-morph:retrieveEvidence; ts-morph:concatEvidence; ts-morph:buildClinicalQuery
PENDING: services/ai-search/rag/textUtils.js (tools: ts-prune, ts-morph) details: ts-prune:deidentify; ts-prune:truncate; ts-prune:extractKeyTerms; ts-morph:deidentify; ts-morph:truncate; ts-morph:extractKeyTerms
PENDING: services/ai-search/routes/analyze-note.js (tools: ts-prune, ts-morph) details: ts-prune:registerAnalyzeNoteRoutes; ts-morph:registerAnalyzeNoteRoutes
PENDING: services/ai-search/routes/paraphrase-hpi.js (tools: ts-prune, ts-morph) details: ts-prune:registerParaphraseHPIRoutes; ts-morph:registerParaphraseHPIRoutes
PENDING: services/ai-search/routes/search.js (tools: ts-prune, ts-morph) details: ts-prune:registerSearchRoutes; ts-morph:registerSearchRoutes
PENDING: services/ai-search/test-enhancements.js (tools: ts-prune, ts-morph) details: ts-prune:runTests; ts-morph:runTests
```

## Suggested dependency pruning commands

- npm uninstall --save-dev @axe-core/playwright
- npm uninstall --save-dev @eslint/js
- npm uninstall --save-dev @types/node
- npm uninstall --save-dev htmlhint
- npm uninstall --save-dev json-server
- npm uninstall --save-dev rollup-plugin-visualizer
- npm uninstall --save-dev undici

## Estimated size impact

Potential savings: 165.85 KiB
