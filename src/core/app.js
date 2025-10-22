/* eslint-env browser */
// Cardiology Suite Application
console.log("🚀 Initializing Cardiology Suite...");

// Import required modules
import "../utils/debugInstrumentation.js";
import "../utils/parserHelpers.js";
import "../parsers/noteParser.js";
import "../parsers/noteParser_full.js";
import "../parsers/aiAnalyzer.js";
import "../parsers/templateRenderer.js";

// Basic application initialization
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ DOM loaded, initializing app...");

  try {
    // Initialize RAG configuration globals for UI diagnostics
    /** @type {any} */ (window).__AZURE_SEARCH_INDEX = 'cardiology-index';
    /** @type {any} */ (window).__RAG_TOP_K = 5;
    /** @type {any} */ (window).__STRICT_GROUNDING = false; // Set to true if using strict mode
    
    // Load feature flags and show/hide conditional nav items
    loadFeatureFlags();

    // Always wire theme toggle if present
    console.log("Initializing theme...");
    initializeTheme();

    // Detect if this is the main page (presence of .dx-list)
    const isMainPage = !!document.querySelector(".dx-list");
    if (!isMainPage) {
      console.log(
        "ℹ️ Skipping main app init: .dx-list not found (non-main page)",
      );
      return;
    }

    // Initialize basic interactions
    console.log("Initializing interactions...");
    initializeInteractions();

    // Initialize search functionality
    console.log("Initializing search...");
    initializeSearch();

    // Initialize lab values table
    console.log("Initializing lab values...");
    initializeLabValues();

    console.log("✅ Cardiology Suite initialized successfully");

    // Announce AI Search helpers
    console.log(
      "🔎 AI Search helpers ready: checkSearchHealth() and runSearch(query, top)"
    );
  } catch (error) {
    console.error("❌ Error during initialization:", error);
  }
});

/**
 * Load feature flags and conditionally show nav items
 */
function loadFeatureFlags() {
  fetch("./config/features.json")
    .then((r) => r.json())
    .then((features) => {
      // Show/hide medications nav tab based on feature flag
      if (features.meds_feature === true) {
        const medsNavTab = document.getElementById("meds-nav-tab");
        if (medsNavTab) {
          medsNavTab.style.display = "";
          console.log("✅ Medications feature enabled");
        }
      }
    })
    .catch((err) => {
      console.warn("⚠️ Could not load feature flags:", err);
    });
}

/**
 * Initialize theme functionality
 */
function initializeTheme() {
  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("theme-light");
      console.log("Theme toggled");
    });
  }
}

/**
 * ===== AI Search API helpers (console-use) =====
 * These helpers let you quickly verify the AI Search API from the UI context.
 * Usage in devtools console:
 *   checkSearchHealth();
 *   runSearch("heart failure", 3);
 */
function getSearchApiBase() {
  // Prefer Codespaces-port rewrite when applicable
  const origin = window.location.origin;
  if (origin.includes("-8080.app.github.dev")) {
    return origin.replace("-8080.app.github.dev", "-8081.app.github.dev");
  }
  // Fallback to localhost for local dev
  return "http://localhost:8081";
}

async function checkSearchHealth() {
  const base = getSearchApiBase();
  try {
    const r = await fetch(`${base}/health`, { cache: "no-store" });
    const j = await r.json();
    if (j && j.ok) {
      console.log("✅ AI Search /health:", j);
    } else {
      console.warn("⚠️ AI Search /health returned:", j);
    }
    return j;
  } catch (e) {
    console.error("❌ AI Search /health failed:", e);
    throw e;
  }
}

