// @ts-nocheck
/* eslint-env browser */
/* global normalizeWhitespace, findAllDatesISO, extractVitals, extractLabs, extractAllergies, extractDiagnoses, dedupeByKey, toTitle, firstISO, dedupe, toSentenceCase, listify */
/*
  noteParser.js — Clinical Note → JSON (JavaScript)
  ---------------------------------------------------------------------
  Browser-compatible version of the clinical note parser.
  Usage:

    const parsed = parseClinicalNote(rawText);

  The parser is deterministic, fast, and dependency‑free. It segments
  notes into sections, extracts vitals, labs, meds, allergies,
  diagnoses, procedures, imaging, and ECG snippets; normalizes units;
  and returns a strongly‑typed JSON result you can feed to your Cardiology
  Suite app.

  NOTE: This file depends on parserHelpers.js for shared utility functions.
  Make sure parserHelpers.js is loaded before this file.
*/

/* =========================== Main Export =========================== */
function parseClinicalNote(text) {
  const clean = normalizeWhitespace(text);
  const sections = segmentSections(clean);

  const metaDates = Array.from(findAllDatesISO(clean));
  const [patientAge, patientSex] = quickDemoMeta(clean);

  const vitals = extractVitals(clean, sections);
  const labs = extractLabs(clean, sections);
  const meds = extractMeds(clean, sections);
  const allergies = extractAllergies(clean, sections);
  const dx = extractDiagnoses(clean, sections);
  const imaging = extractImagingAndProcedures(clean, sections);
  const ecg = extractECG(clean, sections);
  const freeText = harvestFreeTextSignals(clean, {
    vitals,
    labs,
    meds,
    dx,
    imaging,
    ecg,
  });

  return {
    meta: { detectedDates: metaDates, patientAge, patientSex },
    sections,
    vitals,
    labs,
    medications: meds,
    allergies,
    diagnoses: dx,
    imaging,
    ecg,
    freeTextFindings: freeText,
  };
}

/* ========================= Section Segmentation ==================== */
const SECTION_HEADERS = [
  /^(assessment\s*&\s*plan|a\s*&\s*p)\b/i,
  /^assessment\b/i,
  /^plan\b/i,
  /^(history\s*of\s*present\s*illness|hpi)\b/i,
  /^(chief\s*complaint|cc)\b/i,
  /^(review\s*of\s*systems|ros)\b/i,
  /^(past\s*medical\s*history|pmh)\b/i,
  /^(past\s*surgical\s*history|psh)\b/i,
  /^(medications?|home\s*meds|current\s*meds)\b/i,
  /^(allerg(y|ies))\b/i,
  /^(family\s*history|fh)\b/i,
  /^(social\s*history|sh)\b/i,
  /^(physical\s*exam|pe|vital[s]?)\b/i,
  /^(labs?|laboratory\s*data|results)\b/i,
  /^(imaging|radiology|echo|ecg|ekg|studies|procedures?)\b/i,
  /^(diagnoses?|problem\s*list|impression)\b/i,
];

