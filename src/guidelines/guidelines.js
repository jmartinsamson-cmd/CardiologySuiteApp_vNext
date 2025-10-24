/**
 * Guidelines & Teaching Page JavaScript
 * @fileoverview Clinical guidelines and teaching functionality
 * @author Cardiology Suite
 */
/* eslint-env browser */
import {
  initDiagnosisSanitizer,
  sanitizeDiagnosesList,
  isDiagnosisVisible,
} from "../utils/diagnosisSanitizer.js";
import { debugLog, debugWarn, debugError } from "../utils/logger.js";

debugLog("🎓 Initializing Guidelines & Teaching page...");

/**
 * Load diagnosis data from JSON file
 */
async function loadDiagnosisData() {
  try {
    const response = await fetch("./data/cardiology_diagnoses/cardiology.json");
    if (!response.ok) {
      throw new Error(`Failed to load diagnosis data: ${response.status}`);
    }
    const database = await response.json();
    debugLog(
      "✅ Loaded diagnosis database with",
      database.diagnoses.length,
      "diagnoses",
    );
    return database;
  } catch (error) {
    debugError("❌ Error loading diagnosis data:", error);
    return null;
  }
}

/**
 * Complete diagnoses array - All 80 diagnoses from database (sorted A→Z)
 * Unified on window.DIAGNOSES to avoid duplicate declarations with main app.
 * Filtered via diagnosisSanitizer to exclude non-medical items
 */
if (!window.DIAGNOSES) {
  const ALL_DIAGNOSES = [
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

  // Apply sanitization filter - removes non-medical items based on whitelist/blacklist
  window.DIAGNOSES = sanitizeDiagnosesList(ALL_DIAGNOSES);
}
var DIAGNOSES = window.DIAGNOSES;

/**
 * Hide filtered diagnosis items from static HTML sidebar
 * Applies sanitization rules to existing DOM elements
 */
function hideFilteredDiagnosisItems() {
  const items = document.querySelectorAll(".guidelines-dx-item");
  let hiddenCount = 0;

  items.forEach((item) => {
    const diagnosisName = item.textContent.trim();
    if (!isDiagnosisVisible(diagnosisName)) {
      item.style.display = "none";
      hiddenCount++;
    }
  });

  if (hiddenCount > 0) {
    debugLog(
      `[sidebar] Hid ${hiddenCount} non-medical items from static HTML`,
    );
  }
}

/**
 * Initialize theme functionality (copied from main app)
 */
function initializeTheme() {
  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("theme-light");
      debugLog("Theme toggled");
    });
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  debugLog("✅ Guidelines page DOM loaded, initializing...");

  // Initialize diagnosis sanitizer (preload whitelist/blacklist)
  await initDiagnosisSanitizer();

  // Hide filtered diagnosis items from static HTML
  hideFilteredDiagnosisItems();

  // Initialize theme toggle (reuse from main app)
  initializeTheme();

  // Initialize guidelines-specific functionality
  // Skip dynamic list creation since we have static HTML
  // initializeGuidelinesList();
  initializeGuidelinesSearch();
  initializeGuidelinesTabs();

  debugLog("✅ Guidelines page initialized");
  // Attach click handlers to static diagnosis list (if present)
  attachStaticDiagnosisClickHandlers();

  // SIMPLE FIX: Add direct click handlers to all diagnosis items
  setTimeout(() => {
    const items = document.querySelectorAll(".guidelines-dx-item");
    debugLog(
      `🔧 SIMPLE FIX: Adding direct click handlers to ${items.length} items`,
    );

    items.forEach((item) => {
      // Remove any existing handlers
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      // Also remove any inline onclick attribute to avoid double handling
      newItem.removeAttribute("onclick");

      // Add simple click handler
      newItem.addEventListener("click", function () {
        debugLog("✅ DIRECT CLICK DETECTED:", this.textContent);

        // Simple visual feedback
        document
          .querySelectorAll(".guidelines-dx-item")
          .forEach((i) => (i.style.background = ""));
        this.style.background = "rgba(220, 38, 38, 0.2)";

        // Show/hide content areas
        const welcome = document.getElementById("guidelines-welcome");
        const content = document.getElementById("guidelines-content");
        const title = document.getElementById("guidelines-title");

        if (welcome) welcome.style.display = "none";
        if (content) content.style.display = "block";
        if (title)
          title.textContent = this.textContent + " - Clinical Guidelines";
      });

      debugLog(
        `   ✅ Handler added to: ${newItem.textContent.substring(0, 30)}...`,
      );
    });

    debugLog("🎉 SIMPLE FIX: All click handlers added successfully");
  }, 2000);

  // Observe sidebar for DOM changes (e.g., static HTML injection)
  const dxList = document.getElementById("guidelines-dx-list");
  if (dxList && typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(() => {
      attachStaticDiagnosisClickHandlers();
    });
    observer.observe(dxList, { childList: true, subtree: false });
    debugLog("👁️ MutationObserver attached to guidelines-dx-list");
  }
});

