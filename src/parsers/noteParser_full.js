/* eslint-env browser */
/* global extractDiagnoses, findAllDatesISO, extractVitals, extractLabs, normalizeWhitespace */
/*
  noteParser_full.js - Full Template-Aware Clinical Note Parser (JavaScript)
  noteParser_full.js - Full Template-Aware Clinical Note Parser (JavaScript)
  -------------------------------------------------------------------------
  Purpose: Parse PRIOR NOTES that follow (even loosely) your complete CIS
  template so we do NOT miss any fields. This expands section detection to all
  headings and subheadings you shared (Chief Complaint, Reason for Consult,
  HPI, PMH/PSH/FH/SH, Previous Diagnostic Studies lines, Review/Management
  subsections, Impression & Plan blocks) and extracts structured data for the
  slim/exact renderers.

  Drop-in: save alongside your existing parser as ./noteParser_full.js
  Exports: parseClinicalNoteFull(text) -> ParsedNoteFull

  Works with your existing renderers (renderSlimCardiologyNote, renderExactTemplate).

  NOTE: This file depends on parserHelpers.js for shared utility functions.
  Make sure parserHelpers.js is loaded before this file.
*/

/* ============================= Entry Point ============================= */
function parseClinicalNoteFull(text) {
  // Cap input length to prevent performance issues
  const MAX_INPUT_LENGTH = 200000;
  if (text && text.length > MAX_INPUT_LENGTH) {
    console.warn(`Input truncated from ${text.length} to ${MAX_INPUT_LENGTH} chars`);
    text = text.slice(0, MAX_INPUT_LENGTH);
  }

  console.log('🔍 Step 1: Normalizing...');
  const clean = normalize(text);
  console.log('🔍 Step 2: Segmenting sections...');
  const sections = segmentSectionsFull(clean);
  console.log('🔍 Step 3: Extracting fields...');

  const chiefComplaint = pick(sections, ["Chief Complaint"])?.trim();
  const reasonForConsult = pick(sections, ["Reason for Consult"])
    ?.replace(/^Reason for Consult:?\s*/i, "")
    .trim();
  const hpi = pick(sections, ["History of Present Illness"])?.trim();

  const pmh = listify(pick(sections, ["Past Medical History"]));
  const psh = listify(pick(sections, ["Past Surgical History"]));
  const familyHistory = listify(pick(sections, ["Family History"]));
  const socialHistory = listify(pick(sections, ["Social History"]));

  // Previous Diagnostic Studies (line-items)
  const priorBlock =
    pick(sections, ["Previous Diagnostic Studies (with date and results)"]) ||
    "";
  const priorStudies = extractPriorStudyLines(priorBlock);

  // Review / Management (subsections)
  const reviewBlock = pick(sections, ["Review / Management"]) || "";
  const reviewManagement = extractReviewManagement(reviewBlock);

  // Imaging & ECG from anywhere
  console.log('🔍 Step 4: Extracting imaging...');
  const imaging = extractImaging(
    clean + "\n" + priorBlock + "\n" + reviewBlock,
  );
  console.log('🔍 Step 5: Extracting ECG...');
  const ecg = extractECG(clean + "\n" + reviewBlock);

  // Labs: extractLabs handles section detection internally
  console.log('🔍 Step 6: Extracting labs (this may hang on problematic notes)...');
  const labs = extractLabs(clean, sections).slice(0, 100);
  console.log('🔍 Step 7: Labs extracted successfully');

  const diagnoses = extractDiagnoses(
    pick(sections, [
      "Impression List / Diagnoses",
      "Diagnoses",
      "Impression and Plan",
    ]),
  );
  const impressionFreeText = pick(sections, ["Impression:"])?.trim();
  const planFreeText = pick(sections, ["Plan:"])?.trim();

  const metaDates = Array.from(findAllDatesISO(clean));
  const [age, sex] = quickDemoMeta(clean);

  // Vitals (scan whole note once, pass sections for better extraction)
  console.log('🔍 Step 8: Extracting vitals...');
  const vitals = extractVitals(clean, sections);
  console.log('🔍 Step 9: Building return object...');

  const result = {
    fullText: clean,
    meta: { detectedDates: metaDates, patientAge: age, patientSex: sex },
    sections,
    chiefComplaint,
    reasonForConsult,
    hpi,
    pmh,
    psh,
    familyHistory,
    socialHistory,
    priorStudies,
    reviewManagement,
    vitals,
    labs,
    imaging,
    ecg,
    diagnoses,
    impressionFreeText,
    planFreeText,
  };

  console.log('🔍 Step 10: Returning result...');
  return result;
}
console.log('✅ parseClinicalNoteFull function defined');

