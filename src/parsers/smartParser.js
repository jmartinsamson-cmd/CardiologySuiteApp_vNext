/**
 * Smart Fault-Tolerant Parser
 * Implements: normalize → detectSections → extractEntities → validateSchema → mapToTemplate
 */

import { normalize, extractDates } from "./normalize.js";
import { SIGNAL_WORDS, scoreMatch } from "./synonyms.js";
import {
  extractVitals,
  extractMeds,
  extractAllergies,
  extractDiagnoses,
  extractProvider,
  extractDemographics,
  extractLabs,
} from "./entityExtraction.js";

/**
 * @typedef {Object} ParseResult
 * @property {Object} data - Parsed structured data
 * @property {string[]} warnings - List of parsing warnings
 * @property {number} confidence - Confidence score 0..1
 * @property {Object} raw - Raw sections before mapping
 * @property {string[]} [assessment] - Optional AI-generated assessment points
 * @property {string[]} [plan] - Optional AI-generated plan items
 * @property {Array<{title?: string, url?: string, blob?: number[], mime?: string}>} [citations] - Optional citations
 */

/**
 * Parse clinical note with fault tolerance
 * @param {string} rawText - Raw note text
 * @returns {ParseResult}
 */
export function parseNote(rawText) {
  const startTime = Date.now();
  const warnings = [];

  // STAGE 1: Normalize
  const normalized = normalize(rawText);
  if (!normalized) {
    return {
      data: {},
      warnings: ["Empty or invalid input"],
      confidence: 0,
      raw: { sections: {} },
    };
  }

  // STAGE 2: Detect sections
  const { sections, sectionWarnings } = detectSections(normalized);
  warnings.push(...sectionWarnings);

  // STAGE 3: Extract entities
  const entities = extractEntities(sections, normalized);

  // STAGE 4: Validate schema
  const { data, schemaWarnings } = validateSchema(entities);
  warnings.push(...schemaWarnings);

  // STAGE 5: Calculate confidence
  const confidence = calculateConfidence(data, warnings, sections);

  const duration = Date.now() - startTime;
  console.log(
    `parse: conf=${confidence.toFixed(2)} sections=${Object.keys(sections).length} warnings=${warnings.length} (${duration}ms)`,
  );

  return {
    data,
    warnings,
    confidence,
    raw: { sections },
  };
}

/**
 * Detect sections using header-first strategy with fallbacks
 * @param {string} text - Normalized text
 * @returns {{sections: Record<string, string>, sectionWarnings: string[]}} sections object and warnings
 */
function detectSections(text) {
  /** @type {Record<string, string>} */
  const sections = {};
  /** @type {string[]} */
  const warnings = [];

  // Strategy 1: Header-first (explicit section headers)
  const headerMatches = detectByHeaders(text);

  if (Object.keys(headerMatches).length >= 2) {
    Object.assign(sections, headerMatches);
  } else {
    warnings.push("Few explicit headers found; using fallback strategies");

    // Strategy 2: Signal words
    const signalMatches = detectBySignals(text);
    Object.assign(sections, signalMatches);

    // Strategy 3: Layout heuristics
    const layoutMatches = detectByLayout(text);
    for (const [key, value] of Object.entries(layoutMatches)) {
      if (!sections[key]) {
        sections[key] = value;
      }
    }
  }

  return { sections, sectionWarnings: warnings };
}

/**
 * Detect sections by explicit headers
 * @param {string} text
 * @returns {Record<string, string>} Canonical section name -> content
 */
function detectByHeaders(text) {
  /** @type {Record<string, string>} */
  const sections = {};
  const lines = text.split("\n");

  let currentSection = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line is a potential header (short, ends with colon, or all caps)
    const isHeader =
      line.length < 50 &&
      (line.endsWith(":") ||
        /^[A-Z\s/&-]{3,}$/.test(line) ||
        /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:?$/.test(line));

    if (isHeader) {
      const headerText = line.replace(/:$/, "");
      const match = scoreMatch(headerText);

      if (match.canonical && match.score >= 0.6) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join("\n").trim();
        }

        // Start new section
        currentSection = match.canonical;
        currentContent = [];
        continue;
      }
    }

    // Add to current section
    if (currentSection && line.length > 0) {
      currentContent.push(line);
    } else if (!currentSection && line.length > 0) {
      // Content before any header -> subjective
      if (!sections.subjective) {
        sections.subjective = "";
      }
      sections.subjective += (sections.subjective ? "\n" : "") + line;
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join("\n").trim();
  }

  return sections;
}

