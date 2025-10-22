/**
 * Guidelines Page Module
 * Lazy-loaded page for clinical guidelines and teaching
 * 
 * ⚠️ LAYOUT LOCKED - DO NOT MODIFY STRUCTURE ⚠️
 * Last modified: 2025-10-22
 * This module renders a two-column layout with:
 * - Left sidebar: Diagnosis list with search
 * - Main content: Diagnosis details with tabbed interface
 * 
 * @module pages/guidelines
 */

/* global fetch, console, window */

/** @type {any} */
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

  // Load diagnosis data
  const database = /** @type {any} */ (await loadDiagnosisData());

  // Get diagnoses list (use global DIAGNOSES if available)
  const diagnoses = /** @type {any} */ (window).DIAGNOSES || [];

  // Render page HTML with sidebar
  rootEl.innerHTML = `
    <div id="guidelines-layout">
      <!-- Sidebar with diagnosis list -->
      <aside id="guidelines-sidebar">
        <div class="sidebar-header">
          <h3>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Diagnoses
          </h3>
          <div class="guidelines-search">
            <input type="text" id="guidelines-search-input" placeholder="Search diagnoses..." />
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
        </div>
        <div class="guidelines-dx-list">
          ${diagnoses.map((/** @type {any} */ dx) => `
            <a href="#" class="guidelines-dx-item" data-dx-id="${dx.id}">
              ${dx.name}
            </a>
          `).join('')}
        </div>
      </aside>

      <!-- Main content area -->
      <main id="guidelines-main">
        <div class="guidelines-welcome">
          <div class="welcome-content">
            <h2>📋 Clinical Guidelines & Teaching</h2>
            <p>Select a diagnosis from the sidebar to view comprehensive clinical guidelines, teaching points, and evidence-based recommendations.</p>
            <div class="feature-grid">
              <div class="feature-card">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <h4>🏛️ ACC/AHA Guidelines</h4>
                <p>Latest clinical practice guidelines</p>
              </div>
              <div class="feature-card">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <h4>💡 Teaching Points</h4>
                <p>Key educational insights</p>
              </div>
              <div class="feature-card">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <path fill="currentColor" d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                </svg>
                <h4>📚 Resources</h4>
                <p>Evidence-based references</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Initialize interactivity
  initializeGuidelinesInteractivity(rootEl, database);

  console.log("✅ Guidelines page mounted");
}

/**
 * Initialize guidelines page interactivity
 * @param {HTMLElement} rootEl - Root element
 * @param {any} database - Diagnosis database
 */
function initializeGuidelinesInteractivity(rootEl, database) {
  // Search functionality
  const searchInput = /** @type {HTMLInputElement | null} */ (rootEl.querySelector('#guidelines-search-input'));
  const dxItems = rootEl.querySelectorAll('.guidelines-dx-item');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const target = /** @type {HTMLInputElement} */ (e.target);
      if (!target) return;
      const query = target.value.toLowerCase();
      dxItems.forEach(item => {
        const text = item.textContent?.toLowerCase() || '';
        /** @type {HTMLElement} */ (item).style.display = text.includes(query) ? 'block' : 'none';
      });
    });
  }

  // Diagnosis click handlers
  dxItems.forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      const dxId = /** @type {HTMLElement} */ (item).dataset.dxId;
      if (!dxId) return;
      
      // Update active state
      dxItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Load and display diagnosis details
      await displayDiagnosisDetails(rootEl, dxId, database);
    });
  });
}

/**
 * Display diagnosis details in main content area
 * @param {HTMLElement} rootEl - Root element
 * @param {string} dxId - Diagnosis ID
 * @param {any} database - Diagnosis database
 */
async function displayDiagnosisDetails(rootEl, dxId, database) {
  const mainContent = rootEl.querySelector('#guidelines-main');
  if (!mainContent) return;

  // Find diagnosis in database
  const diagnosis = /** @type {any} */ (database)?.diagnoses?.find((/** @type {any} */ d) => d.id === dxId);
  
  if (!diagnosis) {
    mainContent.innerHTML = `
      <div class="guidelines-content-area">
        <div class="guidelines-header">
          <h2>Diagnosis Not Found</h2>
        </div>
        <p>Unable to load details for this diagnosis.</p>
      </div>
    `;
    return;
  }

  // Render diagnosis details with tabs
  mainContent.innerHTML = `
    <div class="guidelines-content-area">
      <div class="guidelines-header">
        <h2>${diagnosis.name}</h2>
        ${diagnosis.description ? `<p>${diagnosis.description}</p>` : ''}
      </div>

      <div class="guidelines-tabs">
        <button class="guidelines-tab active" data-tab="overview">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          Overview
        </button>
        <button class="guidelines-tab" data-tab="workup">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M7 2v2h1v14c0 2.21 1.79 4 4 4s4-1.79 4-4V4h1V2H7zm5 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
          </svg>
          Workup
        </button>
        <button class="guidelines-tab" data-tab="management">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M10.5 13H8v-3h2.5V7.5h3V10H16v3h-2.5v2.5h-3V13zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          Management
        </button>
        <button class="guidelines-tab" data-tab="teaching">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          Teaching
        </button>
      </div>

      <div class="guidelines-tab-content">
        <div class="tab-panel active" data-panel="overview">
          ${diagnosis.features ? `
            <div class="guidelines-section">
              <h3>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Clinical Features
              </h3>
              <div class="content-area">
                <ul>
                  ${diagnosis.features.map((/** @type {any} */ f) => `<li>${f}</li>`).join('')}
                </ul>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="tab-panel" data-panel="workup">
          ${diagnosis.workup ? `
            <div class="guidelines-section">
              <h3>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M7 2v2h1v14c0 2.21 1.79 4 4 4s4-1.79 4-4V4h1V2H7zm5 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                </svg>
                Diagnostic Workup
              </h3>
              <div class="content-area">
                <ul>
                  ${diagnosis.workup.map((/** @type {any} */ w) => `<li>${w}</li>`).join('')}
                </ul>
              </div>
            </div>
          ` : '<p>No workup information available.</p>'}
        </div>

        <div class="tab-panel" data-panel="management">
          ${diagnosis.management ? `
            <div class="guidelines-section">
              <h3>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M10.5 13H8v-3h2.5V7.5h3V10H16v3h-2.5v2.5h-3V13zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                Management & Treatment
              </h3>
              <div class="content-area">
                <ul>
                  ${diagnosis.management.map((/** @type {any} */ m) => `<li>${m}</li>`).join('')}
                </ul>
              </div>
            </div>
          ` : '<p>No management information available.</p>'}
        </div>

        <div class="tab-panel" data-panel="teaching">
          ${diagnosis.pearls ? `
            <div class="guidelines-section">
              <h3>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                Clinical Pearls & Teaching Points
              </h3>
              <div class="content-area">
                <ul>
                  ${diagnosis.pearls.map((/** @type {any} */ p) => `<li class="teaching-point">${p}</li>`).join('')}
                </ul>
              </div>
            </div>
          ` : '<p>No teaching points available.</p>'}
          
          ${diagnosis.guidelines ? `
            <div class="guidelines-section">
              <h3>Guidelines & References</h3>
              <div class="content-area">
                ${typeof diagnosis.guidelines === 'string' 
                  ? `<p>${diagnosis.guidelines}</p>` 
                  : diagnosis.guidelines.map((/** @type {any} */ g) => `<p class="guideline-recommendation">${g}</p>`).join('')
                }
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Initialize tab switching
  const tabs = mainContent.querySelectorAll('.guidelines-tab');
  const panels = mainContent.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = /** @type {HTMLElement} */ (tab).dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active panel
      panels.forEach(p => {
        if (/** @type {HTMLElement} */ (p).dataset.panel === targetTab) {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
    });
  });
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
