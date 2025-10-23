// @ts-nocheck
/* eslint-env browser */

/**
 * Evidence-Based Plan Integration Bridge
 * Connects the TypeScript evidence-based plan generator with the existing JavaScript parser system
 */

// Import the evidence-based plan generator
// Note: This will work once TypeScript is compiled to JavaScript
let evidenceBasedPlanGenerator = null;

/**
 * Initialize evidence-based plan generator
 * This function loads the TypeScript module once it's compiled
 */
async function initializeEvidenceBasedPlan() {
  try {
    // Dynamic import of the compiled TypeScript module
    const module = await import('./evidenceBasedPlan.js');
    evidenceBasedPlanGenerator = module;
    console.log('Evidence-based plan generator loaded successfully');
  } catch (error) {
    console.warn('Evidence-based plan generator not available:', error.message);
    // Fallback: create a stub implementation
    evidenceBasedPlanGenerator = {
      generateEvidenceBasedPlan: () => null,
      listAvailableGuidelines: () => [],
      getGuidelineReference: () => null
    };
  }
}

/**
 * Generate evidence-based clinical plan (wrapper function)
 * @param {Object} parsedNote - Parsed clinical note data
 * @returns {string|null} - Formatted evidence-based plan or null
 */
function generateEvidenceBasedPlan(parsedNote) {
  if (!evidenceBasedPlanGenerator) {
    console.warn('Evidence-based plan generator not initialized');
    return null;
  }

  try {
    return evidenceBasedPlanGenerator.generateEvidenceBasedPlan(parsedNote);
  } catch (error) {
    console.error('Error generating evidence-based plan:', error);
    return null;
  }
}

/**
 * Get available clinical guidelines
 * @returns {string[]} - List of available guideline conditions
 */
function getAvailableGuidelines() {
  if (!evidenceBasedPlanGenerator) {
    return [];
  }

  try {
    return evidenceBasedPlanGenerator.listAvailableGuidelines();
  } catch (error) {
    console.error('Error getting guidelines:', error);
    return [];
  }
}

/**
 * Get specific guideline reference
 * @param {string} condition - Clinical condition name
 * @returns {Object|null} - Guideline protocol or null
 */
function getGuidelineReference(condition) {
  if (!evidenceBasedPlanGenerator) {
    return null;
  }

  try {
    return evidenceBasedPlanGenerator.getGuidelineReference(condition);
  } catch (error) {
    console.error('Error getting guideline reference:', error);
    return null;
  }
}

// Auto-initialize when this module loads
try {
  await initializeEvidenceBasedPlan();
} catch (error) {
  console.error('Failed to initialize evidence-based plan:', error);
}

// Export functions for global access (matching existing parser pattern)
if (globalThis.window !== undefined) {
  globalThis.generateEvidenceBasedPlan = generateEvidenceBasedPlan;
  globalThis.getAvailableGuidelines = getAvailableGuidelines;
  globalThis.getGuidelineReference = getGuidelineReference;
}

export { 
  generateEvidenceBasedPlan, 
  getAvailableGuidelines, 
  getGuidelineReference,
  initializeEvidenceBasedPlan 
};