async function runSearch(query = "*", top = 5) {
  const base = getSearchApiBase();
  try {
    const r = await fetch(`${base}/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, top }),
    });
    const j = await r.json();
    if (r.ok) {
      console.log(`🔍 AI Search results for "${query}":`, j);
    } else {
      console.warn("⚠️ AI Search /search error:", j);
    }
    return j;
  } catch (e) {
    console.error("❌ AI Search /search failed:", e);
    throw e;
  }
}

// Expose to window for quick console access
window.checkSearchHealth = checkSearchHealth;
window.runSearch = runSearch;

// ================= Dev Panel (non-intrusive) =================
(function mountAISearchDevPanel() {
  // Show panel only in dev contexts (Codespaces or localhost)
  const isDevHost = /localhost|github\.dev/.test(window.location.host);
  if (!isDevHost) return;

  const panel = document.createElement("div");
  panel.setAttribute("id", "ai-search-dev-panel");
  panel.setAttribute(
    "style",
    [
      "position:fixed",
      "right:12px",
      "bottom:12px",
      "z-index:9999",
      "max-width:380px",
      "background:#111",
      "color:#eee",
      "border:1px solid #555",
      "border-radius:8px",
      "box-shadow:0 6px 24px rgba(0,0,0,0.35)",
      "font:13px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    ].join(";"),
  );

  const apiBase = getSearchApiBase();
  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid #444">
      <strong style="flex:1">AI Search</strong>
      <button id="ai-search-close" title="Hide panel" style="cursor:pointer;background:#222;color:#ddd;border:1px solid #555;border-radius:4px;padding:4px 8px">×</button>
    </div>
    <div style="padding:10px">
      <div style="margin-bottom:6px;color:#bbb">Base: <code style="color:#8fd">${apiBase}</code></div>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input id="ai-q" value="heart failure" placeholder="query" style="flex:1;background:#181818;color:#eee;border:1px solid #444;border-radius:4px;padding:6px 8px" />
        <input id="ai-top" type="number" min="1" max="50" value="5" title="top" style="width:72px;background:#181818;color:#eee;border:1px solid #444;border-radius:4px;padding:6px 8px" />
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <button id="ai-btn-health" style="flex:0 0 auto;background:#2c7;border:1px solid #185;padding:6px 10px;border-radius:4px;color:#041">Health</button>
        <button id="ai-btn-search" style="flex:1;background:#39f;border:1px solid #158;padding:6px 10px;border-radius:4px;color:#002">Search</button>
      </div>
      <pre id="ai-out" style="margin:0;max-height:220px;overflow:auto;background:#0a0a0a;border:1px solid #333;border-radius:6px;padding:8px;color:#cfc">(output)</pre>
    </div>
  `;

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(panel);
    const $ = (id) => panel.querySelector(id);
    $("#ai-search-close").addEventListener("click", () => panel.remove());
    $("#ai-btn-health").addEventListener("click", async () => {
      const out = $("#ai-out");
      out.textContent = "Checking /health...";
      try {
        const j = await checkSearchHealth();
        out.textContent = JSON.stringify(j, null, 2);
      } catch (e) {
        out.textContent = String(e);
      }
    });
    $("#ai-btn-search").addEventListener("click", async () => {
      const out = $("#ai-out");
      const q = $("#ai-q").value || "*";
      const top = Number($("#ai-top").value || 5);
      out.textContent = `Searching for "${q}"...`;
      try {
        const j = await runSearch(q, top);
        out.textContent = JSON.stringify(j, null, 2);
      } catch (e) {
        out.textContent = String(e);
      }
    });
  });
})();

/**
 * Initialize basic interactions
 */
function initializeInteractions() {
  // FAB functionality
  const fabMain = document.getElementById("fab-main");
  const fabActions = document.getElementById("fab-actions");

  if (fabMain && fabActions) {
    fabMain.addEventListener("click", () => {
      fabActions.classList.toggle("active");
      console.log("FAB toggled");
    });
  }

  // Navigation breadcrumbs
  const breadcrumbItems = document.querySelectorAll(".breadcrumb-item");
  breadcrumbItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      const section = e.currentTarget.dataset.section;
      console.log("Navigation clicked:", section);
    });
  });
}

/**
 * Initialize search functionality and populate diagnoses
 */
function initializeSearch() {
  const searchInput = document.getElementById("search");
  const searchClear = document.querySelector(".search-clear");

  // Populate diagnoses list
  populateDiagnoses();

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value;
      if (query.length > 0) {
        if (searchClear) searchClear.style.display = "block";
        filterDiagnoses(query);
        console.log("Search query:", query);
      } else {
        if (searchClear) searchClear.style.display = "none";
        showAllDiagnoses();
      }
    });
  }

  if (searchClear) {
    searchClear.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        searchClear.style.display = "none";
        showAllDiagnoses();
      }
    });
  }
}

/**
 * Complete diagnoses array - All 80 diagnoses from database (sorted A→Z)
 * Unified on window.DIAGNOSES to avoid duplicate declarations across pages.
 */