/* ========================= Section Segmentation ========================= */
const MAIN_HEADERS = [
  /^Chief\s*Complaint\b/i,
  /^Reason\s*for\s*Consult\b/i,
  /^History\s*of\s*Present\s*Illness\b|^HPI\b/i,
  /^Past\s*Medical\s*History\b|^PMH\b/i,
  /^Past\s*Surgical\s*History\b|^PSH\b/i,
  /^Family\s*History\b/i,
  /^Social\s*History\b/i,
  /^Previous\s*Diagnostic\s*Studies\s*\(with date and results\)\b/i,
  /^Review\s*\/\s*Management\b|^Review\s*and\s*Management\b/i,
  /^Impression\s*and\s*Plan\b/i,
  /^Impression:\b/i,
  /^Impression\s*List\s*\/\s*Diagnoses:\b/i,
  /^Plan:\b/i,
  /^Laboratory\s*Results\b/i,
];

function segmentSectionsFull(text) {
  const lines = text.split(/\n/);
  const map = { __full: text };
  let current = "__preamble";
  let buf = [];
  const commit = () => {
    if (!buf.length) return;
    map[current] =
      (map[current] ? map[current] + "\n" : "") + buf.join("\n").trim();
    buf = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    const header = MAIN_HEADERS.find((re) => re.test(line));
    if (header) {
      commit();
      current = normalizeHeader(line);
      map[current] = map[current] || "";
    } else {
      buf.push(raw);
    }
  }
  commit();
  return map;
}

function normalizeHeader(h) {
  const t = h.replace(/\s+/g, " ").trim();
  if (/Chief Complaint/i.test(t)) return "Chief Complaint";
  if (/Reason for Consult/i.test(t)) return "Reason for Consult";
  if (/History of Present Illness|\bHPI\b/i.test(t))
    return "History of Present Illness";
  if (/Past Medical History|\bPMH\b/i.test(t)) return "Past Medical History";
  if (/Past Surgical History|\bPSH\b/i.test(t)) return "Past Surgical History";
  if (/Family History/i.test(t)) return "Family History";
  if (/Social History/i.test(t)) return "Social History";
  if (/Previous Diagnostic Studies/i.test(t))
    return "Previous Diagnostic Studies (with date and results)";
  if (/Review\s*\/\s*Management|Review and Management/i.test(t))
    return "Review / Management";
  if (/^Impression and Plan$/i.test(t)) return "Impression and Plan";
  if (/^Impression:\s*$/i.test(t)) return "Impression:";
  if (/Impression List \/ Diagnoses:/i.test(t))
    return "Impression List / Diagnoses";
  if (/^Plan:\s*$/i.test(t)) return "Plan:";
  if (/Laboratory Results/i.test(t)) return "Laboratory Results";
  return t;
}

function pick(map, names) {
  for (const n of names) if (map[n]) return map[n];
}

/* ============================== Extractors ============================== */
// normalize is a local alias for normalizeWhitespace from parserHelpers.js
function normalize(s) {
  return normalizeWhitespace(s);
}

// findAllDatesISO is now provided by parserHelpers.js
function quickDemoMeta(text) {
  const ageMatch = /\b(\d{1,3})\s*-?\s*(yo|y\/o|years?\s*old)\b/i.exec(text);
  const sexMatch = /\b(male|female|man|woman|m|f)\b/i.exec(text);
  const age = ageMatch?.[1];
  const sex = sexMatch?.[1];
  const sexChar = sex ? sex.charAt(0).toUpperCase() : undefined;
  return [age ? +age : undefined, sexChar];
}
function listify(block) {
  if (!block) return undefined;
  return block
    .split(/\n+/)
    .map((s) => s.replace(/^[-\u2022*\d.)\s]+/, "").trim())
    .filter(Boolean);
}
// Prior studies: recognize each line you listed
const PRIOR_LINES = [
  { key: "ECHO/TTE", rx: /\b(ECHO|TTE)\b/i },
  { key: "Carotid US", rx: /carotid\s*US/i },
  { key: "MPI/Stress Test", rx: /\b(MPI|Stress\s*Test)\b/i },
  { key: "TEE/ECHO", rx: /\b(TEE|Transesophageal)\b/i },
  { key: "PET Scan", rx: /\bPET\s*Scan\b/i },
  { key: "Coronary Calcium Score", rx: /coronary\s*calcium\s*score|\bCAC\b/i },
  { key: "ABI/BLEA", rx: /\b(ABI|BLEA)\b/i },
  { key: "Venous US/Reflux", rx: /Venous\s*US|Reflux\s*Study/i },
  { key: "LHC/RHC", rx: /\b(LHC|RHC)\b|Cath|PCI/i },
  { key: "Peripheral Angiogram", rx: /Peripheral\s*Angiogram/i },
  { key: "CABG", rx: /\bCABG\b/i },
];