/**
 * Detect sections by signal words in content
 * @param {string} text
 * @returns {Record<string, string>}
 */
function detectBySignals(text) {
  /** @type {Record<string, string>} */
  const sections = {};
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    if (para.length < 20) continue;

    // Score against each canonical section
    let bestMatch = null;
    let bestScore = 0;

    for (const [canonical, signals] of Object.entries(SIGNAL_WORDS)) {
      const matchCount = signals.filter((sig) =>
        para.toLowerCase().includes(sig.toLowerCase()),
      ).length;

      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestMatch = canonical;
      }
    }

    if (bestMatch && bestScore >= 2) {
      sections[bestMatch] = (sections[bestMatch] || "") + "\n" + para;
    }
  }

  return sections;
}

/**
 * Detect sections by layout heuristics
 * @param {string} text
 * @returns {Record<string, string>}
 */
function detectByLayout(text) {
  /** @type {Record<string, string>} */
  const sections = {};
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    // High bullet density -> likely plan or medications
    const bulletCount = (para.match(/^[\s•*-]/gm) || []).length;
    const lineCount = para.split("\n").length;

    if (bulletCount / lineCount > 0.5) {
      if (/\d+mg|\btab\b|\bcaps?\b|\bml\b/i.test(para)) {
        sections.medications = (sections.medications || "") + "\n" + para;
      } else {
        sections.plan = (sections.plan || "") + "\n" + para;
      }
      continue;
    }

    // Contains vitals signatures -> objective
    if (/\d{2,3}\/\d{2,3}|hr[:\s]*\d+|bp[:\s]*\d+/i.test(para)) {
      sections.objective = (sections.objective || "") + "\n" + para;
      continue;
    }

    // Contains diagnosis keywords -> assessment
    if (/\b(?:diagnosis|impression|likely|consistent with)\b/i.test(para)) {
      sections.assessment = (sections.assessment || "") + "\n" + para;
    }
  }

  return sections;
}

/**
 * Extract entities from detected sections
 * @param {Record<string, string>} sections - Canonical sections
 * @param {string} fullText - Full normalized text
 * @returns {any} Extracted entities
 */
function extractEntities(sections, fullText) {
  /** @type {any} */
  const entities = {
    patient: extractDemographics(fullText),
    vitals: {},
    meds: [],
    allergies: [],
    diagnoses: [],
    assessment: sections.assessment || "",
    plan: sections.plan || "",
    subjective: sections.subjective || "",
    objective: sections.objective || "",
  };

  // Extract vitals from objective, vitals, subjective, or full text
  // PRIORITY 1: Try fullText first to catch EPIC table format (most reliable)
  /** @type {any} */
  let vitals = extractVitals(fullText);

  // If structured format not found in fullText, try section-specific extraction
  // Structured formats: vitals-table, vitals-minmax
  if (
    !vitals.source ||
    (vitals.source !== "vitals-table" && vitals.source !== "vitals-minmax")
  ) {
    /** @type {any} */
    const objectiveVitals = extractVitals(sections.objective || "");
    // Prefer structured formats over inline
    if (
      objectiveVitals.source === "vitals-table" ||
      objectiveVitals.source === "vitals-minmax"
    ) {
      vitals = objectiveVitals;
    } else if (Object.keys(vitals).length === 0) {
      vitals = objectiveVitals;
    }

    // Fallback to other sections
    if (Object.keys(vitals).length === 0 && sections.vitals) {
      vitals = extractVitals(sections.vitals);
    }
    if (Object.keys(vitals).length === 0 && sections.subjective) {
      vitals = extractVitals(sections.subjective);
    }
  }

  entities.vitals = vitals;

  // Extract medications
  if (sections.medications) {
    entities.meds = extractMeds(sections.medications);
  }

  // Extract allergies - try fullText first to catch EPIC format with headers
  let allergies = extractAllergies(fullText);
  if (allergies.length === 0 && sections.allergies) {
    allergies = extractAllergies(sections.allergies);
  }
  if (allergies.length > 0) {
    entities.allergies = allergies;
  }

  // Extract diagnoses - try fullText first to catch "Problems Addressed" sections
  let diagnoses = extractDiagnoses(fullText);
  // Fall back to assessment section if no diagnoses found in fullText
  if (diagnoses.length === 0 && sections.assessment) {
    diagnoses = extractDiagnoses(sections.assessment);
  }
  if (diagnoses.length > 0) {
    entities.diagnoses = diagnoses;
  }

  // Extract labs from full text
  const labs = extractLabs(fullText);
  if (Object.keys(labs).length > 0) {
    entities.labs = labs;
  }

  // Extract provider
  const provider = extractProvider(fullText);
  if (provider) {
    entities.patient.provider = provider;
  }

  // Extract dates
  const dates = extractDates(fullText);
  if (dates.length > 0) {
    entities.dates = dates;
  }

  // Include other sections
  for (const [canonical, content] of Object.entries(sections)) {
    if (
      ![
        "subjective",
        "objective",
        "assessment",
        "plan",
        "medications",
        "vitals",
        "allergies",
        "labs", // Exclude labs - already extracted as structured data
      ].includes(canonical)
    ) {
      entities[canonical] = content;
    }
  }

  return entities;
}

