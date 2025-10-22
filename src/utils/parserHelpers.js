/* eslint-env browser */
/*
  parserHelpers.js — Shared Parser Utility Functions
  -------------------------------------------------------------------
  Consolidates common parsing functions used across multiple files:
  - noteParser.js
  - noteParser_full.js
  - app.js

  This file should be loaded before any parsers that depend on it.
*/

/* ========================= Text Normalization ========================= */

/**
 * Normalize whitespace in text for consistent parsing
 * @param {string} s - Input text
 * @returns {string} Normalized text
 */
function normalizeWhitespace(s) {
  if (!s) return '';
  return s
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ========================= Essential Helper Functions ========================= */

// extractVitals function defined below

// extractAllergies function defined below

// extractDiagnoses function defined below

// findAllDatesISO function defined below

function dedupeByKey(arr, keyFn) {
  const seen = new Set();
  return arr.filter(item => {
    const keyValue = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
}

function toTitle(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// firstISO function defined below

function dedupe(arr) {
  return [...new Set(arr)];
}

function dedupeByJSON(arr) {
  const seen = new Set();
  return arr.filter(item => {
    const json = JSON.stringify(item);
    if (seen.has(json)) {
      return false;
    }
    seen.add(json);
    return true;
  });
}

function toSentenceCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function listify(text) {
  if (!text) return [];
  return text.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);
}

/* ========================= Date Extraction ========================= */

/**
 * Find all ISO-formatted dates in text
 * @param {string} s - Input text
 * @yields {string} ISO date strings
 */
function* findAllDatesISO(s) {
  // Find forms like 08/27/2025, 2025-08-27, Aug 27 2025, 27 Aug 2025, etc.
  const patterns = [
    /\b(20\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])\b/g, // ISO
    /\b(0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])[-/](20\d{2})\b/g, // MM/DD/YYYY
    /\b(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\w*[,\s]+(20\d{2})\b/gi,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\w*\s*(\d{1,2})[,\s]+(20\d{2})\b/gi
  ];
  for (const re of patterns) {
    // Patterns already have 'g' flag, safe for matchAll
    for (const m of s.matchAll(re)) {
      const iso = tryToISO(m[0]);
      if (iso) yield iso;
    }
  }
}

/**
 * Try to convert a date string to ISO format
 * @param {string} raw - Raw date string
 * @returns {string|null} ISO date string or null
 */
function tryToISO(raw) {
  const d = new Date(raw);
  return isNaN(+d) ? null : d.toISOString();
}

/**
 * Get first ISO date from text
 * @param {string} s - Input text
 * @returns {string|undefined} First ISO date or undefined
 */
function firstISO(s) {
  for (const iso of findAllDatesISO(s)) return iso;
  return undefined;
}

/* ========================= Vitals Extraction ========================= */

/**
 * Ensure a regex has the global flag to prevent infinite loops in matchAll
 * @param {RegExp} re - Regular expression
 * @returns {RegExp} RegExp with global flag added
 */
function withGlobal(re) {
  return new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
}

/**
 * SpO2 patterns - try % first, then room air variant
 */
const SPO2_PERCENT = /\b(spo2|o2\s*sat(?:uration)?)[:\s]*(\d{2,3})\s*%/i;
const SPO2_ROOM_AIR = /\b(spo2|o2\s*sat(?:uration)?)[:\s]*(\d{2,3})\s*(?:on\s*)?(?:room\s*air|ra)\b/i;

/**
 * Extract SpO2, avoiding oxygen flow false positives
 * @param {string} source - Text to search
 * @returns {Array} Array of SpO2 objects
 */
function extractSpO2(source) {
  const found = [];

  // Try % pattern first
  for (const m of source.matchAll(withGlobal(SPO2_PERCENT))) {
    const value = Number(m[2]);
    if (value >= 50 && value <= 100) { // Sanity check
      found.push({ name: "SpO2", value, unit: "%", raw: m[0] });
    }
  }

  // Try room air variant if no % matches
  if (found.length === 0) {
    for (const m of source.matchAll(withGlobal(SPO2_ROOM_AIR))) {
      const value = Number(m[2]);
      if (value >= 50 && value <= 100) {
        found.push({ name: "SpO2", value, unit: "% (RA)", raw: m[0] });
      }
    }
  }

  return found;
}

/**
 * Extract vital signs from clinical text
 * @param {string} full - Full text to search
 * @param {Object} sections - Optional section map
 * @returns {Array} Array of vital sign objects
 */
function extractVitals(full, sections) {
  const VITAL_ALIASES = {
    temperature: [/\btemp(erature)?\b[:-]?\s*(\d{2,3}(?:\.\d)?)\s*(f|c)?\b/i],
    heartRate: [/\b(hr|heart\s*rate|pulse)\b[:-]?\s*(\d{2,3})\b/i],
    // Accept both "RR"/"respiratory rate" and shorthand "Resp" forms
    respiratoryRate: [/\b(rr|resp(iratory)?\s*rate)\b[:-]?\s*(\d{1,2})\b/i, /\b(resp)\b[:-]?\s*(\d{1,2})\b/i],
    bloodPressure: [/\b(bp|blood\s*pressure)\b[:-]?\s*(\d{2,3})\s*[/-]\s*(\d{2,3})\b/i],
    weight: [/\b(wt|weight)\b[:-]?\s*(\d{2,3}(?:\.\d)?)\s*(kg|lb|lbs)?\b/i],
    height: [/\b(ht|height)\b[:-]?\s*(\d(?:'|ft)\s*\d{1,2}(?:"|in)?)\b/i, /\b(ht|height)\b[:-]?\s*(\d{3})\s*cm\b/i],
  };

  const source = sections ? (sections["Exam/Vitals"] || sections["__full"] || full) : full;
  const found = [];

  for (const [name, patterns] of Object.entries(VITAL_ALIASES)) {
    for (const re of patterns) {
      // Use withGlobal helper with matchAll to prevent infinite loops
      for (const m of source.matchAll(withGlobal(re))) {
        const raw = m[0];
        switch (name) {
          case "bloodPressure":
            found.push({ name: "BP", value: `${m[2]}/${m[3]}`, raw });
            break;
          case "heartRate":
            found.push({ name: "HR", value: Number(m[2]), unit: "bpm", raw });
            break;
          case "respiratoryRate":
            found.push({ name: "RR", value: Number(m[3] || m[2]), unit: "/min", raw });
            break;
          case "temperature": {
            const unit = (m[3]?.toUpperCase()) || "F";
            const v = Number(m[2]);
            const val = unit === "C" ? cToF(v) : v;
            found.push({ name: "Temp", value: round(val, 1), unit: "F", raw });
            break;
          }
          case "weight": {
            const unit = (m[3]?.toLowerCase()) || "lb";
            const v = Number(m[2]);
            const kg = unit.startsWith("kg") ? v : lbToKg(v);
            found.push({ name: "Weight", value: round(kg, 1), unit: "kg", raw });
            break;
          }
          case "height": {
            const val = m[2];
            found.push({ name: "Height", value: val, raw });
            break;
          }
        }
      }
    }
  }

  // Extract SpO2 separately with improved patterns
  found.push(...extractSpO2(source));

  return dedupeByJSON(found);
}

/* ========================= Labs Extraction ========================= */

/**
 * Normalize lab text
 */
function normalizeLabText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Non-lab headers to skip
 */
const NON_LAB_HEADERS = /^(date|time|dob|mrn|patient|name|id|collected|drawn|reported|result|test\s*name|component|status)[\s:]/i;

/**
 * Coerce flag to standard format
 */
function coerceFlag(flag) {
  if (!flag) return null;
  const upper = flag.toUpperCase();
  if (upper.includes('HIGH') || upper.includes('H') || upper.includes('↑') || upper.includes('*')) {
    return '(H)';
  }
  if (upper.includes('LOW') || upper.includes('L') || upper.includes('↓')) {
    return '(L)';
  }
  return null;
}

/**
 * Lab unit patterns - non-capturing alternation for complex units
 */
const UNIT = String.raw`(?:pg/mL|ng/mL|mg/dL|g/dL|mEq/L|mmol/L|U/L|IU/L|uIU/mL|x10\^3/uL|x10\^9/L|%|bpm|mmHg|sec|seconds?|min|minutes?|mg|mcg|ng|pg|g|dL|mL|L|uL)`;

/**
 * Lab patterns - named groups with String.raw
 * Combo: name1/name2 with [^/:=] to exclude separator chars
 */
const LAB_COMBO = new RegExp(String.raw`^(?<name1>[A-Za-z][A-Za-z0-9+\-\s().]{1,20}?)\s*/\s*(?<name2>[A-Za-z][A-Za-z0-9+\-\s().]{1,20}?)\s*[:=]\s*(?<val1>\d+(?:\.\d+)?)\s*/\s*(?<val2>\d+(?:\.\d+)?)(?:\s*(?<unit>${UNIT}))?`, 'i');
const LAB_LINE = new RegExp(String.raw`^(?<name>[A-Za-z][^:=\n]{1,40}?)\s*[:=]\s*(?<value>[<>]?\d+(?:\.\d+)?)(?:\s*(?<unit>${UNIT}))?(?:\s*[\[(]?(?<refRange>[\d.\s–-]+)[\])])?(?:\s*(?<flag>High|Low|H|L|↑|↓|\*))?`, 'i');


/**
 * Lab name allowlist - regex with word boundaries
 */
const LAB_ALLOW_RE = /\b(troponin?|trop|bnp|nt-?pro\s*bnp|pro\s*bnp|creatinine|creat|cr|bun|potassium|k\+?|sodium|na\+?|chloride|cl-?|co2|bicarb|hco3|glucose|glu|hemoglobin|hgb|hb|hematocrit|hct|wbc|platelets?|plt|magnesium|mg|calcium|ca|alt|ast|alk\s*phos|alp|bilirubin|bili|a1c|hba1c|tsh|inr|pt\b|ptt|aptt|ldl|hdl|triglycerides?|cholesterol|egfr|albumin|protein)\b/i;

/**
 * Check if lab name is in allowlist
 * @param {string} name - Lab name
 * @returns {boolean} True if allowed
 */
function isAllowedLab(name) {
  if (!name) return false;
  return LAB_ALLOW_RE.test(name.trim());
}

/**
 * Extract labs from clinical text
 * @param {string} full - Full text to search
 * @param {Object} sections - Optional section map
 * @returns {Array} Array of lab objects
 */
function extractLabs(full, sections) {
  const source = (sections && sections["Labs"]) || (sections && sections["Laboratory Results"]) || full;

  const labs = [];
  const lines = source.split(/\n/).map(s => normalizeLabText(s)).filter(Boolean);

  for (const line of lines) {
    // Skip non-lab headers
    if (NON_LAB_HEADERS.test(line)) {
      continue;
    }

    // Skip date-like lines (MM/DD/YYYY)
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line)) {
      continue;
    }

    // NEW: Accept space-separated form e.g. "Sodium 139" or "eGFR >60"
    const LAB_SPACE = new RegExp(String.raw`^(?<name>[A-Za-z][A-Za-z0-9+\-\s().]{1,40}?)\s+(?<value>[<>]?\d+(?:\.\d+)?)(?:\s*(?<unit>${UNIT}))?(?:\s*(?<flag>High|Low|H|L|↑|↓|\*))?`, 'i');
    const s = LAB_SPACE.exec(line);
    if (s && s.groups && s.groups.name && isAllowedLab(s.groups.name)) {
      const { name, value, unit, flag } = s.groups;
      const numericValue = Number(value);
      const lab = {
        name: name.trim(),
        value: Number.isNaN(numericValue) ? value : numericValue,
        unit: unit?.trim() || undefined,
        raw: line,
      };
      const flagIndicator = coerceFlag(flag);
      if (flagIndicator) {
        lab.value = `${lab.value} ${flagIndicator}`;
      }
      labs.push(lab);
      continue;
    }

    // Try combo format first (AST/ALT: 20/30 U/L)
    const c = LAB_COMBO.exec(line);
    if (c && c.groups) {
      const { name1, name2, val1, val2, unit } = c.groups;

      // Only add if in allowlist
      if (isAllowedLab(name1)) {
        labs.push({
          name: name1.trim(),
          value: Number(val1),
          unit: unit?.trim() || undefined,
          raw: line
        });
      }

      if (isAllowedLab(name2)) {
        labs.push({
          name: name2.trim(),
          value: Number(val2),
          unit: unit?.trim() || undefined,
          raw: line
        });
      }
      continue;
    }

    // Try single lab format
    const m = LAB_LINE.exec(line);
    if (!m || !m.groups) {
      continue;
    }

    const { name, value, unit, refRange, flag } = m.groups;

    // Skip if not in allowlist
    if (!name || !isAllowedLab(name)) {
      continue;
    }

    const numericValue = Number(value);
    const lab = {
      name: name.trim(),
      value: Number.isNaN(numericValue) ? value : numericValue,
      unit: unit?.trim() || undefined,
      refRange: refRange?.trim() || undefined,
      raw: line,
    };

    // Add flag indicator using coerceFlag
    const flagIndicator = coerceFlag(flag);
    if (flagIndicator) {
      lab.value = `${lab.value} ${flagIndicator}`;
    }

    labs.push(lab);
  }

  return dedupeByKey(labs, (x) => `${x.name}|${x.value}`);
}

/* ========================= Allergies Extraction ========================= */

/**
 * Extract allergies from clinical text
 * This is the most comprehensive version from noteParser.js
 * @param {string} full - Full text to search
 * @param {Object} sections - Optional section map
 * @returns {Array} Array of allergy objects
 */
function extractAllergies(full, sections) {
  const ALLERGY_LINE = /^(allerg(?:y|ies))?\s*[:-]?\s*(?<sub>[A-Za-z0-9\s-/]+?)(?:\s*[-:–]\s*(?<rxn>[A-Za-z\s]+))?$/i;

  const source = sections ? (sections["Allergies"] || full) : full;
  const out = [];
  const lines = source.split(/\n/).map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim()).filter(Boolean);

  for (const line of lines) {
    const m = ALLERGY_LINE.exec(line);
    if (!m) continue;
    const { sub, rxn } = m.groups;
    if (/none|nkda|nka|no known/i.test(line)) continue;
    out.push({ substance: toTitle(sub), reaction: rxn?.trim(), raw: line });
  }
  return dedupeByKey(out, (x) => x.substance.toLowerCase());
}

/* ========================= Diagnoses Extraction ========================= */

/**
 * Extract diagnoses from clinical text
 * @param {string} full - Full text to search
 * @param {Object} sections - Optional section map
 * @returns {Array} Array of diagnosis strings
 */
function extractDiagnoses(full, sections) {
  const source = sections ?
    (sections["Diagnoses"] || sections["Assessment"] || sections["Assessment & Plan"] || sections["Impression List / Diagnoses"] || sections["Impression and Plan"] || full)
    : full;

  // Handle both string and non-string sources
  if (!source) return [];

  const lines = (typeof source === 'string' ? source : String(source))
    .split(/\n/)
    .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim());

  const dx = lines
    .filter((s) => s.length > 2 && /[A-Za-z]/.test(s))
    .map((s) => s.replace(/\s*\.*$/, ""))
    .map(toSentenceCase);

  return dedupe(dx);
}

/* ========================= Helper Functions ========================= */

/**
 * Convert Celsius to Fahrenheit
 * @param {number} c - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
function cToF(c) {
  return c * 9/5 + 32;
}

/**
 * Convert pounds to kilograms
 * @param {number} lb - Weight in pounds
 * @returns {number} Weight in kilograms
 */
function lbToKg(lb) {
  return lb * 0.45359237;
}

/**
 * Round number to specified precision
 * @param {number} n - Number to round
 * @param {number} p - Decimal places (default 2)
 * @returns {number} Rounded number
 */
function round(n, p = 2) {
  const f = Math.pow(10, p);
  return Math.round(n * f) / f;
}


/**
 * Get text after colon in a string
 * @param {string} s - Input string
 * @returns {string|undefined} Text after colon or undefined
 */
function afterColon(s) {
  const i = s.indexOf(':');
  return i >= 0 ? s.slice(i + 1).trim() : undefined;
}

/* ========================= Browser Compatibility ========================= */

// Make functions available globally for browser usage
if (typeof window !== 'undefined') {
  // Export as a single namespace object
  window.ParserHelpers = {
    normalizeWhitespace,
    findAllDatesISO,
    tryToISO,
    firstISO,
    extractVitals,
    extractLabs,
    extractAllergies,
    extractDiagnoses,
    cToF,
    lbToKg,
    round,
    toTitle,
    toSentenceCase,
    dedupe,
    dedupeByKey,
    dedupeByJSON,
    afterColon
  };

  // Also expose individual functions globally for backward compatibility
  window.normalizeWhitespace = normalizeWhitespace;
  window.findAllDatesISO = findAllDatesISO;
  window.tryToISO = tryToISO;
  window.firstISO = firstISO;
  window.extractVitals = extractVitals;
  window.extractLabs = extractLabs;
  window.extractAllergies = extractAllergies;
  window.extractDiagnoses = extractDiagnoses;
  window.cToF = cToF;
  window.lbToKg = lbToKg;
  window.round = round;
  window.toTitle = toTitle;
  window.toSentenceCase = toSentenceCase;
  window.dedupe = dedupe;
  window.dedupeByKey = dedupeByKey;
  window.dedupeByJSON = dedupeByJSON;
  window.afterColon = afterColon;
}

/* ========================= Module Exports (Node.js) ========================= */

// Uncomment for Node.js/ES module usage
// export {
//   normalizeWhitespace,
//   findAllDatesISO,
//   tryToISO,
//   firstISO,
//   extractVitals,
//   extractAllergies,
//   extractDiagnoses,
//   cToF,
//   lbToKg,
//   round,
//   toTitle,
// Make functions available globally for browser usage (duplicate block for compatibility)
if (typeof window !== 'undefined') {
  window.normalizeWhitespace = normalizeWhitespace;
  window.extractVitals = extractVitals;
  window.extractLabs = extractLabs;
  window.extractAllergies = extractAllergies;
  window.extractDiagnoses = extractDiagnoses;
  window.findAllDatesISO = findAllDatesISO;
  window.dedupeByKey = dedupeByKey;
  window.toTitle = toTitle;
  window.firstISO = firstISO;
  window.dedupe = dedupe;
  window.toSentenceCase = toSentenceCase;
  window.listify = listify;
}