function segmentSections(text) {
  const lines = text.split(/\n+/);
  const map = { __full: text };
  let current = "__preamble";
  let buffer = [];

  const commit = () => {
    if (buffer.length) {
      map[current] =
        (map[current] ? map[current] + "\n" : "") + buffer.join("\n").trim();
      buffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    const header = SECTION_HEADERS.find((re) => re.test(line));
    if (header) {
      commit();
      current = normalizeHeader(line.match(header)[0]);
      map[current] = map[current] || "";
    } else {
      buffer.push(line);
    }
  }
  commit();
  return map;
}

function normalizeHeader(h) {
  const s = h.toLowerCase();
  if (/hpi/.test(s)) return "HPI";
  if (/chief/.test(s) || /cc/.test(s)) return "CC";
  if (/assessment/.test(s) && /plan/.test(s)) return "Assessment & Plan";
  if (/assessment/.test(s)) return "Assessment";
  if (/plan/.test(s)) return "Plan";
  if (/ros/.test(s)) return "ROS";
  if (/pmh/.test(s) || /past medical/.test(s)) return "PMH";
  if (/psh/.test(s) || /past surgical/.test(s)) return "PSH";
  if (/med/.test(s)) return "Medications";
  if (/allerg/.test(s)) return "Allergies";
  if (/family/.test(s)) return "FH";
  if (/social/.test(s)) return "SH";
  if (/physical/.test(s) || /vital/.test(s) || /^pe$/.test(s))
    return "Exam/Vitals";
  if (/labs?/.test(s) || /laboratory/.test(s) || /results/.test(s))
    return "Labs";
  if (/imaging|radiology|studies|echo/.test(s)) return "Imaging";
  if (/(ecg|ekg)/.test(s)) return "ECG";
  if (/diagnoses?|problem|impression/.test(s)) return "Diagnoses";
  return s.toUpperCase();
}

/* =========================== Meta helpers ========================= */
// normalizeWhitespace, findAllDatesISO, tryToISO are now provided by parserHelpers.js

function quickDemoMeta(text) {
  const age = /\b(\d{1,3})\s*-?\s*(yo|y\/o|years?\s*old)\b/i.exec(text)?.[1];
  const sex = /\b(male|female|man|woman|m|f)\b/i.exec(text)?.[1];
  return [age ? +age : undefined, sex ? sex[0].toUpperCase() : undefined];
}

/* ========================= Extraction: Vitals ====================== */
// extractVitals is now provided by parserHelpers.js

/* =========================== Extraction: Labs ====================== */
// extractLabs is now provided by parserHelpers.js

/* ========================= Extraction: Meds ======================== */
const MED_LINE =
  /^(?<name>[A-Za-z0-9()-/\s]+?)(?:\s+(?<dose>\d+(?:\.\d+)?\s*(mg|mcg|g|units?|u|meq|mL|ml)))?(?:\s+(?<route>IV|PO|IM|SC|SQ|PR|SL|Topical|Inhaled))?(?:\s+(?<freq>(daily|q\d+h|qhs|qam|bid|tid|qid|prn|q\d+|qod|weekly|monthly)[^\n]*))?/i;

const MED_FREQUENCY_MAP = {
  qhs: "at bedtime",
  qam: "each morning",
  bid: "twice daily",
  tid: "three times daily",
  qid: "four times daily",
};

function extractMeds(full, sections) {
  const source = sections["Medications"] || full;
  const meds = [];
  const lines = source
    .split(/\n/)
    .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean);

  for (const line of lines) {
    const m = MED_LINE.exec(line);
    if (!m) continue;
    const g = m.groups;
    const med = {
      name: toTitle(g.name),
      dose: g.dose?.replace(/\s+/g, " "),
      route: g.route,
      frequency: normalizeFreq(g.freq),
      prn: /\bprn\b/i.test(line) || undefined,
      raw: line,
    };
    meds.push(med);
  }
  return dedupeByKey(
    meds,
    (x) => `${x.name}|${x.dose}|${x.route}|${x.frequency}`,
  );
}

function normalizeFreq(s) {
  if (!s) return undefined;
  const lower = s.toLowerCase();
  for (const [k, v] of Object.entries(MED_FREQUENCY_MAP)) {
    if (new RegExp(`\\b${k}\\b`).test(lower)) return v;
  }
  return s.trim();
}

/* ======================= Extraction: Allergies ===================== */
// extractAllergies is now provided by parserHelpers.js

/* ================== Extraction: Diagnoses / Problem List =========== */
// extractDiagnoses is now provided by parserHelpers.js

/* =========== Extraction: Imaging, Procedures, Echo, Cath, etc. ===== */
const IMG_PROC_PATTERNS = [
  /\b(CTA\s*Chest|CT\s*Chest|CXR|Chest\s*X-?ray|Echo|Echocardiogram|TTE|TEE|MRI|MRA|V\/Q|Cath|Cardiac\s*Cath|PCI|Stent|CABG|TAVR|Watchman|Amulet|TCAR)\b[^\n]*/gi,
];