function extractPriorStudyLines(block) {
  const lines = block.split(/\n/).map((s) => s.trim());
  const out = [];
  for (const line of lines) {
    if (!line) continue;
    const name = PRIOR_LINES.find((p) => p.rx.test(line))?.key;
    if (!name) continue;
    out.push({
      modality: name,
      date: window.firstISO(line),
      result: window.afterColon(line),
      raw: line,
    });
  }
  return window.dedupeByKey(
    out,
    (x) => x.modality + "|" + (x.date || "") + "|" + (x.result || ""),
  );
}

function extractReviewManagement(block) {
  const rm = {};
  const parts = splitSubsections(block, [
    "Deselected Results",
    "Laboratory Results",
    "CXR or Radiology Studies",
    "Cardiology Results",
    "Diagnostic Findings",
    "Cardiac Monitor",
    "EKG",
    "Condition",
  ]);
  rm.deselectedResults = parts["Deselected Results"];
  rm.laboratoryResults = extractLabs(parts["Laboratory Results"] || "");
  rm.radiologyStudies = extractImaging(parts["CXR or Radiology Studies"] || "");
  rm.cardiologyResults = extractImaging(parts["Cardiology Results"] || "");
  rm.diagnosticFindings = (parts["Diagnostic Findings"] || "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  rm.ekgInstruction = parts["EKG"]?.trim();
  rm.condition =
    (parts["Condition"] || "")
      .split(/[,\s]+/)
      .find((x) => /Stable|Fair|Guarded|Serious|Critical/i.test(x)) ||
    undefined;

  // Cardiac Monitor -- try to parse a mini EKG line
  const cm = parts["Cardiac Monitor"];
  if (cm) {
    const rate = /\bRate\s*(\d{2,3})\b/i.exec(cm)?.[1];
    const rhythm =
      /(NSR|AF(?:ib)?|AFL|SVT|VT|JR|SB|Sinus\s*(?:brady|tachy)cardia)/i.exec(
        cm,
      )?.[0];
    rm.cardiacMonitor = {
      date: window.firstISO(cm),
      rate: rate ? +rate : undefined,
      rhythm: rhythm || undefined,
      text: cm.trim(),
    };
  }
  return rm;
}

// Imaging & ECG (shared with whole-note scan)

function extractImaging(text) {
  // Use non-greedy match and limit length to prevent catastrophic backtracking
  const re =
    /\b(CTA\s*Chest|CT\s*Chest|CXR|Chest\s*X-?ray|Echo|Echocardiogram|TTE|TEE|MRI|MRA|V\/Q|Cath|Cardiac\s*Cath|PCI|Stent|CABG|TAVR|Watchman|Amulet|TCAR|Carotid\s*US|Peripheral\s*Angiogram|LHC|RHC)[^\n]{0,200}/gi;
  const out = [];

  // Use matchAll instead of exec loop for safety
  const MAX_MATCHES = 1000;
  const matches = Array.from(text.matchAll(re)).slice(0, MAX_MATCHES);

  if (matches.length >= MAX_MATCHES) {
    console.warn(`extractImaging: Limited to ${MAX_MATCHES} matches to prevent freeze`);
  }

  for (const m of matches) {
    const raw = m[0].trim();
    if (!raw) continue;
    if (!raw.includes(":") && !/\d/.test(raw)) continue;
    const type = detectImagingType(raw);
    const dashParts = raw.split(/-\s*/, 2);
    const dashRemainder = dashParts.length > 1 ? dashParts[1] : undefined;
    const afterDash = dashRemainder ? dashRemainder.trim() : undefined;
    const findings = window.afterColon(raw) ?? afterDash;
    const date = window.firstISO(raw);
    if (!date && !findings) continue;
    out.push({ type, date, findings, raw });
  }
  return window.dedupeByKey(
    out,
    (x) => x.type + "|" + (x.date || "") + "|" + (x.findings || ""),
  );
}

function detectImagingType(line) {
  const s = line.toLowerCase();
  if (/(\btee\b|transesophageal)/.test(s)) return "TEE";
  if (/(\btte\b|transthoracic|echo)/.test(s)) return "Echo/TTE";
  if (/cath|pci|stent|\blhc\b|\brhc\b/.test(s)) return "Cath (LHC/RHC/PCI)";
  if (/cta|ct\s*chest/.test(s)) return "CTA Chest";
  if (/\bcxr\b|x-?ray/.test(s)) return "CXR";
  if (/mri|mra/.test(s)) return "MRI/MRA";
  if (/v\/?q/.test(s)) return "V/Q";
  if (/carotid/.test(s)) return "Carotid US";
  if (/peripheral\s*angiogram/.test(s)) return "Peripheral Angiogram";
  return "Study";
}

// ECG

function extractECG(text) {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [];
  for (const line of lines) {
    if (!/(EKG|ECG)/i.test(line)) continue;
    if (/^(EKG|ECG)\s*:?$/i.test(line)) continue;
    const rateMatch = /\brate\s*(\d{2,3})\b/i.exec(line);
    const rhythmMatch =
      /(NSR|Normal\s*Sinus\s*Rhythm|Sinus\s*rhythm|Atrial\s*fibrillation|AF(?:ib)?|AFL|SVT|VT|JR|SB|Sinus\s*(?:brady|tachy)cardia)/i.exec(
        line,
      );
    const conductionMatch =
      /(RBBB|LBBB|2\s*AV\s*Block\s*(?:Mobitz\s*(?:I|II))?|1\s*AV\s*Block|3\s*AV\s*Block|bifascicular\s*block|trifascicular\s*block)/i.exec(
        line,
      );
    const sttMatch = /(\bST[^,;]+|T-?wave[^,;]+)/i.exec(line);

    let rhythm = rhythmMatch ? rhythmMatch[0] : undefined;
    if (rhythm) {
      if (/^NSR$/i.test(rhythm)) {
        rhythm = "NSR";
      } else if (/normal\s*sinus\s*rhythm/i.test(rhythm)) {
        rhythm = "Normal sinus rhythm";
      } else if (/sinus\s*rhythm/i.test(rhythm)) {
        rhythm = "Sinus rhythm";
      } else if (/sinus\s*/i.test(rhythm)) {
        rhythm = rhythm.replace(/sinus\s*/i, "Sinus ");
      }
      rhythm = rhythm.replace(/\s+/g, " ").trim();
    }

    const conduction = conductionMatch
      ? conductionMatch[0].replace(/\s+/g, " ").trim()
      : undefined;
    const stt = sttMatch ? sttMatch[0].replace(/\s+/g, " ").trim() : undefined;
    const date = window.firstISO(line);
    const rate = rateMatch && rateMatch[1] ? +rateMatch[1] : undefined;

    if (!date && !rate && !rhythm && !conduction && !stt) continue;
    out.push({ date, rate, rhythm, conduction, stt, raw: line });
  }
  return out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

// extractLabs is now provided by parserHelpers.js
// extractVitals is now provided by parserHelpers.js

/* =============================== Utils =============================== */
// afterColon, firstISO, dedupeBy are now provided by parserHelpers.js
// Use them directly from window (already exported globally)

// Missing functions that need to be added
function splitSubsections(block, subsectionNames) {
  const parts = {};
  const lines = block.split(/\n/);
  let current = "";
  let buf = [];

  const commit = () => {
    if (buf.length && current) {
      parts[current] = buf.join("\n").trim();
      buf = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const found = subsectionNames.find((name) =>
      new RegExp(`^${name}\\b`, "i").test(trimmed),
    );
    if (found) {
      commit();
      current = found;
      const rest = trimmed.replace(new RegExp(`^${found}\\s*:?\\s*`, "i"), "");
      if (rest) buf.push(rest);
    } else if (current) {
      buf.push(line);
    }
  }
  commit();
  return parts;
}

// extractDiagnoses is now provided by parserHelpers.js

// Make functions globally available for browser
if (typeof window !== "undefined") {
  window.parseClinicalNoteFull = parseClinicalNoteFull;
}

// ES module export for Node.js (commented out for browser compatibility)
// export { parseClinicalNoteFull };
