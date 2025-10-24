/* eslint-env browser */
// ============================================================================
// EDUCATION MODULE – Reference-only content. Do not modify global layout or theme.
// ============================================================================
//
// Purpose: Static educational resources for clinical learning and AI reference
//
// ⚠️ IMPORTANT:
// - This module does NOT modify existing UI (layout, colors, typography, grid)
// - Educational content only appears under #/education route
// - No changes to homepage, sidebar, or existing navigation
// - All existing components retain their original spacing, fonts, and colors
// - When extending: ADD new content, DO NOT refactor existing code
//
// ============================================================================

import { debugLog, debugWarn, debugError } from "../utils/logger.js";

/**
 * Education Module - Educational Content Manager
 *
 * Manages static educational resources including:
 * - Clinical guidelines and protocols
 * - Medical reference materials
 * - Learning modules and tutorials
 * - Source material for AI-powered features
 */
export class EducationModule {
  constructor() {
    this.resources = [];
    this.initialized = false;
  }

  /**
   * Initialize the education module
   * Called only when #/education route is accessed
   */
  async init() {
    if (this.initialized) return;

    debugLog("📚 Education Module: Initializing...");

    try {
      // Load available resources
      await this.loadResourceIndex();
      this.initialized = true;
      debugLog("✅ Education Module: Ready");
    } catch (error) {
      debugError("❌ Education Module: Initialization failed", error);
    }
  }

  /**
   * Load the index of available educational resources
   */
  async loadResourceIndex() {
    // Placeholder for resource loading
    // Future: Load from JSON manifest or directory scan
    this.resources = [];
  }

  /**
   * Render the education landing page
   * @returns {string} HTML string for education page
   */
  render() {
    return `
      <div class="education-container">
        <h1>📚 Educational Resources</h1>
        <p class="education-description">
          Clinical learning materials and reference content.
        </p>

        <div class="education-placeholder">
          <p><em>Educational content will be added here.</em></p>
          <p>This module is ready to accept markdown files, PDFs, and text resources.</p>
        </div>
      </div>
    `;
  }

  /**
   * Get all available resources
   * @returns {Array} List of educational resources
   */
  getResources() {
    return this.resources;
  }

  /**
   * Search resources by keyword
   * @param {string} query - Search query
   * @returns {Array} Filtered resources
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.resources.filter(
      (resource) =>
        resource.title?.toLowerCase().includes(lowerQuery) ||
        resource.description?.toLowerCase().includes(lowerQuery) ||
        resource.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }
}

// Export singleton instance
export const educationModule = new EducationModule();