if (!window.DIAGNOSES) {
  window.DIAGNOSES = [
    { id: "aaa", name: "Abdominal Aortic Aneurysm (AAA)" },
    { id: "acs", name: "Acute Coronary Syndrome (UA/NSTEMI/STEMI)" },
    { id: "acute_limb_ischemia", name: "Acute Limb Ischemia (ALI)" },
    {
      id: "acute_mesenteric_ischemia",
      name: "Acute Mesenteric Ischemia (AMI)",
    },
    { id: "pericarditis", name: "Acute Pericarditis" },
    { id: "angina", name: "Angina" },
    { id: "aortic_dissection", name: "Aortic Dissection" },
    { id: "ar", name: "Aortic Regurgitation" },
    { id: "as", name: "Aortic Stenosis" },
    { id: "afib", name: "Atrial Fibrillation / Flutter" },
    { id: "atrial_flutter", name: "Atrial Flutter" },
    { id: "asd", name: "Atrial Septal Defect (ASD)" },
    {
      id: "bradyarrhythmia",
      name: "Bradyarrhythmias (Sinus Node Dysfunction & AV Block)",
    },
    { id: "cardiac_arrest", name: "Cardiac Arrest / Sudden Cardiac Death" },
    { id: "cardiogenic_shock", name: "Cardiogenic Shock" },
    { id: "cvi", name: "Chronic Venous Insufficiency / Varicose Veins" },
    { id: "coarctation_aorta", name: "Coarctation of the Aorta" },
    { id: "cardiac_medications", name: "Common Cardiac Medications & Dosages" },
    { id: "chf", name: "Congestive Heart Failure (CHF)" },
    { id: "constrictive_pericarditis", name: "Constrictive Pericarditis" },
    { id: "dvt", name: "Deep Vein Thrombosis (DVT)" },
    { id: "dcm", name: "Dilated Cardiomyopathy (DCM)" },
    { id: "distributive_shock", name: "Distributive Shock" },
    { id: "ep_guidelines", name: "Electrophysiology (EP) Guidelines" },
    { id: "documentation_guidelines", name: "H&P and Consult Note Guidelines" },
    { id: "hfpef", name: "Heart Failure with Preserved EF (HFpEF)" },
    { id: "hfref", name: "Heart Failure with Reduced EF (HFrEF)" },
    { id: "htn", name: "Hypertension (HTN)" },
    { id: "htn_emergency", name: "Hypertensive Emergency" },
    { id: "htn_urgency", name: "Hypertensive Urgency / Emergency" },
    { id: "hcm", name: "Hypertrophic Cardiomyopathy (HCM)" },
    { id: "hypovolemic_shock", name: "Hypovolemic Shock" },
    { id: "infective_endocarditis", name: "Infective Endocarditis" },
    { id: "lbbb", name: "Left Bundle Branch Block (LBBB)" },
    { id: "long_qt", name: "Long QT Syndrome (LQTS)" },
    { id: "mitraclip_postop", name: "MitraClip (Post-Operative Care by NP)" },
    { id: "mr", name: "Mitral Regurgitation" },
    { id: "ms", name: "Mitral Stenosis" },
    { id: "mvp", name: "Mitral Valve Prolapse" },
    { id: "myocarditis", name: "Myocarditis" },
    { id: "obstructive_shock", name: "Obstructive Shock" },
    { id: "orthostatic_hypotension", name: "Orthostatic Hypotension" },
    { id: "psvt", name: "Paroxysmal Supraventricular Tachycardia (PSVT)" },
    { id: "pda", name: "Patent Ductus Arteriosus (PDA)" },
    { id: "pericardial_effusion", name: "Pericardial Effusion / Tamponade" },
    {
      id: "perioperative_medication_management",
      name: "Perioperative Medication Management",
    },
    { id: "pad", name: "Peripheral Arterial Disease (PAD)" },
    { id: "pheochromocytoma", name: "Pheochromocytoma / Paraganglioma" },
    { id: "pac", name: "Premature Atrial Contraction (PAC)" },
    { id: "pvc", name: "Premature Ventricular Contraction (PVC)" },
    { id: "primary_aldosteronism", name: "Primary Aldosteronism" },
    { id: "pe", name: "Pulmonary Embolism (PE)" },
    { id: "pulmonary_htn", name: "Pulmonary Hypertension" },
    { id: "pr", name: "Pulmonic Regurgitation" },
    { id: "ps", name: "Pulmonic Stenosis" },
    { id: "pulm_valve", name: "Pulmonic Valve Disease" },
    { id: "renal_artery_stenosis", name: "Renal Artery Stenosis (RAS)" },
    { id: "rcm", name: "Restrictive Cardiomyopathy (RCM)" },
    { id: "rheumatic_hd", name: "Rheumatic Heart Disease" },
    { id: "rbbb", name: "Right Bundle Branch Block (RBBB)" },
    { id: "shock", name: "Shock - Comprehensive Guide" },
    { id: "sss", name: "Sick Sinus Syndrome (SSS)" },
    { id: "svt", name: "Supraventricular Tachycardia (SVT)" },
    {
      id: "surgical_risk_stratification",
      name: "Surgical Risk Stratification",
    },
    { id: "syncope", name: "Syncope" },
    { id: "takotsubo", name: "Takotsubo (Stress) Cardiomyopathy" },
    { id: "tof", name: "Tetralogy of Fallot (TOF)" },
    { id: "torsades", name: "Torsades de Pointes" },
    {
      id: "transposition_great_vessels",
      name: "Transposition of the Great Vessels (TGA)",
    },
    { id: "tr", name: "Tricuspid Regurgitation" },
    { id: "ts", name: "Tricuspid Stenosis" },
    { id: "truncus_arteriosus", name: "Truncus Arteriosus (TA)" },
    { id: "vfib", name: "Ventricular Fibrillation (VF)" },
    { id: "vsd", name: "Ventricular Septal Defect (VSD)" },
    { id: "vt", name: "Ventricular Tachycardia (VT)" },
    { id: "watchman_postop", name: "Watchman (Post-Operative Care by NP)" },
    { id: "wpw", name: "Wolff-Parkinson-White Syndrome (WPW)" },
  ];
}