/**
 * Validate schema and populate warnings
 * @param {any} entities
 * @returns {{data: any, schemaWarnings: string[]}} Validated data and warnings
 */
function validateSchema(entities) {
  const data = { ...entities };
  /** @type {string[]} */
  const warnings = [];

  // Check required fields
  if (!data.assessment && !data.plan) {
    warnings.push("CRITICAL: Both assessment and plan are missing");
  }

  if (!data.subjective || data.subjective.length < 10) {
    warnings.push("Subjective/HPI section is missing or very short");
  }

  if (!data.vitals || Object.keys(data.vitals).length === 0) {
    warnings.push("No vitals detected");
  }

  if (
    Object.keys(data.vitals).length > 0 &&
    Object.keys(data.vitals).length < 3
  ) {
    warnings.push("Incomplete vitals (< 3 measurements)");
  }

  if (!data.meds || data.meds.length === 0) {
    warnings.push("No medications detected");
  }

  if (!data.diagnoses || data.diagnoses.length === 0) {
    warnings.push("No diagnoses extracted from assessment");
  }

  if (!data.patient.age) {
    warnings.push("Patient age not detected");
  }

  if (!data.patient.gender) {
    warnings.push("Patient gender not detected");
  }

  return { data, schemaWarnings: warnings };
}

/**
 * Calculate confidence score
 * @param {any} data
 * @param {string[]} warnings
 * @param {Record<string, string>} sections
 * @returns {number} Confidence 0..1
 */
function calculateConfidence(data, warnings, sections) {
  let score = 0.5; // Base score

  // +0.15 if ≥3 canonical sections found
  if (Object.keys(sections).length >= 3) {
    score += 0.15;
  }

  // +0.10 if vitals parsed with ≥3 signals
  if (data.vitals && Object.keys(data.vitals).length >= 3) {
    score += 0.1;
  } else if (data.vitals && Object.keys(data.vitals).length >= 1) {
    // +0.05 for having ANY vitals
    score += 0.05;
  }

  // +0.10 if meds list ≥1 item
  if (data.meds && data.meds.length >= 1) {
    score += 0.1;
  }

  // +0.15 if plan length > 30 chars
  if (data.plan && data.plan.length > 30) {
    score += 0.15;
  } else if (data.plan && data.plan.length > 0) {
    // +0.05 for having ANY plan
    score += 0.05;
  }

  // +0.10 if assessment present and > 20 chars
  if (data.assessment && data.assessment.length > 20) {
    score += 0.1;
  }

  // +0.05 if patient demographics present
  if (data.patient && (data.patient.age || data.patient.gender)) {
    score += 0.05;
  }

  // -0.20 if critical warnings
  const criticalWarnings = warnings.filter((w) =>
    w.includes("CRITICAL"),
  ).length;
  score -= criticalWarnings * 0.2;

  // -0.05 per warning (non-critical)
  const normalWarnings = warnings.length - criticalWarnings;
  score -= normalWarnings * 0.05;

  // Clamp 0..1
  return Math.max(0, Math.min(1, score));
}

/**
 * Fallback parse using all strategies
 * @param {string} text
 * @returns {ParseResult}
 */
export function fallbackParse(text) {
  const result = parseNote(text);

  if (result.confidence >= 0.5) {
    return result;
  }

  // Additional aggressive fallbacks
  result.warnings.push("Using aggressive fallback parsing");

  // Try treating entire text as subjective if nothing else works
  /** @type {any} */
  const data = result.data;
  if (!data.subjective && text.length > 50) {
    data.subjective = text;
    result.warnings.push("Treating entire note as subjective");
    result.confidence = Math.max(result.confidence, 0.3);
  }

  return result;
}

export default parseNote;