function extractImagingAndProcedures(full, sections) {
  const source = sections["Imaging"] || sections["Procedures"] || full;
  const out = [];
  for (const re of IMG_PROC_PATTERNS) {
    // Use matchAll with global flag to prevent infinite loops
    const globalRe = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    for (const m of source.matchAll(globalRe)) {
      const raw = m[0].trim();
      const type = detectImagingType(raw);
      const date = firstISO(raw);
      const findings = cleanAfterColon(raw);
      const result = summarizeFinding(raw);
      out.push({ type, date, findings, result, raw });
    }
  }
  return dedupeByKey(out, (x) => `${x.type}|${x.date}|${x.findings}`);
}

function detectImagingType(line) {
  const lower = line.toLowerCase();
  if (/(\btee\b|transesophageal)/.test(lower)) return "TEE";
  if (/(\btte\b|transthoracic|echo)/.test(lower)) return "Echo";
  if (/cath|pci|stent/.test(lower))
    return /tavr|watchman|amulet|tcar/.test(lower) ? "Procedure" : "Cath/PCI";
  if (/cta|ct\s*chest/.test(lower)) return "CTA Chest";
  if (/\bcxr\b|x-?ray/.test(lower)) return "CXR";
  if (/mri|mra/.test(lower)) return "MRI/MRA";
  if (/v\/?q/.test(lower)) return "V/Q";
  return "Study";
}

/* =============================== ECG =============================== */
const ECG_LINE =
  /(EKG|ECG).*?(?:rate\s*(?<rate>\d{2,3}))?.*?(?<rhythm>NSR|AF(?:ib)?|AFL|SVT|VT|JR|SB|ST|Sinus\s*(brady|tachy)cardia)?[^\n]*?(?<block>RBBB|LBBB|2\s*°?\s*AV\s*Block\s*(?:Mobitz\s*I|Mobitz\s*II)?|1\s*°|3\s*°)?[^\n]*?(?<stt>ST[^\n]*|T-?wave[^\n]*)?/i;

function extractECG(full, sections) {
  const source = sections["ECG"] || full;
  const out = [];
  const lines = source
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const line of lines) {
    const m = ECG_LINE.exec(line);
    if (!m) continue;
    const g = m.groups;
    const rate = g.rate ? Number(g.rate) : undefined;
    const rhythm = g.rhythm
      ? g.rhythm.replace(/Sinus\s*/i, "Sinus ")
      : undefined;
    const conduction = g.block?.replace(/\s+/g, " ");
    const date = firstISO(line);
    const stt = g.stt?.replace(/\s+/g, " ").trim();
    out.push({ date, rate, rhythm, conduction, stt, raw: line });
  }
  return dedupeByKey(
    out,
    (x) => `${x.date}|${x.rate}|${x.rhythm}|${x.conduction}`,
  );
}

/* ========================= Free‑text harvesting ==================== */
function harvestFreeTextSignals(full) {
  const signals = [];
  const lines = full.split(/\n/);

  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;
    const looksImportant =
      /shock|sepsis|stroke|arrest|hypotension|syncope|tamponade|dissection|STEMI|NSTEMI|decompensated|ICD|CRT|EF\s*\d{1,3}%/i.test(
        s,
      );
    if (looksImportant) signals.push(s);
  }
  return dedupe(signals).slice(0, 50);
}

/* =========================== Small helpers ======================== */
// cToF, lbToKg, round, toTitle, toSentenceCase are now provided by parserHelpers.js

function cleanAfterColon(s) {
  const i = s.indexOf(":");
  if (i === -1) return undefined;
  return s.slice(i + 1).trim();
}

function summarizeFinding(s) {
  const ef = /\b(EF|LVEF)\s*(\d{1,3})\s*%/i.exec(s)?.[2];
  if (ef) return `LVEF ${ef}%`;
  const pe = /pulmonary\s*edema|pleural\s*effusions?/i.test(s)
    ? "Pulmonary edema/pleural effusions"
    : undefined;
  return pe;
}