/**
 * Attach click event listeners to static .guidelines-dx-item elements (for static HTML injection)
 */
function attachStaticDiagnosisClickHandlers() {
  debugLog(
    "🔗 Attempting to attach click handlers to static diagnosis items...",
  );

  // Only run if the list is already present and populated (static HTML)
  const dxList = document.getElementById("guidelines-dx-list");
  if (!dxList) {
    debugError("❌ guidelines-dx-list element not found!");
    return;
  }

  const items = dxList.querySelectorAll(".guidelines-dx-item");
  if (!items.length) {
    debugWarn("⚠️ No .guidelines-dx-item elements found in the list");
    return;
  }

  let attachedCount = 0;
  items.forEach((item, index) => {
    // Prevent duplicate handlers
    if (item._guidelinesClickAttached) {
      debugLog(`↩️ Item ${index + 1} already has click handler, skipping`);
      return;
    }

    item._guidelinesClickAttached = true;
    item.addEventListener("click", () => {
      debugLog("🖱️ Diagnosis item clicked:", item.textContent);

      const diagnosisId = item.dataset.diagnosis;
      if (!diagnosisId) {
        debugError("❌ No data-diagnosis attribute found on clicked item");
        return;
      }

      const diagnosis = DIAGNOSES.find((d) => d.id === diagnosisId);
      if (diagnosis) {
        debugLog("✅ Selected diagnosis for guidelines:", diagnosis.name);

        // Add visual feedback
        item.style.background = "rgba(220, 38, 38, 0.2)";
        setTimeout(() => {
          item.style.background = "";
        }, 200);

        setActiveGuidelinesDiagnosis(diagnosis);
      } else {
        debugError(
          `❌ Diagnosis not found for id: "${diagnosisId}". Available IDs:`,
          DIAGNOSES.map((d) => d.id).slice(0, 5),
        );
      }
    });

    attachedCount++;
    debugLog(
      `✅ Attached click handler to item ${index + 1}: "${item.textContent}" (${item.dataset.diagnosis})`,
    );
  });

  debugLog(
    `🎉 Successfully attached click handlers to ${attachedCount}/${items.length} diagnosis items`,
  );
}

/**
 * Initialize guidelines search functionality
 */
function initializeGuidelinesSearch() {
  const searchInput = document.getElementById("guidelines-search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const items = document.querySelectorAll(".guidelines-dx-item");

    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      if (text.includes(query)) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  });
}

/**
 * Initialize guidelines tabs functionality
 */
function initializeGuidelinesTabs() {
  const tabs = document.querySelectorAll(".guidelines-tab");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab;

      // Remove active class from all tabs and panels
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      // Add active class to clicked tab and corresponding panel
      tab.classList.add("active");
      const targetPanel = document.getElementById(`${targetTab}-panel`);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }
    });
  });
}

