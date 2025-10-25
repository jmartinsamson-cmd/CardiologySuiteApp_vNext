/* eslint-env browser */
// Cardiology Suite Application
import { debugLog, debugWarn, debugError } from "../utils/logger.js";
debugLog("🚀 Initializing Cardiology Suite...");

// Import configuration and utilities
import { config } from "../../config/environment.js";
import { fetchJSON } from "../utils/network.js";
import { addListener } from "../utils/eventManager.js";

// Import required modules
import "../utils/debugInstrumentation.js";
import "../utils/parserHelpers.js";
import "../parsers/noteParser.js";
import "../parsers/noteParser_full.js";
import "../parsers/aiAnalyzer.js";
import "../parsers/templateRenderer.js";
// Import training examples and hinted parser for user-trainable parsing
import "../parsers/parserTrainingExamples.js";
import "../parsers/hintedParser.js";
// Import evidence-based plan generator bridge
import "../parsers/evidenceBasedPlanBridge.js";

/**
 * @typedef {{ id: string; name: string }} DiagnosisSummary
 */

/**
 * @typedef {{
 *   id?: string;
 *   name?: string;
 *   title?: string;
 *   description?: string;
 *   features?: string[];
 *   workup?: string[];
 *   management?: string[];
 *   pearls?: string[];
 *   guidelines?: string | string[];
 *   pdfs?: Array<{ title: string; description?: string; path: string }>;
 * }} DiagnosisDetail
 */

/**
 * @typedef {{ diagnoses?: DiagnosisDetail[] }} DiagnosisDatabase
 */

/**
 * @typedef {{
 *   mountMeds?: (root: HTMLElement) => Promise<void> | void;
 *   unmountMeds?: (root: HTMLElement) => void;
 * }} MedsModule
 */

/**
 * @typedef {{
 *   mountGuidelines?: (root: HTMLElement) => Promise<void> | void;
 *   unmountGuidelines?: (root: HTMLElement) => void;
 * }} GuidelinesModule
 */

const appGlobals = /**
 * @type {Window & typeof globalThis & {
 *   DIAGNOSES?: DiagnosisSummary[];
 *   __spaRouterInit?: boolean;
 * }}
 */ (globalThis);

const STATIC_ASSETS = {
  features: new URL("../../config/features.json?url", import.meta.url).href,
  diagnoses: new URL("../../data/cardiology_diagnoses/cardiology.json?url", import.meta.url).href,
  labs: new URL("../../data/labs_reference/labs_reference.json?url", import.meta.url).href,
};

// Basic application initialization
console.log("⏰ Registering DOMContentLoaded listener...");
console.log("⏰ document.readyState =", document.readyState);

// If DOM is already loaded, run immediately
if (document.readyState === 'loading') {
  console.log("⏰ DOM still loading, adding event listener");
  addListener(document, "DOMContentLoaded", initializeApp);
} else {
  console.log("⏰ DOM already loaded! Running initialization immediately");
  initializeApp();
}