// Helper function for normalizing lab flags - kept for potential future use
// eslint-disable-next-line no-unused-vars
function flagNormalize(f) {
  if (/h|↑|\*/i.test(f)) return "↑";
  if (/l|↓/i.test(f)) return "↓";
  return "";
}

// firstISO, dedupe, dedupeByKey, dedupeByJSON are now provided by parserHelpers.js

/* ============================ Exports: utils ======================= */
const ParserUtils = {
  normalizeWhitespace,
  segmentSections,
  toTitle,
  toSentenceCase,
};

/* ========================== Extendable Patterns ==================== */
// Add/override aliases to improve recall for your corpus.
// Note: VITAL_ALIASES is now defined in parserHelpers.js within extractVitals()
const EXTENSIBILITY = {
  MED_FREQUENCY_MAP,
};

/* =========================== Note Regenerator ======================= */
function regenerateCardiologyNote(parsed) {
  const sections = [];

  // HPI - Rewrite in own words, end with why cardiology consulted
  const hpi = rewriteHPI(
    parsed.hpi ||
      parsed.sections?.["History of Present Illness"] ||
      parsed.sections?.["HPI"] ||
      "No HPI available",
  );
  sections.push(`HPI\n${hpi}`);

  // PMH
  const pmh = formatList(
    parsed.pmh ||
      listify(
        parsed.sections?.["Past Medical History"] || parsed.sections?.["PMH"],
      ) || ["No significant PMH documented"],
  );
  sections.push(`PMH\n${pmh}`);

  // PSH
  const psh = formatList(
    parsed.psh ||
      listify(
        parsed.sections?.["Past Surgical History"] || parsed.sections?.["PSH"],
      ) || ["No significant PSH documented"],
  );
  sections.push(`PSH\n${psh}`);

  // Family Hx
  const fh = formatList(
    parsed.familyHistory ||
      listify(
        parsed.sections?.["Family History"] || parsed.sections?.["FH"],
      ) || ["No significant family history documented"],
  );
  sections.push(`Family Hx\n${fh}`);

  // Previous cardiac diagnostic testing
  const cardiacTesting = formatCardiacTesting(
    parsed.priorStudies || [],
    parsed.imaging || [],
  );
  sections.push(`Previous cardiac diagnostic testing\n${cardiacTesting}`);

  // Previous 12 lead EKG results
  const ekgResults = formatEKGResults(parsed.ecg || []);
  sections.push(`Previous 12 lead EKG results\n${ekgResults}`);

  // Assessment
  const assessment = synthesizeAssessment(parsed);
  sections.push(`Assessment\n${assessment}`);

  // Plan
  const plan = generateEvidenceBasedPlan(parsed);
  sections.push(`Plan\n${plan}`);

  return sections.join("\n\n");
}

function rewriteHPI(originalHpi) {
  if (!originalHpi || originalHpi === "No HPI available") {
    return "Patient presents for cardiology evaluation. Specific history of present illness not available.";
  }

  // Extract key elements from original HPI
  const ageMatch = originalHpi.match(/(\d{1,3})\s*(?:yo|y\/o|years?\s*old)/i);
  const age = ageMatch ? ageMatch[1] : null;

  const genderMatch = originalHpi.match(/\b(male|female|man|woman|m|f)\b/i);
  const gender = genderMatch ? genderMatch[1].toLowerCase() : null;

  // Look for chief complaint/symptoms
  const symptoms = [];
  if (originalHpi.toLowerCase().includes("chest pain"))
    symptoms.push("chest pain");
  if (
    originalHpi.toLowerCase().includes("shortness of breath") ||
    originalHpi.toLowerCase().includes("sob")
  )
    symptoms.push("shortness of breath");
  if (originalHpi.toLowerCase().includes("palpitations"))
    symptoms.push("palpitations");
  if (
    originalHpi.toLowerCase().includes("syncope") ||
    originalHpi.toLowerCase().includes("dizziness")
  )
    symptoms.push("syncope/dizziness");
  if (originalHpi.toLowerCase().includes("edema")) symptoms.push("edema");

  // Look for duration
  const durationMatch = originalHpi.match(/(\d+)\s*(?:day|week|month|year)s?/i);
  const duration = durationMatch
    ? `${durationMatch[1]} ${durationMatch[2]}s`
    : null;

  // Look for cardiac history
  const cardiacHx =
    originalHpi.toLowerCase().includes("cad") ||
    originalHpi.toLowerCase().includes("coronary") ||
    originalHpi.toLowerCase().includes("mi") ||
    originalHpi.toLowerCase().includes("heart attack") ||
    originalHpi.toLowerCase().includes("cabg") ||
    originalHpi.toLowerCase().includes("stent");

  // Rewrite in own words
  let rewritten = "";
  if (age && gender) {
    rewritten += `${age}-year-old ${gender} `;
  } else {
    rewritten += "Patient ";
  }

  if (symptoms.length > 0) {
    rewritten += `presents with ${symptoms.join(", ")}`;
    if (duration) {
      rewritten += ` for ${duration}`;
    }
    rewritten += ". ";
  } else {
    rewritten += "presents for cardiac evaluation. ";
  }

  if (cardiacHx) {
    rewritten +=
      "Patient has known cardiac history including coronary artery disease. ";
  }

  rewritten += "Referred for cardiology consultation.";

  return rewritten;
}

