/* eslint-env browser */
/*
  noteParser_full_async.js - Async Loop-Safe Clinical Note Parser (ES Module)
  --------------------------------------------------------------------------
  Purpose: Non-blocking version of parseClinicalNoteFull that yields to main
  thread to prevent UI jank during parsing of large notes.

  Features:
  - Cap input at 200k chars
  - Yield after each major phase
  - Safe regex with iteration limits
  - Performance timing markers
  - Identical output to sync version
  - ES module exports (no window globals)
*/

import { yieldToMain } from '../utils/scheduler.js';
import { debugLog, debugWarn, debugError } from "../utils/logger.js";

const MAX_INPUT_LENGTH = 200000; // 200k char limit

/* ========================= Constants (Module Exports) ========================= */
export const MAIN_HEADERS = Object.freeze([
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
]);

export const PRIOR_LINES = Object.freeze([
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
]);

export const LAB_LINE_FULL = /^([A-Za-z0-9.+\s%/-]+?)\s*[:-]?\s*([<>]?\d+(?:\.\d+)?)\s*([A-Za-z%/]+)?\s*(?:\(([\d.-]+)\))?(?:\s*([*\u2191\u2193HhLl]+))?/;

/* ============================= Entry Point ============================= */
export async function parseClinicalNoteFull(text) {
  console.time('⏱️ Parse: Total');

  // Cap input length
  if (text && text.length > MAX_INPUT_LENGTH) {
    debugWarn(`Input truncated from ${text.length} to ${MAX_INPUT_LENGTH} chars`);
    text = text.slice(0, MAX_INPUT_LENGTH);
  }

  // Phase 1: Preprocess
  console.time('⏱️ Parse: Preprocess');
  const clean = normalize(text);
  console.timeEnd('⏱️ Parse: Preprocess');
  await yieldToMain();

  // Phase 2: Split into sections
  console.time('⏱️ Parse: SplitIntoSections');
  const sections = await segmentSectionsFullAsync(clean);
  console.timeEnd('⏱️ Parse: SplitIntoSections');
  await yieldToMain();

  // Phase 3: Parse HPI (extract fields)
  console.time('⏱️ Parse: ParseHPI');
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
  console.timeEnd('⏱️ Parse: ParseHPI');
  await yieldToMain();

  // Phase 4: Parse Assessment (imaging, ECG, labs)
  console.time('⏱️ Parse: ParseAssessment');
  const imaging = await extractImagingAsync(
    clean + "\n" + priorBlock + "\n" + reviewBlock,
  );
  const ecg = extractECG(clean + "\n" + reviewBlock);

  // Labs: extractLabs handles section detection internally
  const labs = extractLabs(clean, sections).slice(0, 100);
  console.timeEnd('⏱️ Parse: ParseAssessment');
  await yieldToMain();

  // Phase 5: Parse Plan (diagnoses)
  console.time('⏱️ Parse: ParsePlan');
  const diagnoses = window.extractDiagnoses(
    pick(sections, [
      "Impression List / Diagnoses",
      "Diagnoses",
      "Impression and Plan",
    ]),
  );
  const impressionFreeText = pick(sections, ["Impression:"])?.trim();
  const planFreeText = pick(sections, ["Plan:"])?.trim();
  console.timeEnd('⏱️ Parse: ParsePlan');
  await yieldToMain();

  // Phase 6: Normalize (meta, vitals)
  console.time('⏱️ Parse: Normalize');
  const metaDates = Array.from(window.findAllDatesISO(clean));
  const [age, sex] = quickDemoMeta(clean);

  // Vitals (scan whole note once)
  const vitals = window.extractVitals(clean);
  console.timeEnd('⏱️ Parse: Normalize');

  console.timeEnd('⏱️ Parse: Total');

  return {
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
}

/* ========================= Section Segmentation ========================= */
async function segmentSectionsFullAsync(text) {
  // Use line-by-line splitting (safe, no greedy regex)
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

  let lineCount = 0;
  for (const raw of lines) {
    lineCount++;

    // Yield every 500 lines to keep responsive
    if (lineCount % 500 === 0) {
      await yieldToMain();
    }

    const line = raw.trim();

    // Check if line matches any header (anchored with ^, using \b for word boundary)
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
function normalize(s) {
  return window.normalizeWhitespace(s);
}

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
  rm.radiologyStudies = extractImagingSync(parts["CXR or Radiology Studies"] || "");
  rm.cardiologyResults = extractImagingSync(parts["Cardiology Results"] || "");
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

  // Cardiac Monitor
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

/* Imaging - Async version with safe regex (non-greedy, bounded) */
async function extractImagingAsync(text) {
  // Safe regex: non-greedy quantifier, bounded length {0,200}
  const re =
    /\b(CTA\s*Chest|CT\s*Chest|CXR|Chest\s*X-?ray|Echo|Echocardiogram|TTE|TEE|MRI|MRA|V\/Q|Cath|Cardiac\s*Cath|PCI|Stent|CABG|TAVR|Watchman|Amulet|TCAR|Carotid\s*US|Peripheral\s*Angiogram|LHC|RHC)[^\n]{0,200}?/gi;

  const out = [];
  const MAX_MATCHES = 1000;

  // Use matchAll instead of exec loop for safety
  const matches = Array.from(text.matchAll(re)).slice(0, MAX_MATCHES);

  if (matches.length >= MAX_MATCHES) {
    debugWarn(`extractImaging: Limited to ${MAX_MATCHES} matches`);
  }

  let iterations = 0;
  for (const m of matches) {
    iterations++;

    // Yield every 100 matches
    if (iterations % 100 === 0) {
      await yieldToMain();
    }

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

/* Synchronous version for small blocks */
function extractImagingSync(text) {
  const re =
    /\b(CTA\s*Chest|CT\s*Chest|CXR|Chest\s*X-?ray|Echo|Echocardiogram|TTE|TEE|MRI|MRA|V\/Q|Cath|Cardiac\s*Cath|PCI|Stent|CABG|TAVR|Watchman|Amulet|TCAR|Carotid\s*US|Peripheral\s*Angiogram|LHC|RHC)[^\n]{0,200}?/gi;

  const out = [];
  const matches = Array.from(text.matchAll(re)).slice(0, 100); // Limit matches

  for (const m of matches) {
    const raw = m[0].trim();
    if (!raw) continue;
    if (!raw.includes(":") && !/\d/.test(raw)) continue;

    const type = detectImagingType(raw);
    const findings = window.afterColon(raw);
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

function extractECG(text) {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5000); // Limit lines processed

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

function extractLabs(block) {
  const labs = [];
  const lines = block
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 500); // Limit lab lines

  for (const line of lines) {
    const match = LAB_LINE_FULL.exec(line);
    if (!match) continue;
    const [, rawName, rawValue, unit, refRange, flag] = match;
    const numericValue = Number(rawValue);
    const lab = {
      name: rawName?.trim() || "",
      value: Number.isNaN(numericValue) ? rawValue || "" : numericValue,
      unit: unit || undefined,
      refRange: refRange || undefined,
      raw: line,
    };
    if (flag) {
      const upper = flag.toUpperCase();
      if (
        upper.includes("H") ||
        upper.includes("\u2191") ||
        upper.includes("*")
      ) {
        lab.value = `${lab.value} (H)`;
      } else if (upper.includes("L") || upper.includes("\u2193")) {
        lab.value = `${lab.value} (L)`;
      }
    }
    labs.push(lab);
  }
  return window.dedupeByKey(labs, (x) => `${x.name}|${x.collectedAt || ""}`);
}

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
    // Use anchored regex with \b for safe matching
    const found = subsectionNames.find((name) =>
      new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i").test(trimmed),
    );
    if (found) {
      commit();
      current = found;
      const rest = trimmed.replace(new RegExp(`^${found.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:?\\s*`, "i"), "");
      if (rest) buf.push(rest);
    } else if (current) {
      buf.push(line);
    }
  }
  commit();
  return parts;
}

// Default export for compatibility
export default parseClinicalNoteFull;
