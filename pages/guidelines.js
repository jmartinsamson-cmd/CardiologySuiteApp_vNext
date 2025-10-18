/**
 * Guidelines Page Module
 * Lazy-loaded page for clinical guidelines and teaching
 * @module pages/guidelines
 */

/* global fetch, console */

let guidelinesData = null;

/**
 * Load diagnosis data from JSON
 * @returns {Promise<Object>}
 */
async function loadDiagnosisData() {
  if (guidelinesData) return guidelinesData;

  try {
    const response = await fetch("./data/cardiology_diagnoses/cardiology.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    guidelinesData = await response.json();
    console.log("✅ Loaded diagnosis database");
    return guidelinesData;
  } catch (error) {
    console.error("❌ Failed to load diagnosis data:", error);
    return { diagnoses: [] };
  }
}

/**
 * Mount guidelines page
 * @param {HTMLElement} rootEl - Root element to mount into
 * @returns {Promise<void>}
 */
export async function mountGuidelines(rootEl) {
  console.log("📋 Mounting Guidelines page...");

  if (!rootEl) {
    console.error("❌ No root element provided to mountGuidelines");
    return;
  }

  // Render page HTML
  rootEl.innerHTML = `
    <div class="guidelines-page">
      <header class="guidelines-header">
        <h1>📋 Clinical Guidelines & Teaching</h1>
        <p>Evidence-based cardiology guidelines and educational resources</p>
      </header>
      <main class="guidelines-content">
        <div class="guidelines-welcome">
          <h2>Welcome to Guidelines Center</h2>
          <p>Select a diagnosis or topic to view comprehensive clinical guidelines, teaching points, and evidence-based recommendations.</p>
          <div class="feature-grid">
            <div class="feature-card">
              <h3>🏛️ ACC/AHA Guidelines</h3>
              <p>Latest clinical practice guidelines</p>
            </div>
            <div class="feature-card">
              <h3>💡 Teaching Points</h3>
              <p>Key educational insights</p>
            </div>
            <div class="feature-card">
              <h3>📚 Resources</h3>
              <p>Evidence-based references</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  console.log("✅ Guidelines page mounted");
}

/**
 * Unmount guidelines page
 * @param {HTMLElement} rootEl - Root element
 */
export function unmountGuidelines(rootEl) {
  if (rootEl) {
    rootEl.innerHTML = "";
  }
  console.log("📋 Guidelines page unmounted");
}