async function initializeApp() {
  console.log("🚀🚀🚀 INITIALIZING APP NOW");
  console.log("📍 Current URL:", globalThis.location.href);
  console.log("📍 Current hash:", globalThis.location.hash);
  debugLog("✅ DOM loaded, initializing app...");
  
  // Add visible status indicator
  const statusDiv = document.createElement('div');
  statusDiv.id = 'init-status';
  statusDiv.style.cssText = 'position:fixed;top:60px;right:10px;background:#0a0;color:#fff;padding:8px;z-index:9999;font-family:monospace;font-size:11px;border-radius:4px;max-width:300px;';
  statusDiv.textContent = '✅ app.js loaded';
  document.body.appendChild(statusDiv);
  
  const updateStatus = (/** @type {string} */ msg) => {
    console.log('STATUS:', msg);
    statusDiv.textContent = msg;
  };

  try {
    // Initialize RAG configuration globals for UI diagnostics
    const globalDebug = /** @type {{ [key: string]: unknown }} */ (globalThis);
    globalDebug.__AZURE_SEARCH_INDEX = "cardiology-index";
    globalDebug.__RAG_TOP_K = 5;
    globalDebug.__STRICT_GROUNDING = false; // Set to true if using strict mode
    
    // Load feature flags and show/hide conditional nav items
    updateStatus('📋 Loading feature flags...');
    console.log("📋 Loading feature flags...");
    loadFeatureFlags();

    // Always wire theme toggle if present
    updateStatus('🎨 Initializing theme...');
    console.log("Initializing theme...");
    initializeTheme();

    // Detect if this is the main page (presence of .dx-list)
    updateStatus('🔍 Checking page type...');
    const isMainPage = !!document.querySelector(".dx-list");
    if (!isMainPage) {
      updateStatus('ℹ️ Not main page - skipping init');
      console.log(
        "ℹ️ Skipping main app init: .dx-list not found (non-main page)",
      );
      return;
    }

    // Initialize basic interactions
    updateStatus('⚙️ Initializing interactions...');
    console.log("Initializing interactions...");
    initializeInteractions();

    // Initialize search functionality
  updateStatus('🔎 Initializing search...');
  console.log("🚀 BEFORE initializeSearch call");
  try {
    await initializeSearch();
    console.log("✅ AFTER initializeSearch completed successfully");
  } catch (e) {
    console.error("❌ initializeSearch THREW ERROR:", e);
    throw e;
  }

    // Initialize lab values table
    updateStatus('🧪 Initializing lab values...');
    console.log("Initializing lab values...");
    initializeLabValues();

    updateStatus('✅ Initialization complete!');
    console.log("✅ Cardiology Suite initialized successfully");
    
    setTimeout(() => statusDiv.remove(), 3000);

    // Announce AI Search helpers
    console.log(
      "🔎 AI Search helpers ready: checkSearchHealth() and runSearch(query, top)"
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    updateStatus(`❌ ERROR: ${errorMsg}`);
    statusDiv.style.background = '#f00';
    console.error("❌ Error during initialization:", error);
    
    // Show error in diagnoses sidebar too
    const dxList = document.querySelector(".dx-list");
    if (dxList) {
      dxList.innerHTML = `<div class="dx-empty" style="color: red;">
        ❌ Initialization Error<br>
        <small>${errorMsg}</small><br>
        <small>Check status indicator (top-right)</small>
      </div>`;
    }
  }
}

/**
 * Load feature flags and conditionally show nav items
 */
function loadFeatureFlags() {
  fetch(STATIC_ASSETS.features)
    .then((r) => r.json())
    .then((features) => {
      // Show/hide medications nav tab based on feature flag
      if (features.meds_feature === true) {
        const medsNavTab = document.getElementById("meds-nav-tab");
        if (medsNavTab) {
          medsNavTab.classList.remove("hidden"); // Remove the hidden class
          debugLog("✅ Medications feature enabled");
        }
      }
    })
    .catch((err) => {
      debugWarn("⚠️ Could not load feature flags:", err);
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
  const origin = globalThis.location.origin;
  if (origin.includes("-8080.app.github.dev")) {
    return origin.replace("-8080.app.github.dev", "-8081.app.github.dev");
  }
  // Use environment config instead of hardcoded localhost
  return config.aiSearchBase;
}

async function checkSearchHealth() {
  const base = getSearchApiBase();
  try {
    const data = /** @type {{ ok?: boolean }} */ (
      await fetchJSON(`${base}/health`, { cache: "no-store" })
    );
    if (data && data.ok) {
      debugLog("✅ AI Search /health:", data);
    } else {
      debugWarn("⚠️ AI Search /health returned:", data);
    }
    return data;
  } catch (error) {
    debugError("❌ AI Search /health failed:", error);
    throw error;
  }
}

async function runSearch(query = "*", top = 5) {
  const base = getSearchApiBase();
  try {
    const data = await fetchJSON(`${base}/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, top }),
    });
    debugLog(`🔍 AI Search results for "${query}":`, data);
    return data;
  } catch (error) {
    debugError("❌ AI Search /search failed:", error);
    throw error;
  }
}

// Expose to window for quick console access
const windowWithSearch = /** @type {typeof globalThis & {
  checkSearchHealth?: typeof checkSearchHealth;
  runSearch?: typeof runSearch;
}} */ (globalThis);
windowWithSearch.checkSearchHealth = checkSearchHealth;
windowWithSearch.runSearch = runSearch;

// ================= Dev Panel (non-intrusive) =================
(function mountAISearchDevPanel() {
  // Show panel only in dev contexts (Codespaces or localhost)
  const isDevHost = /localhost|github\.dev/.test(globalThis.location.host);
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
    const $ = (
      /** @type {string} */ selector,
    ) => /** @type {HTMLElement | null} */ (
      panel.querySelector(selector)
    );
    const closeButton = $("#ai-search-close");
    if (closeButton) closeButton.addEventListener("click", () => panel.remove());
    const healthButton = $("#ai-btn-health");
    if (healthButton)
      healthButton.addEventListener("click", async () => {
        const out = $("#ai-out");
        if (!out) return;
        out.textContent = "Checking /health...";
        try {
          const j = await checkSearchHealth();
          out.textContent = JSON.stringify(j, null, 2);
        } catch (e) {
          out.textContent = String(e);
        }
      });
    const searchButton = $("#ai-btn-search");
    if (searchButton)
      searchButton.addEventListener("click", async () => {
        const out = $("#ai-out");
      const qInput = /** @type {HTMLInputElement | null} */ ($("#ai-q"));
      const topInput = /** @type {HTMLInputElement | null} */ ($("#ai-top"));
        if (!out || !qInput || !topInput) return;
        const q = qInput.value || "*";
        const top = Number(topInput.value || 5);
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
  const breadcrumbItems = /** @type {HTMLElement[]} */ (
    Array.from(document.querySelectorAll(".breadcrumb-item"))
  );
  for (const item of breadcrumbItems) {
    item.addEventListener("click", (/** @type {MouseEvent} */ e) => {
      const target = /** @type {HTMLElement} */ (e.currentTarget);
      const section = target.dataset.section;
      console.log("Navigation clicked:", section);
    });
  }
}

/**
 * Initialize search functionality and populate diagnoses
 */
async function initializeSearch() {
  console.log("🔎🔎🔎 === ENTERING initializeSearch() ===");
  const searchInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById("search")
  );
  const searchClear = /** @type {HTMLElement | null} */ (
    document.querySelector(".search-clear")
  );

  // Populate diagnoses list
  console.log("🔎 About to call populateDiagnoses()...");
  await populateDiagnoses();
  console.log("🔎 populateDiagnoses() completed");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const target = /** @type {HTMLInputElement} */ (e.target);
      const query = target.value;
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
if (!appGlobals.DIAGNOSES) {
  appGlobals.DIAGNOSES = [
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

// Diagnoses are cached in appGlobals.DIAGNOSES (shared across modules)
// No module-level variable to avoid TDZ issues

/**
 * @param {string} name
 */
function slugifyDiagnosisId(name) {
  const base = String(name || "diagnosis").toLowerCase();
  const tokens = base.match(/[a-z0-9]+/g);
  return tokens ? tokens.join("-") : "diagnosis";
}

async function ensureDiagnosesLoaded() {
  // Check module-level cache first
  if (Array.isArray(appGlobals.DIAGNOSES) && appGlobals.DIAGNOSES.length > 0) {
    console.log(`✅ Using cached ${appGlobals.DIAGNOSES.length} diagnoses`);
    debugLog(`✅ Using cached ${appGlobals.DIAGNOSES.length} diagnoses`);
    return appGlobals.DIAGNOSES;
  }

  console.log("📥 Loading diagnoses from JSON...");
  debugLog("📥 Loading diagnoses from JSON...");
  
  try {
    console.log("🌐 Fetching: ./data/cardiology_diagnoses/cardiology.json");
    const database = /** @type {{ diagnoses?: Array<{ id?: string; name?: string; title?: string }> }} */ (
      await fetchJSON(STATIC_ASSETS.diagnoses, {
        cache: "no-store",
      })
    );
    console.log("✅ Fetch complete, processing data...", database);

    if (
      database &&
      Array.isArray(database.diagnoses) &&
      database.diagnoses.length > 0
    ) {
      console.log(`📋 Loaded ${database.diagnoses.length} diagnoses from database`);
      debugLog(`📋 Loaded ${database.diagnoses.length} diagnoses from database`);
      const processed = database.diagnoses
        .filter((entry) => entry && (entry.name || entry.title))
        .map((entry) => {
          const name = entry.name || entry.title || "";
          const id = entry.id || slugifyDiagnosisId(name);
          return { id, name };
        });
      // Update global cache
      appGlobals.DIAGNOSES = processed;
      console.log(`✅ Processed ${processed.length} valid diagnoses`);
      debugLog(`✅ Processed ${processed.length} valid diagnoses`);
      return processed;
    } else {
      console.warn("⚠️ Database loaded but has no diagnoses array or is empty", database);
      debugWarn("⚠️ Database loaded but has no diagnoses array or is empty");
    }
  } catch (error) {
    console.error("❌ Failed to load diagnoses list:", error);
    debugError("❌ Failed to load diagnoses list:", error);
  }

  return [];
}

/**
 * Populate the diagnoses list with simple items
 */
async function populateDiagnoses() {
  console.log("🔄 Populating diagnoses...");
  debugLog("🔄 Populating diagnoses...");
  const dxList = /** @type {HTMLElement | null} */ (
    document.querySelector(".dx-list")
  );
  if (!dxList) {
    console.error("❌ .dx-list element not found!");
    debugError("❌ .dx-list element not found!");
    return;
  }

  dxList.innerHTML = '<div class="dx-empty">Loading diagnoses…</div>';
  
  try {
    console.log("📥 Calling ensureDiagnosesLoaded...");
    const diagnoses = await ensureDiagnosesLoaded();
    console.log("📊 Diagnoses loaded:", diagnoses?.length || 0);
    
    // Cache is already updated in ensureDiagnosesLoaded()

    if (!diagnoses || !diagnoses.length) {
      console.warn("⚠️ No diagnoses loaded, showing fallback message");
      debugWarn("⚠️ No diagnoses loaded, showing fallback message");
      dxList.innerHTML = '<div class="dx-empty" style="color: orange;">Unable to load diagnoses. Please refresh.<br><small>Check browser console (F12) for details.</small></div>';
      return;
    }

    console.log(`📝 Rendering ${diagnoses.length} diagnosis items...`);
    debugLog(`📝 Rendering ${diagnoses.length} diagnosis items...`);
    dxList.innerHTML = "";

    for (const diagnosis of diagnoses) {
      const item = document.createElement("div");
      item.className = "dx-item";
      item.dataset.diagnosis = diagnosis.id;
      item.textContent = diagnosis.name;

      item.addEventListener("click", () => {
        debugLog("Selected diagnosis:", diagnosis.name);
        setActiveDiagnosis(diagnosis);
      });

      dxList.appendChild(item);
    }

    console.log(`✅ Successfully populated ${diagnoses.length} diagnoses`);
    debugLog(`✅ Successfully populated ${diagnoses.length} diagnoses`);
  } catch (error) {
    console.error("❌ Error populating diagnoses:", error);
    debugError("❌ Error populating diagnoses:", error);
    dxList.innerHTML = `<div class="dx-empty" style="color: red;">Error loading diagnoses.<br><small>${error instanceof Error ? error.message : 'Unknown error'}</small><br><small>Check browser console (F12) for details.</small></div>`;
  }
}

/**
 * Filter diagnoses based on search query
 */
/**
 * @param {string} query
 */
function filterDiagnoses(query) {
  const items = /** @type {HTMLElement[]} */ (
    Array.from(document.querySelectorAll(".dx-item"))
  );
  const lowerQuery = query.toLowerCase();

  for (const item of items) {
    const title = item.textContent.toLowerCase();
    if (title.includes(lowerQuery)) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  }
}

/**
 * Show all diagnoses
 */
function showAllDiagnoses() {
  const items = /** @type {HTMLElement[]} */ (
    Array.from(document.querySelectorAll(".dx-item"))
  );
  for (const item of items) {
    item.style.display = "block";
  }
}

/**
 * Set active diagnosis and update UI
 */
// Load comprehensive diagnosis data
/** @type {DiagnosisDatabase | null} */
let diagnosisDatabase = null;

async function loadDiagnosisData() {
  if (diagnosisDatabase) return diagnosisDatabase;

  try {
    diagnosisDatabase = /** @type {DiagnosisDatabase} */ (
      await fetchJSON(STATIC_ASSETS.diagnoses)
    );
    debugLog(
      "✅ Loaded diagnosis database with",
      Array.isArray(diagnosisDatabase.diagnoses)
        ? diagnosisDatabase.diagnoses.length
        : 0,
      "diagnoses",
    );
    return diagnosisDatabase;
  } catch (error) {
    debugError("❌ Error loading diagnosis data:", error);
    return null;
  }
}

function clearActiveDiagnosisState() {
  const dxItems = /** @type {HTMLElement[]} */ (
    Array.from(document.querySelectorAll(".dx-item"))
  );
  for (const item of dxItems) {
    item.classList.remove("active");
  }
}

/**
 * @param {string} diagnosisId
 */
function markActiveDiagnosis(diagnosisId) {
  const selectedItem = /** @type {HTMLElement | null} */ (
    document.querySelector(`[data-diagnosis="${diagnosisId}"]`)
  );
  if (selectedItem) {
    selectedItem.classList.add("active");
  }
}

/**
 * @param {string} name
 */
function updateDiagnosisBreadcrumb(name) {
  const breadcrumb = /** @type {HTMLElement | null} */ (
    document.getElementById("current-dx-breadcrumb")
  );
  const nameEl = /** @type {HTMLElement | null} */ (
    document.getElementById("current-dx-name")
  );
  if (breadcrumb && nameEl) {
    nameEl.textContent = name;
    breadcrumb.style.display = "flex";
  }
}

/**
 * @param {string} name
 */
function renderDiagnosisLoading(name) {
  return `
    <div class="panel-h">
      <h3>${name}</h3>
    </div>
    <div class="panel-content">
      <div class="loading">Loading comprehensive diagnosis information...</div>
    </div>
  `;
}

/**
 * @param {string} name
 */
function renderDiagnosisError(name) {
  return `
    <div class="panel-h">
      <h3>${name}</h3>
    </div>
    <div class="panel-content">
      <div class="error">Error loading diagnosis data</div>
    </div>
  `;
}

/**
 * @param {string} name
 */
function renderDiagnosisFallback(name) {
  return `
    <div class="panel-h">
      <h3>${name}</h3>
    </div>
    <div class="panel-content">
      <div class="basic-diagnosis-info">
        <p><strong>Diagnosis:</strong> ${name}</p>
        <p><em>Loading comprehensive clinical information...</em></p>
        <div class="diagnosis-placeholder">
          <h4>Clinical Overview</h4>
          <p>This section will display detailed clinical information, diagnostic criteria, and management guidelines for ${name}.</p>
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
}

/**
 * @param {string} title
 * @param {string[] | undefined} items
 * @param {string} listClass
 */
function renderListSection(title, items, listClass) {
  if (!Array.isArray(items) || items.length === 0) return "";
  const entries = items.map((item) => `<li>${item}</li>`).join("");
  return `
    <div class="diagnosis-section">
      <h4>${title}</h4>
      <ul class="${listClass}">
        ${entries}
      </ul>
    </div>
  `;
}

/**
 * @param {string | string[] | undefined} guidelines
 */
function renderGuidelinesSection(guidelines) {
  if (!guidelines || (Array.isArray(guidelines) && guidelines.length === 0)) {
    return "";
  }

  const content =
    typeof guidelines === "string"
      ? `<p>${guidelines}</p>`
    : guidelines
      .map((guideline) => `<p>${guideline}</p>`)
      .join("");

  return `
    <div class="diagnosis-section">
      <h4>Guidelines</h4>
      <div class="guidelines-content">
        ${content}
      </div>
    </div>
  `;
}

/**
 * @param {Array<{ title: string; description?: string; path: string }> | undefined} pdfs
 */
function renderReferenceSection(pdfs) {
  if (!Array.isArray(pdfs) || pdfs.length === 0) return "";
  const cards = pdfs
    .map(
      (pdf) => `
        <div class="pdf-resource">
          <h5>${pdf.title}</h5>
          <p class="pdf-description">${pdf.description || ""}</p>
          <a href="${pdf.path}" target="_blank" class="pdf-link">
            📄 View PDF Resource
          </a>
        </div>
      `,
    )
    .join("");

  return `
    <div class="diagnosis-section">
      <h4>Reference Materials</h4>
      <div class="reference-materials">
        ${cards}
      </div>
    </div>
  `;
}

/**
 * @param {DiagnosisDetail} detail
 */
function renderDiagnosisDetail(detail) {
  const sections = [
    renderListSection("Clinical Features", detail.features, "feature-list"),
    renderListSection("Diagnostic Workup", detail.workup, "workup-list"),
    renderListSection(
      "Management & Treatment",
      detail.management,
      "management-list",
    ),
    renderListSection("Clinical Pearls", detail.pearls, "pearls-list"),
    renderGuidelinesSection(detail.guidelines),
    renderReferenceSection(detail.pdfs),
  ].filter(Boolean);

  return `
    <div class="panel-h">
      <h3>${detail.name || "Diagnosis"}</h3>
      ${
        detail.description
          ? `<p class="diagnosis-description">${detail.description}</p>`
          : ""
      }
    </div>
    <div class="panel-content">
      ${sections.join("\n")}
    </div>
  `;
}

/**
 * @param {HTMLElement} panel
 */
function scheduleDiagnosisScroll(panel) {
  setTimeout(() => {
    panel.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }, 100);
}

/**
 * @param {DiagnosisDetail[]} diagnoses
 * @param {DiagnosisSummary} diagnosis
 */
function findDetailedDiagnosis(diagnoses, diagnosis) {
  const exact = diagnoses.find(
    /** @param {DiagnosisDetail} detail */ (detail) => detail.id === diagnosis.id,
  );
  if (exact) return exact;
  return diagnoses.find(
    /** @param {DiagnosisDetail} detail */
    (detail) =>
      !!detail.name &&
      detail.name.toLowerCase().includes(diagnosis.name.toLowerCase()),
  );
}

/**
 * @param {DiagnosisSummary} diagnosis
 */
async function setActiveDiagnosis(diagnosis) {
  clearActiveDiagnosisState();
  markActiveDiagnosis(diagnosis.id);
  updateDiagnosisBreadcrumb(diagnosis.name);

  const dxDetail = /** @type {HTMLElement | null} */ (
    document.getElementById("dx-detail")
  );
  if (!dxDetail) {
    console.error("dx-detail panel not found");
    return;
  }

  dxDetail.classList.add("active");
  dxDetail.style.display = "block";
  dxDetail.innerHTML = renderDiagnosisLoading(diagnosis.name);

  const database = await loadDiagnosisData();
  if (!database) {
    dxDetail.innerHTML = renderDiagnosisError(diagnosis.name);
    return;
  }

  const diagnoses = Array.isArray(database.diagnoses)
    ? database.diagnoses
    : [];
  const detailedDiagnosis = findDetailedDiagnosis(diagnoses, diagnosis);

  if (!detailedDiagnosis) {
    dxDetail.innerHTML = renderDiagnosisFallback(diagnosis.name);
    scheduleDiagnosisScroll(dxDetail);
    return;
  }

  dxDetail.innerHTML = renderDiagnosisDetail(detailedDiagnosis);
  scheduleDiagnosisScroll(dxDetail);

  console.log(
    "Displayed comprehensive diagnosis:",
    detailedDiagnosis.name || diagnosis.name,
  );
}

/**
 * Initialize lab values table with reference ranges
 */
async function initializeLabValues() {
  try {
    const labData = /** @type {{
      ranges: Record<string, {
        aliases: string[];
        low: number;
        high: number;
        units?: string;
        note?: string;
      }>;
    }} */ (await fetchJSON(STATIC_ASSETS.labs));

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
    for (const labKey of cardiologyLabs) {
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
    }

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
  if (appGlobals.__spaRouterInit) return;
  appGlobals.__spaRouterInit = true;

  const browserWindow = /** @type {Window & typeof globalThis} */ (globalThis);

  /** @type {MedsModule | null} */
  let medsModule = null;
  /** @type {GuidelinesModule | null} */
  let guidelinesModule = null;

  /**
   * @returns {HTMLElement[]}
   */
  function getMainContainers() {
    const ids = ["layout", "main"];
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((el) => el instanceof HTMLElement);
    return /** @type {HTMLElement[]} */ (nodes);
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
    return /** @type {HTMLElement} */ (el);
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
    return /** @type {HTMLElement} */ (el);
  }

  function show404() {
    const hash = location.hash;
    console.warn(`⚠️ Unknown route: ${hash}`);
    // Fallback to home
    location.hash = "";
  }

  /**
   * @typedef {{
   *   medsRoot: HTMLElement;
   *   guidelinesRoot: HTMLElement;
   *   mains: HTMLElement[];
   * }} RouteContext
   */

  /**
   * @param {string} hash
   */
  function updateNavTabs(hash) {
    const navTabs = /** @type {HTMLElement[]} */ (
      Array.from(document.querySelectorAll(".nav-tab"))
    );
    for (const tab of navTabs) {
      tab.classList.remove("active");
      const page = tab.dataset.page;
      const isActive =
        (hash === "" && page === "main") ||
        (hash.startsWith("meds") && page === "meds") ||
        (hash.startsWith("guidelines") && page === "guidelines");
      if (isActive) {
        tab.classList.add("active");
      }
    }
  }

  /**
   * @param {HTMLElement[]} mains
   */
  function hideMainPanels(mains) {
    for (const main of mains) {
      main.style.display = "none";
    }
  }

  /**
   * @param {HTMLElement[]} mains
   */
  function showMainPanels(mains) {
    for (const main of mains) {
      main.style.display = "";
    }
  }

  /**
   * @param {HTMLElement} root
   */
  function unmountMeds(root) {
    if (medsModule && typeof medsModule.unmountMeds === "function") {
      try {
        medsModule.unmountMeds(root);
      } catch (error) {
        console.warn("Error unmounting meds:", error);
      }
    }
  }

  /**
   * @param {HTMLElement} root
   */
  function unmountGuidelines(root) {
    if (
      guidelinesModule &&
      typeof guidelinesModule.unmountGuidelines === "function"
    ) {
      try {
        guidelinesModule.unmountGuidelines(root);
      } catch (error) {
        console.warn("Error unmounting guidelines:", error);
      }
    }
  }

  async function ensureMedsModule() {
    if (medsModule) return medsModule;
    const module = await import("../../pages/meds.js").catch((error) => {
      console.error("Failed to load Meds module:", error);
      return null;
    });
    if (module) {
      medsModule = /** @type {MedsModule} */ (module);
    }
    return medsModule;
  }

  async function ensureGuidelinesModule() {
    if (guidelinesModule) return guidelinesModule;
    const module = await import("../../pages/guidelines.js").catch((error) => {
      console.error("Failed to load Guidelines module:", error);
      return null;
    });
    if (module) {
      guidelinesModule = /** @type {GuidelinesModule} */ (module);
    }
    return guidelinesModule;
  }

  /**
   * @param {RouteContext} context
   */
  async function showMedsRoute(context) {
    hideMainPanels(context.mains);
    context.guidelinesRoot.style.display = "none";
    context.medsRoot.style.display = "";

    unmountGuidelines(context.guidelinesRoot);

    const module = await ensureMedsModule();
    if (module && typeof module.mountMeds === "function") {
      await module.mountMeds(context.medsRoot);
    }
  }

  /**
   * @param {RouteContext} context
   */
  async function showGuidelinesRoute(context) {
    hideMainPanels(context.mains);
    context.medsRoot.style.display = "none";
    context.guidelinesRoot.style.display = "";

    unmountMeds(context.medsRoot);

    const module = await ensureGuidelinesModule();
    if (module && typeof module.mountGuidelines === "function") {
      await module.mountGuidelines(context.guidelinesRoot);
    }
  }

  /**
   * @param {RouteContext} context
   */
  function showHomeRoute(context) {
    unmountMeds(context.medsRoot);
    unmountGuidelines(context.guidelinesRoot);
    context.medsRoot.style.display = "none";
    context.guidelinesRoot.style.display = "none";
    showMainPanels(context.mains);
  }

  async function handleRoute() {
    const hash = (location.hash || "").replace(/^#\/?/, "");
    const context = {
      medsRoot: ensureMedsContainer(),
      guidelinesRoot: ensureGuidelinesContainer(),
      mains: getMainContainers(),
    };

    updateNavTabs(hash);

    if (hash.startsWith("meds")) {
      await showMedsRoute(context);
      return;
    }

    if (hash.startsWith("guidelines")) {
      await showGuidelinesRoute(context);
      return;
    }

    if (hash) {
      show404();
      return;
    }

    showHomeRoute(context);
  }

  browserWindow.addEventListener("hashchange", handleRoute);
  browserWindow.addEventListener("DOMContentLoaded", handleRoute);
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    handleRoute();
  }

  console.log("✅ SPA router initialized (#/meds, #/guidelines, 404 fallback)");
})();