function formatList(items) {
  if (!items || items.length === 0) return "None documented";
  return items
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(", ");
}

function formatCardiacTesting(priorStudies, imaging) {
  const allTests = [...priorStudies, ...imaging];
  if (allTests.length === 0) return "No prior cardiac testing documented";

  // Sort by date (most recent first) and filter for cardiac-relevant tests
  const cardiacTests = allTests
    .filter((test) => isCardiacTest(test.type || test.modality || ""))
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Most recent first
    })
    .slice(0, 5); // Top 5 most recent/relevant

  if (cardiacTests.length === 0)
    return "No cardiac-specific testing documented";

  return cardiacTests
    .map((test) => {
      const date = test.date ? formatDate(test.date) : "date unknown";
      const type = test.type || test.modality || "Unknown test";
      const findings = test.result || test.findings || "results not specified";
      return `${type} ${date}: ${findings}`;
    })
    .join("\n");
}

function isCardiacTest(testType) {
  const cardiacTests = [
    "echo",
    "tte",
    "tee",
    "stress",
    "mpi",
    "nuclear",
    "cath",
    "lhc",
    "rhc",
    "angiogram",
    "coronary",
    "cardiac",
    "ecg",
    "ekg",
    "holter",
    "event monitor",
  ];
  return cardiacTests.some((test) => testType.toLowerCase().includes(test));
}