var DIAGNOSES = window.DIAGNOSES;

/**
 * Populate the diagnoses list with simple items
 */
function populateDiagnoses() {
  console.log("🔄 Populating diagnoses...");
  const dxList = document.querySelector(".dx-list");
  if (!dxList) {
    console.error("❌ .dx-list element not found!");
    return;
  }

  console.log(`📝 Found ${DIAGNOSES.length} diagnoses to populate`);
  dxList.innerHTML = "";

  DIAGNOSES.forEach((diagnosis) => {
    const item = document.createElement("div");
    item.className = "dx-item";
    item.dataset.diagnosis = diagnosis.id;
    item.textContent = diagnosis.name;

    item.addEventListener("click", () => {
      console.log("Selected diagnosis:", diagnosis.name);
      setActiveDiagnosis(diagnosis);
    });

    dxList.appendChild(item);
  });

  console.log(`✅ Successfully populated ${DIAGNOSES.length} diagnoses`);
}

/**
 * Filter diagnoses based on search query
 */
function filterDiagnoses(query) {
  const items = document.querySelectorAll(".dx-item");
  const lowerQuery = query.toLowerCase();

  items.forEach((item) => {
    const title = item.textContent.toLowerCase();
    if (title.includes(lowerQuery)) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

/**
 * Show all diagnoses
 */
function showAllDiagnoses() {
  const items = document.querySelectorAll(".dx-item");
  items.forEach((item) => {
    item.style.display = "block";
  });
}

/**
 * Set active diagnosis and update UI
 */
// Load comprehensive diagnosis data
let diagnosisDatabase = null;

async function loadDiagnosisData() {
  if (diagnosisDatabase) return diagnosisDatabase;

  try {
    const response = await fetch("./data/cardiology_diagnoses/cardiology.json");
    if (!response.ok) {
      throw new Error(`Failed to load diagnosis data: ${response.status}`);
    }
    diagnosisDatabase = await response.json();
    console.log(
      "✅ Loaded diagnosis database with",
      diagnosisDatabase.diagnoses.length,
      "diagnoses",
    );
    return diagnosisDatabase;
  } catch (error) {
    console.error("❌ Error loading diagnosis data:", error);
    return null;
  }
}

async function setActiveDiagnosis(diagnosis) {
  // Remove active class from all items
  document.querySelectorAll(".dx-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Add active class to selected item
  const selectedItem = document.querySelector(
    `[data-diagnosis="${diagnosis.id}"]`,
  );
  if (selectedItem) {
    selectedItem.classList.add("active");
  }

  // Update breadcrumb
  const currentDxBreadcrumb = document.getElementById("current-dx-breadcrumb");
  const currentDxName = document.getElementById("current-dx-name");

  if (currentDxBreadcrumb && currentDxName) {
    currentDxName.textContent = diagnosis.name;
    currentDxBreadcrumb.style.display = "flex";
  }

  // Update main content area with comprehensive data
  const dxDetail = document.getElementById("dx-detail");
  if (!dxDetail) {
    console.error("dx-detail panel not found");
    return;
  }

  // Show the panel when diagnosis is selected
  dxDetail.classList.add("active");

  // Show loading state
  dxDetail.innerHTML = `
    <div class="panel-h">
      <h3>${diagnosis.name}</h3>
    </div>
    <div class="panel-content">
      <div class="loading">Loading comprehensive diagnosis information...</div>
    </div>
  `;
  dxDetail.style.display = "block";

  // Load comprehensive diagnosis data
  const database = await loadDiagnosisData();
  if (!database) {
    dxDetail.innerHTML = `
      <div class="panel-h">
        <h3>${diagnosis.name}</h3>
      </div>
      <div class="panel-content">
        <div class="error">Error loading diagnosis data</div>
      </div>
    `;
    return;
  }

  // Find the detailed diagnosis data (IDs now match database exactly)
  let detailedDiagnosis = database.diagnoses.find((d) => d.id === diagnosis.id);

  // If not found by exact ID, try partial name matching as fallback
  if (!detailedDiagnosis) {
    detailedDiagnosis = database.diagnoses.find(
      (d) =>
        d.name && d.name.toLowerCase().includes(diagnosis.name.toLowerCase()),
    );
  }

  if (!detailedDiagnosis) {
    // Create basic diagnosis info with automatic scrolling
    dxDetail.innerHTML = `
      <div class="panel-h">
        <h3>${diagnosis.name}</h3>
      </div>
      <div class="panel-content">
        <div class="basic-diagnosis-info">
          <p><strong>Diagnosis:</strong> ${diagnosis.name}</p>
          <p><em>Loading comprehensive clinical information...</em></p>
          <div class="diagnosis-placeholder">
            <h4>Clinical Overview</h4>
            <p>This section will display detailed clinical information, diagnostic criteria, and management guidelines for ${diagnosis.name}.</p>
            <h4>Key Points</h4>
            <ul>
              <li>Comprehensive diagnostic workup</li>
              <li>Treatment protocols and guidelines</li>
              <li>Risk stratification and prognosis</li>
              <li>Follow-up recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    // Automatically scroll to the diagnosis detail panel
    setTimeout(() => {
      dxDetail.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 100);

    return;
  }

  // Create comprehensive diagnosis display
  const content = `
    <div class="panel-h">
      <h3>${detailedDiagnosis.name}</h3>
      ${detailedDiagnosis.description ? `<p class="diagnosis-description">${detailedDiagnosis.description}</p>` : ""}
    </div>
    <div class="panel-content">
      ${
        detailedDiagnosis.features
          ? `
      <div class="diagnosis-section">
        <h4>Clinical Features</h4>
        <ul class="feature-list">
          ${detailedDiagnosis.features.map((feature) => `<li>${feature}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }

      ${
        detailedDiagnosis.workup
          ? `
      <div class="diagnosis-section">
        <h4>Diagnostic Workup</h4>
        <ul class="workup-list">
          ${detailedDiagnosis.workup.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }

      ${
        detailedDiagnosis.management
          ? `
      <div class="diagnosis-section">
        <h4>Management & Treatment</h4>
        <ul class="management-list">
          ${detailedDiagnosis.management.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }

      ${
        detailedDiagnosis.pearls
          ? `
      <div class="diagnosis-section">
        <h4>Clinical Pearls</h4>
        <ul class="pearls-list">
          ${detailedDiagnosis.pearls.map((pearl) => `<li>${pearl}</li>`).join("")}
        </ul>
      </div>
      `
          : ""
      }

      ${
        detailedDiagnosis.guidelines
          ? `
      <div class="diagnosis-section">
        <h4>Guidelines</h4>
        <div class="guidelines-content">
          ${
            typeof detailedDiagnosis.guidelines === "string"
              ? `<p>${detailedDiagnosis.guidelines}</p>`
              : detailedDiagnosis.guidelines
                  .map((guideline) => `<p>${guideline}</p>`)
                  .join("")
          }
        </div>
      </div>
      `
          : ""
      }

      ${
        detailedDiagnosis.pdfs
          ? `
      <div class="diagnosis-section">
        <h4>Reference Materials</h4>
        <div class="reference-materials">
          ${detailedDiagnosis.pdfs
            .map(
              (pdf) => `
            <div class="pdf-resource">
              <h5>${pdf.title}</h5>
              <p class="pdf-description">${pdf.description}</p>
              <a href="${pdf.path}" target="_blank" class="pdf-link">
                📄 View PDF Resource
              </a>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
      `
          : ""
      }
    </div>
  `;

  dxDetail.innerHTML = content;

  // Automatically scroll to the diagnosis detail panel
  setTimeout(() => {
    dxDetail.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }, 100);

  console.log("Displayed comprehensive diagnosis:", detailedDiagnosis.name);
}

/**
 * Initialize lab values table with reference ranges
 */
async function initializeLabValues() {
  try {
    const response = await fetch("./data/labs_reference/labs_reference.json");
    const labData = await response.json();

    const tbody = document.getElementById("tbl-labs");
    if (!tbody) return;

    // Clear existing content
    tbody.innerHTML = "";

    // Get the most clinically relevant labs for cardiology
    const cardiologyLabs = [
      "hs_troponin",
      "bnp",
      "ntprobnp",
      "creatinine",
      "sodium",
      "potassium",
      "hemoglobin",
      "hematocrit",
      "glucose",
      "total_chol",
      "ldl",
      "hdl_men",
      "triglycerides",
      "hba1c",
      "inr",
      "pt",
      "crp",
      "tsh",
    ];

    // Populate table with reference ranges
    cardiologyLabs.forEach((labKey) => {
      const lab = labData.ranges[labKey];
      if (lab) {
        const row = document.createElement("tr");
        row.dataset.labKey = labKey;
        row.dataset.labAliases = lab.aliases.join("|");

        // Format lab name
        const labName =
          lab.aliases[0].charAt(0).toUpperCase() + lab.aliases[0].slice(1);

        // Format reference range
        const refRange = `${lab.low}-${lab.high}${lab.units ? " " + lab.units : ""}`;

        row.innerHTML = `
          <td title="${lab.note || ""}">${labName}</td>
          <td class="lab-value lab-value-empty">-</td>
          <td>${refRange}</td>
        `;

        tbody.appendChild(row);
      }
    });

    console.log("✅ Lab values table populated with reference ranges");
  } catch (error) {
    console.error("Failed to load lab reference data:", error);

    // Fallback: populate with common values
    const tbody = document.getElementById("tbl-labs");
    if (tbody) {
      tbody.innerHTML = `
        <tr><td>Troponin</td><td>—</td><td>0-14 ng/L</td></tr>
        <tr><td>BNP</td><td>—</td><td>0-100 pg/mL</td></tr>
        <tr><td>Creatinine</td><td>—</td><td>0.6-1.3 mg/dL</td></tr>
        <tr><td>Sodium</td><td>—</td><td>135-145 mEq/L</td></tr>
        <tr><td>Potassium</td><td>—</td><td>3.5-5.0 mEq/L</td></tr>
        <tr><td>Hemoglobin</td><td>—</td><td>12.0-17.5 g/dL</td></tr>
        <tr><td>Glucose</td><td>—</td><td>70-99 mg/dL</td></tr>
        <tr><td>Total Chol</td><td>—</td><td>0-200 mg/dL</td></tr>
        <tr><td>LDL</td><td>—</td><td>0-100 mg/dL</td></tr>
        <tr><td>INR</td><td>—</td><td>0.8-1.2</td></tr>
      `;
    }
  }
}

// ===== SPA Router for #/meds and #/guidelines (lazy-loaded pages) =====
(() => {
  if (window.__spaRouterInit) return;
  window.__spaRouterInit = true;

  let medsModule = null;
  let guidelinesModule = null;

  function getMainContainers() {
    const ids = ["layout", "main", "app"];
    return ids.map((id) => document.getElementById(id)).filter(Boolean);
  }

  function ensureMedsContainer() {
    let el = document.getElementById("meds-container");
    if (!el) {
      el = document.createElement("main");
      el.id = "meds-container";
      el.className = "spa-route-container";
      el.style.display = "none";
      const banner = document.getElementById("banner");
      if (banner && banner.parentElement) {
        banner.parentElement.insertBefore(el, banner.nextSibling);
      } else {
        document.body.appendChild(el);
      }
    }
    return el;
  }

  function ensureGuidelinesContainer() {
    let el = document.getElementById("guidelines-container");
    if (!el) {
      el = document.createElement("main");
      el.id = "guidelines-container";
      el.className = "spa-route-container";
      el.style.display = "none";
      const banner = document.getElementById("banner");
      if (banner && banner.parentElement) {
        banner.parentElement.insertBefore(el, banner.nextSibling);
      } else {
        document.body.appendChild(el);
      }
    }
    return el;
  }

  function show404() {
    const hash = location.hash;
    console.warn(`⚠️ Unknown route: ${hash}`);
    // Fallback to home
    location.hash = "";
  }

  async function handleRoute() {
    const hash = (location.hash || "").replace(/^#\/?/, "");
    const isMeds = hash.startsWith("meds");
    const isGuidelines = hash.startsWith("guidelines");
    const medsRoot = ensureMedsContainer();
    const guidelinesRoot = ensureGuidelinesContainer();
    const mains = getMainContainers();

    // Update active nav tab
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active");
      const page = tab.dataset.page;
      if (
        (hash === "" && page === "main") ||
        (isMeds && page === "meds") ||
        (isGuidelines && page === "guidelines")
      ) {
        tab.classList.add("active");
      }
    });

    if (isMeds) {
      // Hide everything else
      mains.forEach((m) => (m.style.display = "none"));
      guidelinesRoot.style.display = "none";
      medsRoot.style.display = "";

      // Unmount guidelines
      if (
        guidelinesModule &&
        typeof guidelinesModule.unmountGuidelines === "function"
      ) {
        try {
          guidelinesModule.unmountGuidelines(guidelinesRoot);
        } catch (error) {
          console.warn("Error unmounting guidelines:", error);
        }
      }

      // Load and mount meds
      if (!medsModule) {
        medsModule = await import("/pages/meds.js").catch((e) => {
          console.error("Failed to load Meds module:", e);
          return null;
        });
      }
      if (medsModule && typeof medsModule.mountMeds === "function") {
        await medsModule.mountMeds(medsRoot);
      }
    } else if (isGuidelines) {
      // Hide everything else
      mains.forEach((m) => (m.style.display = "none"));
      medsRoot.style.display = "none";
      guidelinesRoot.style.display = "";

      // Unmount meds
      if (medsModule && typeof medsModule.unmountMeds === "function") {
        try {
          medsModule.unmountMeds(medsRoot);
        } catch (error) {
          console.warn("Error unmounting meds:", error);
        }
      }

      // Load and mount guidelines
      if (!guidelinesModule) {
        guidelinesModule = await import("/pages/guidelines.js").catch((e) => {
          console.error("Failed to load Guidelines module:", e);
          return null;
        });
      }
      if (
        guidelinesModule &&
        typeof guidelinesModule.mountGuidelines === "function"
      ) {
        await guidelinesModule.mountGuidelines(guidelinesRoot);
      }
    } else if (hash && hash !== "") {
      // Unknown route - show 404 and redirect home
      show404();
    } else {
      // Home route - unmount both
      if (medsModule && typeof medsModule.unmountMeds === "function") {
        try {
          medsModule.unmountMeds(medsRoot);
        } catch (error) {
          console.warn("Error unmounting meds:", error);
        }
      }
      if (
        guidelinesModule &&
        typeof guidelinesModule.unmountGuidelines === "function"
      ) {
        try {
          guidelinesModule.unmountGuidelines(guidelinesRoot);
          } catch {
            // Ignore unmount errors
          }
      }
      medsRoot.style.display = "none";
      guidelinesRoot.style.display = "none";
      mains.forEach((m) => (m.style.display = ""));
    }
  }

  window.addEventListener("hashchange", handleRoute);
  window.addEventListener("DOMContentLoaded", handleRoute);
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    handleRoute();
  }

  console.log("✅ SPA router initialized (#/meds, #/guidelines, 404 fallback)");
})();
