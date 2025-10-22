/**
 * Medications Page Module
 * Lazy-loaded page for cardiac medications reference
 * 
 * ⚠️ LAYOUT LOCKED - DO NOT MODIFY STRUCTURE ⚠️
 * Last modified: 2025-10-22
 * This module renders a medications page with:
 * - Search and filter controls
 * - Grid layout of medication cards
 * - Detailed dosing and clinical information
 * 
 * @module pages/meds
 */

/* global fetch, console */

let medsData = null;

/**
 * Load medications data from JSON
 * @returns {Promise<Object>}
 */
async function loadMedicationsData() {
  if (medsData) return medsData;

  try {
    const response = await fetch("./data/meds/cardiac_meds.json");
    if (!response.ok) {
      throw new Error(`Failed to load medications: ${response.status}`);
    }
    medsData = await response.json();
    console.log(
      "✅ Loaded",
      medsData.medications.length,
      "cardiac medications",
    );
    return medsData;
  } catch (error) {
    console.error("❌ Error loading medications:", error);
    return { medications: [] };
  }
}

/**
 * Render a single medication card
 * @param {Object} med - Medication object
 * @returns {string} HTML string
 */
function renderMedicationCard(med) {
  let html = `<div class="med-card" data-class="${med.class}">`;
  html += `<h3 class="med-name">${med.name}</h3>`;
  html += `<div class="med-class">${med.class}</div>`;

  // Inpatient dosing
  if (med.inpatient) {
    html += `<div class="med-section">`;
    html += `<h4>Inpatient Dosing</h4>`;
    if (med.inpatient.load)
      html += `<p><strong>Loading:</strong> ${med.inpatient.load}</p>`;
    if (med.inpatient.maint)
      html += `<p><strong>Maintenance:</strong> ${med.inpatient.maint}</p>`;
    if (med.inpatient.prn)
      html += `<p><strong>PRN:</strong> ${med.inpatient.prn}</p>`;
    html += `</div>`;
  }

  // Outpatient dosing
  if (med.outpatient) {
    html += `<div class="med-section">`;
    html += `<h4>Outpatient Dosing</h4>`;
    if (med.outpatient.maint)
      html += `<p><strong>Maintenance:</strong> ${med.outpatient.maint}</p>`;
    if (med.outpatient.titration)
      html += `<p><strong>Titration:</strong> ${med.outpatient.titration}</p>`;
    html += `</div>`;
  }

  // Contraindications
  if (med.avoid && med.avoid.length > 0) {
    html += `<div class="med-section med-warnings">`;
    html += `<h4>⚠️ Contraindications/Cautions</h4><ul>`;
    med.avoid.forEach((item) => {
      html += `<li>${item}</li>`;
    });
    html += `</ul></div>`;
  }

  // Clinical Pearls
  if (med.pearls && med.pearls.length > 0) {
    html += `<div class="med-section med-pearls">`;
    html += `<h4>💡 Clinical Pearls</h4><ul>`;
    med.pearls.forEach((pearl) => {
      html += `<li>${pearl}</li>`;
    });
    html += `</ul></div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Initialize search functionality
 * @param {HTMLElement} rootEl - Root container
 */
function initializeSearch(rootEl) {
  const searchInput = rootEl.querySelector("#med-search");
  const filterSelect = rootEl.querySelector("#med-filter");
  const cards = rootEl.querySelectorAll(".med-card");

  function filterCards() {
    const searchTerm = searchInput.value.toLowerCase();
    const classFilter = filterSelect.value;

    cards.forEach((card) => {
      const medName = card.querySelector(".med-name").textContent.toLowerCase();
      const medClass = card.dataset.class;

      const matchesSearch = medName.includes(searchTerm);
      const matchesClass = !classFilter || medClass === classFilter;

      card.style.display = matchesSearch && matchesClass ? "block" : "none";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterCards);
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", filterCards);
  }
}

/**
 * Mount medications page
 * @param {HTMLElement} rootEl - Root element to mount into
 * @returns {Promise<void>}
 */
export async function mountMeds(rootEl) {
  console.log("🏥 Mounting Medications page...");

  if (!rootEl) {
    console.error("❌ No root element provided to mountMeds");
    return;
  }

  // Load medications data
  const data = await loadMedicationsData();

  // Get unique medication classes for filter
  const classes = [...new Set(data.medications.map((m) => m.class))].sort();

  // Render page HTML
  let html = `<section class="meds-page">`;
  html += `<div class="meds-header">`;
  html += `<h1>💊 Cardiac Medications Reference</h1>`;
  html += `<p>Evidence-based dosing and clinical pearls for common cardiac medications</p>`;
  html += `</div>`;

  // Search and filter controls
  html += `<div class="meds-controls">`;
  html += `<input type="text" id="med-search" placeholder="Search medications..." class="med-search-input">`;
  html += `<select id="med-filter" class="med-filter-select">`;
  html += `<option value="">All Classes</option>`;
  classes.forEach((cls) => {
    html += `<option value="${cls}">${cls}</option>`;
  });
  html += `</select>`;
  html += `</div>`;

  // Medication cards
  html += `<div class="meds-grid">`;
  data.medications.forEach((med) => {
    html += renderMedicationCard(med);
  });
  html += `</div>`;

  html += `</section>`;

  // Mount to DOM
  rootEl.innerHTML = html;

  // Initialize interactivity
  initializeSearch(rootEl);

  console.log("✅ Medications page mounted");
}

/**
 * Unmount medications page
 * @param {HTMLElement} rootEl - Root element
 */
export function unmountMeds(rootEl) {
  if (rootEl) {
    rootEl.innerHTML = "";
  }
  console.log("🏥 Medications page unmounted");
}