function formatEKGResults(ecgFindings) {
  if (!ecgFindings || ecgFindings.length === 0)
    return "No EKG results documented";

  // Get most recent EKG
  const mostRecent = ecgFindings
    .filter((ekg) => ekg.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (!mostRecent) return "EKG performed but details not specified";

  const date = mostRecent.date ? formatDate(mostRecent.date) : "date unknown";
  const rate = mostRecent.rate
    ? `${mostRecent.rate} bpm`
    : "rate not specified";
  const rhythm = mostRecent.rhythm || "rhythm not specified";
  const conduction = mostRecent.conduction || "";
  const stt = mostRecent.stt || "";

  let result = `${date}: ${rhythm} at ${rate}`;
  if (conduction) result += `, ${conduction}`;
  if (stt) result += `, ${stt}`;

  return result;
}

function synthesizeAssessment(parsed) {
  const diagnoses = parsed.diagnoses || [];
  const pmh = parsed.pmh || [];
  const imaging = parsed.imaging || [];
  // labs and ecg would be used for more detailed assessment but not in this version

  const problems = [];

  // Extract from explicit diagnoses
  diagnoses.forEach((dx) => {
    if (
      dx.toLowerCase().includes("heart failure") ||
      dx.toLowerCase().includes("hf")
    ) {
      const efMatch =
        dx.match(/ef\s*(\d+)%/i) ||
        imaging
          .find((img) => img.result?.includes("EF"))
          ?.result?.match(/ef\s*(\d+)%/i);
      if (efMatch && efMatch[1]) {
        problems.push(`HFrEF (EF ${efMatch[1]}%)`);
      } else {
        problems.push("Heart failure");
      }
    }
    if (
      dx.toLowerCase().includes("atrial fibrillation") ||
      dx.toLowerCase().includes("afib") ||
      dx.toLowerCase().includes("af")
    ) {
      problems.push("Atrial fibrillation");
    }
    if (
      dx.toLowerCase().includes("aortic stenosis") ||
      dx.toLowerCase().includes("as")
    ) {
      problems.push("Aortic stenosis");
    }
    if (
      dx.toLowerCase().includes("coronary artery disease") ||
      dx.toLowerCase().includes("cad")
    ) {
      problems.push("Coronary artery disease");
    }
  });

  // Extract from PMH
  pmh.forEach((condition) => {
    if (
      condition.toLowerCase().includes("hypertension") ||
      condition.toLowerCase().includes("htn")
    ) {
      problems.push("Hypertension");
    }
    if (
      condition.toLowerCase().includes("diabetes") ||
      condition.toLowerCase().includes("dm")
    ) {
      problems.push("Diabetes mellitus");
    }
    if (
      condition.toLowerCase().includes("hyperlipidemia") ||
      condition.toLowerCase().includes("hld")
    ) {
      problems.push("Hyperlipidemia");
    }
  });

  // Extract from imaging/ECG
  imaging.forEach((img) => {
    if (img.result?.includes("EF")) {
      const efMatch = img.result.match(/ef\s*(\d+)%/i);
      if (efMatch && efMatch[1]) {
        const ef = parseInt(efMatch[1]);
        if (ef < 40) problems.push(`Severe LV dysfunction (EF ${ef}%)`);
        else if (ef < 50) problems.push(`Moderate LV dysfunction (EF ${ef}%)`);
      }
    }
  });

  return problems.length > 0
    ? problems.join("; ")
    : "Cardiac evaluation - specific diagnoses to be determined";
}

function generateEvidenceBasedPlan(parsed) {
  const assessment = synthesizeAssessment(parsed);
  const problems = assessment.split("; ").map((p) => p.trim());

  const planItems = [];

  // Generate plan based on identified problems
  if (
    problems.some((p) => p.includes("Heart failure") || p.includes("HFrEF"))
  ) {
    planItems.push(
      "Optimize heart failure therapy with GDMT (ACEI/ARB/ARNI, beta-blocker, MRA as indicated)",
    );
    planItems.push("Monitor renal function and electrolytes");
  }

  if (problems.some((p) => p.includes("Atrial fibrillation"))) {
    planItems.push("Anticoagulation therapy based on CHA2DS2-VASc score");
    planItems.push("Rate vs rhythm control strategy");
  }

  if (problems.some((p) => p.includes("Aortic stenosis"))) {
    planItems.push("Serial echocardiography for progression");
    planItems.push("Symptom monitoring and surgical evaluation as indicated");
  }

  if (problems.some((p) => p.includes("Coronary artery disease"))) {
    planItems.push("Anti-ischemic therapy optimization");
    planItems.push("Risk factor modification");
  }

  if (problems.some((p) => p.includes("Hypertension"))) {
    planItems.push("Blood pressure optimization per guidelines");
  }

  if (problems.some((p) => p.includes("Diabetes"))) {
    planItems.push("Glycemic control and cardiovascular risk reduction");
  }

  if (planItems.length === 0) {
    planItems.push("Comprehensive cardiac evaluation");
    planItems.push("Risk factor assessment and optimization");
    planItems.push("Further diagnostic testing as indicated");
  }

  return planItems.join("\n");
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Make functions available globally for browser usage
if (typeof window !== "undefined") {
  window.parseClinicalNote = parseClinicalNote;
  window.regenerateCardiologyNote = regenerateCardiologyNote;
  window.ParserUtils = ParserUtils;
  window.EXTENSIBILITY = EXTENSIBILITY;
}