/**
 * Set active diagnosis for guidelines view
 */
async function setActiveGuidelinesDiagnosis(diagnosis) {
  // Remove active class from all items
  document.querySelectorAll(".guidelines-dx-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Add active class to selected item
  const selectedItem = document.querySelector(
    `[data-diagnosis="${diagnosis.id}"]`,
  );
  if (selectedItem) {
    selectedItem.classList.add("active");
  }

  // Hide welcome screen and show content area
  const welcomeScreen = document.getElementById("guidelines-welcome");
  const contentArea = document.getElementById("guidelines-content");

  if (welcomeScreen && contentArea) {
    welcomeScreen.style.display = "none";
    contentArea.style.display = "block";
  }

  // Update title
  const titleElement = document.getElementById("guidelines-title");
  if (titleElement) {
    titleElement.textContent = `${diagnosis.name} - Clinical Guidelines`;
  }

  // Load comprehensive diagnosis data
  const database = await loadDiagnosisData();
  if (!database) {
    debugError("❌ Failed to load diagnosis database");
    return;
  }

  // Find detailed diagnosis data
  const detailedDiagnosis = database.diagnoses.find(
    (d) => d.id === diagnosis.id,
  );

  if (detailedDiagnosis) {
    updateGuidelinesContent(detailedDiagnosis);
    updateMetadata(detailedDiagnosis);
  } else {
    debugWarn(`⚠️ No detailed data found for ${diagnosis.id}`);
    showPlaceholderContent(diagnosis);
  }
}

/**
 * Update guidelines content with diagnosis data
 */
function updateGuidelinesContent(diagnosis) {
  // Update ACC Guidelines - map from workup and management
  const guidelinesContent = document.getElementById("acc-guidelines-content");
  if (guidelinesContent) {
    if (diagnosis.management || diagnosis.workup) {
      let html = `<div class="guideline-section">`;
      html += `<h3>🏛️ ACC/AHA Clinical Practice Guidelines</h3>`;
      html += `<h4>Clinical Practice Guidelines for ${diagnosis.name}</h4>`;
      html += `<p>${diagnosis.description || ""}</p>`;

      if (diagnosis.workup && diagnosis.workup.length > 0) {
        html += `<h4>📋 Diagnostic Workup</h4><ul>`;
        diagnosis.workup.forEach((item) => {
          html += `<li>${item}</li>`;
        });
        html += `</ul>`;
      }

      if (diagnosis.management && diagnosis.management.length > 0) {
        html += `<h4>💊 Management Recommendations</h4><ul>`;
        diagnosis.management.forEach((item) => {
          html += `<li>${item}</li>`;
        });
        html += `</ul>`;
      }

      html += `<div class="note-box"><strong>Note:</strong> Always refer to the latest ACC/AHA or relevant specialty society guidelines for the most current recommendations.</div>`;
      html += `</div>`;
      guidelinesContent.innerHTML = html;
    } else {
      guidelinesContent.innerHTML = generatePlaceholderGuidelines(diagnosis);
    }
  }

  // Update Teaching Points - map from pearls
  const teachingContent = document.getElementById("teaching-points-content");
  if (teachingContent) {
    if (diagnosis.pearls && diagnosis.pearls.length > 0) {
      let html = `<div class="teaching-section">`;
      html += `<h3>⭐ Teaching Points</h3>`;
      html += `<h4>Key educational insights and clinical pearls</h4>`;
      html += `<ul class="teaching-list">`;
      diagnosis.pearls.forEach((pearl) => {
        html += `<li class="teaching-point">💡 ${pearl}</li>`;
      });
      html += `</ul></div>`;
      teachingContent.innerHTML = html;
    } else {
      teachingContent.innerHTML = generatePlaceholderTeaching(diagnosis);
    }
  }

  // Update Safety Alerts - map from features (contraindications/warnings)
  const safetyContent = document.getElementById("safety-alerts-content");
  if (safetyContent) {
    if (diagnosis.features && diagnosis.features.length > 0) {
      let html = `<div class="safety-section">`;
      html += `<h3>⚠️ Safety Alerts & Clinical Features</h3>`;
      html += `<h4>Critical safety considerations and key clinical features</h4>`;
      html += `<ul class="features-list">`;
      diagnosis.features.forEach((feature) => {
        html += `<li class="safety-item">🔍 ${feature}</li>`;
      });
      html += `</ul></div>`;
      safetyContent.innerHTML = html;
    } else {
      safetyContent.innerHTML = generatePlaceholderSafety(diagnosis);
    }
  }

  // Update Resources - show available data sections
  const resourcesContent = document.getElementById(
    "clinical-resources-content",
  );
  if (resourcesContent) {
    let html = `<div class="resources-section">`;
    html += `<h3>📚 Clinical Resources</h3>`;
    html += `<h4>Evidence-based references and additional materials</h4>`;
    html += `<div class="resource-list">`;
    html += `<div class="resource-item">
            <h4>Complete Clinical Profile</h4>
            <p>This diagnosis includes comprehensive information on:</p>
            <ul>`;
    if (diagnosis.features)
      html += `<li>✓ Clinical Features & Presentation</li>`;
    if (diagnosis.workup) html += `<li>✓ Diagnostic Workup & Testing</li>`;
    if (diagnosis.management)
      html += `<li>✓ Management & Treatment Guidelines</li>`;
    if (diagnosis.pearls)
      html += `<li>✓ Clinical Pearls & Teaching Points</li>`;
    html += `</ul></div>`;
    html += `<div class="resource-item">
            <h4>Latest Guidelines</h4>
            <p>Refer to ACC/AHA, ESC, or relevant specialty society guidelines for the most current evidence-based recommendations.</p>
        </div>`;
    html += `</div></div>`;
    resourcesContent.innerHTML = html;
  }
}

/**
 * Update metadata display
 */
function updateMetadata(diagnosis) {
  // Update last updated date
  const lastUpdated = document.getElementById("last-updated-date");
  if (lastUpdated) {
    lastUpdated.textContent = diagnosis.lastUpdated || "Recent";
  }

  // Update evidence level
  const evidenceLevel = document.getElementById("evidence-level");
  if (evidenceLevel) {
    const level = diagnosis.evidenceLevel || "B";
    evidenceLevel.textContent = `Class ${level}`;
    evidenceLevel.className = `evidence-${level.toLowerCase()}`;
  }
}

/**
 * Format guidelines content
 */
// eslint-disable-next-line no-unused-vars
function formatGuidelinesContent(guidelines) {
  if (Array.isArray(guidelines)) {
    return guidelines
      .map(
        (guideline) =>
          `<div class="guideline-recommendation">
                <h4>${guideline.title || "Clinical Recommendation"}</h4>
                <p>${guideline.content || guideline}</p>
                ${guideline.class ? `<p><strong>Class:</strong> ${guideline.class}</p>` : ""}
                ${guideline.level ? `<p><strong>Level of Evidence:</strong> ${guideline.level}</p>` : ""}
            </div>`,
      )
      .join("");
  }
  return `<div class="guideline-recommendation"><p>${guidelines}</p></div>`;
}

/**
 * Format teaching content
 */
// eslint-disable-next-line no-unused-vars
function formatTeachingContent(teaching) {
  if (Array.isArray(teaching)) {
    return teaching
      .map(
        (point) =>
          `<div class="teaching-point">
                <h4>💡 ${point.title || "Teaching Point"}</h4>
                <p>${point.content || point}</p>
            </div>`,
      )
      .join("");
  }
  return `<div class="teaching-point"><p>${teaching}</p></div>`;
}

/**
 * Format safety content
 */
// eslint-disable-next-line no-unused-vars
function formatSafetyContent(safety) {
  if (Array.isArray(safety)) {
    return safety
      .map(
        (alert) =>
          `<div class="safety-alert">
                <h4>🚨 ${alert.title || "Safety Alert"}</h4>
                <p>${alert.content || alert}</p>
                ${alert.severity ? `<p><strong>Severity:</strong> ${alert.severity}</p>` : ""}
            </div>`,
      )
      .join("");
  }
  return `<div class="safety-alert"><p>${safety}</p></div>`;
}

/**
 * Format resources content
 */
// eslint-disable-next-line no-unused-vars
function formatResourcesContent(resources) {
  if (Array.isArray(resources)) {
    return resources
      .map(
        (resource) =>
          `<div class="resource-item">
                <h4>📚 ${resource.title || "Clinical Resource"}</h4>
                <p>${resource.description || resource}</p>
                ${resource.url ? `<p><a href="${resource.url}" target="_blank">View Resource →</a></p>` : ""}
            </div>`,
      )
      .join("");
  }
  return `<div class="resource-item"><p>${resources}</p></div>`;
}

/**
 * Generate placeholder content when detailed data is not available
 */
function generatePlaceholderGuidelines(diagnosis) {
  return `
        <div class="guideline-recommendation">
            <h4>Clinical Practice Guidelines for ${diagnosis.name}</h4>
            <p>Comprehensive clinical practice guidelines are being compiled for this diagnosis. Key management principles include:</p>
            <ul>
                <li>Evidence-based diagnostic approach</li>
                <li>Risk stratification and assessment</li>
                <li>Therapeutic intervention protocols</li>
                <li>Follow-up and monitoring guidelines</li>
                <li>Patient education and counseling</li>
            </ul>
            <p><strong>Note:</strong> Always refer to the latest ACC/AHA or relevant specialty society guidelines for the most current recommendations.</p>
        </div>
    `;
}

function generatePlaceholderTeaching(diagnosis) {
  return `
        <div class="teaching-point">
            <h4>💡 Key Teaching Points for ${diagnosis.name}</h4>
            <p>Important educational considerations for this diagnosis:</p>
            <ul>
                <li>Pathophysiology and clinical presentation patterns</li>
                <li>Diagnostic pearls and common pitfalls</li>
                <li>Treatment decision-making framework</li>
                <li>Patient communication strategies</li>
                <li>Interprofessional collaboration points</li>
            </ul>
        </div>
    `;
}

function generatePlaceholderSafety(diagnosis) {
  return `
        <div class="safety-alert">
            <h4>🚨 Safety Considerations for ${diagnosis.name}</h4>
            <p>Critical safety points to consider:</p>
            <ul>
                <li>High-risk patient populations and contraindications</li>
                <li>Drug interactions and adverse effects monitoring</li>
                <li>Emergency situations and red flag symptoms</li>
                <li>Procedural safety considerations</li>
                <li>Follow-up requirements and monitoring parameters</li>
            </ul>
            <p><strong>Always verify current safety protocols and institutional guidelines.</strong></p>
        </div>
    `;
}

// eslint-disable-next-line no-unused-vars
function generatePlaceholderResources(diagnosis) {
  return `
        <div class="resource-item">
            <h4>📚 Clinical Resources for ${diagnosis.name}</h4>
            <p>Recommended evidence-based resources:</p>
            <ul>
                <li>Current clinical practice guidelines (ACC/AHA, ESC, etc.)</li>
                <li>Systematic reviews and meta-analyses</li>
                <li>Clinical decision support tools</li>
                <li>Patient education materials</li>
                <li>Quality improvement resources</li>
            </ul>
        </div>
    `;
}

function showPlaceholderContent(diagnosis) {
  updateGuidelinesContent({
    name: diagnosis.name,
    guidelines: null,
    teaching: null,
    safety: null,
    resources: null,
  });
}
