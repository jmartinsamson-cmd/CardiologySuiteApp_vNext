/* eslint-env browser */
// ============================================================================
// EDUCATION ROUTE INTEGRATION EXAMPLE
// ============================================================================
//
// This file shows HOW to integrate the education module with your router.
// DO NOT automatically add this to the main router - wait for user confirmation.
//
// ⚠️ This is an EXAMPLE ONLY - not active code
//
// ============================================================================

/**
 * Example: How to add education route to src/core/router.js
 *
 * Add this to your existing routes object WITHOUT modifying other routes:
 */

// EXAMPLE - Add to router.js routes object:
// eslint-disable-next-line no-unused-vars
const educationRouteExample = {
  education: async () => {
    try {
      // Lazy-load the education module
      const { educationModule } = await import("../education/index.js");

      // Initialize the module
      await educationModule.init();

      // Render to main content area (adjust selector as needed)
      const mainContent =
        document.getElementById("main-content") ||
        document.querySelector("main") ||
        document.body;

      mainContent.innerHTML = educationModule.render();

      console.log("📚 Education route loaded");
    } catch (error) {
      console.error("Failed to load education module:", error);

      // Fallback error message
      const mainContent =
        document.getElementById("main-content") || document.body;
      mainContent.innerHTML = `
        <div style="padding: 2rem;">
          <h2>⚠️ Unable to load educational resources</h2>
          <p>Please try again or contact support.</p>
        </div>
      `;
    }
  },
};

/**
 * Example: How to add navigation link (OPTIONAL - only if user requests it)
 *
 * This should be added SEPARATELY from main navigation, clearly marked as educational
 */
// eslint-disable-next-line no-unused-vars
const navigationLinkExample = `
  <!-- Add to a SEPARATE section in your HTML, NOT main nav -->
  <nav class="education-nav" style="border-top: 1px solid var(--border-color);">
    <h3>📚 Resources</h3>
    <a href="#/education" class="nav-link">
      Educational Materials
    </a>
  </nav>
`;

/**
 * Integration Checklist:
 *
 * ✅ Create education folder structure
 * ✅ Add index.js module
 * ⏸️ Add route to router.js (wait for user confirmation)
 * ⏸️ Add navigation link (optional, only if requested)
 * ⏸️ Test route in isolation
 * ⏸️ Add first educational resource
 */

// Export as documentation
export const integrationGuide = {
  step1: "Education folder created",
  step2: "Module files in place",
  step3: "Waiting for confirmation to integrate route",
  step4: "Optional: Add navigation after testing",

  notes: [
    "DO NOT modify existing routes",
    "DO NOT change existing navigation",
    "DO NOT alter any UI components",
    "Keep education section isolated",
    "Test thoroughly before going live",
  ],
};
