/**
 * Smart Fault-Tolerant Parser
 * Implements: normalize → detectSections → extractEntities → validateSchema → mapToTemplate
 */

import { normalize, extractDates } from "./normalize.js";
import { SIGNAL_WORDS, scoreMatch } from "./synonyms.js";
import { debugLog } from "../utils/logger.js";
import {
  extractVitals,
  extractMeds,
  extractAllergies,
  extractDiagnoses,
  extractProvider,
  extractDemographics,
  extractLabs,
  type Vitals,
  type Labs,
  type Demographics,
} from "./entityExtraction.js";

/**
 * Section detection result
 */
interface SectionDetectionResult {
  sections: Record<string, string>;
  sectionWarnings: string[];
}

/**
 * Schema validation result
 */
interface SchemaValidationResult {
  data: ParsedData;
  schemaWarnings: string[];
}

/**
 * Citation object
 */
export interface Citation {
  title?: string;
  url?: string;
  blob?: number[];
  mime?: string;
}

/**
 * Parse result structure
 */
export interface ParseResult {
  data: ParsedData;
  warnings: string[];
  confidence: number;
  raw: { sections: Record<string, string> };
  assessment?: string[];
  plan?: string[];
  citations?: Citation[];
}

/**
 * Parsed clinical data
 */
export interface ParsedData {
  patient: Demographics & { provider?: string | null };
  vitals: Vitals;
  meds: string[];
  allergies: string[];
  diagnoses: string[];
  assessment: string;
  plan: string;
  subjective: string;
  objective: string;
  dates?: string[];
  labs?: Labs;
  [key: string]: unknown;
}

/**
 * Parse clinical note with fault tolerance
 * @param rawText - Raw note text
 * @returns Parse result with structured data
 */
export function parseNote(rawText: string): ParseResult {
  const startTime = Date.now();
  const warnings: string[] = [];

  // STAGE 1: Normalize
  const normalized = normalize(rawText);
  if (!normalized) {
    return {
      data: {
        patient: {},
        vitals: {},
        meds: [],
        allergies: [],
        diagnoses: [],
        assessment: "",
        plan: "",
        subjective: "",
        objective: "",
      },
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
  debugLog(
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
 * @param text - Normalized text
 * @returns Sections object and warnings
 */
function detectSections(text: string): SectionDetectionResult {
  const sections: Record<string, string> = {};
  const warnings: string[] = [];

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
 * @param text - Input text
 * @returns Canonical section name -> content
 */
function detectByHeaders(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = text.split("\n");

  let currentSection: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if line is a potential header (short, ends with colon, or all caps)
    const isHeader =
      trimmed.length < 50 &&
      (trimmed.endsWith(":") ||
        /^[A-Z\s/&-]{3,}$/.test(trimmed) ||
        /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:?$/.test(trimmed));

    if (isHeader) {
      const headerText = trimmed.replace(/:$/, "");
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
    if (currentSection && trimmed.length > 0) {
      currentContent.push(trimmed);
    } else if (!currentSection && trimmed.length > 0) {
      // Content before any header -> subjective
      if (!sections.subjective) {
        sections.subjective = "";
      }
      sections.subjective += (sections.subjective ? "\n" : "") + trimmed;
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
 * @param text - Input text
 * @returns Detected sections
 */
function detectBySignals(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    if (para.length < 20) continue;

    // Score against each canonical section
    let bestMatch: string | null = null;
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
 * @param text - Input text
 * @returns Detected sections
 */
function detectByLayout(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
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
 * @param sections - Canonical sections
 * @param fullText - Full normalized text
 * @returns Extracted entities
 */
function extractEntities(sections: Record<string, string>, fullText: string): ParsedData {
  const entities: ParsedData = {
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
  let vitals = extractVitals(fullText);

  // If structured format not found in fullText, try section-specific extraction
  // Structured formats: vitals-table, vitals-minmax
  if (
    !vitals.source ||
    (vitals.source !== "vitals-table" && vitals.source !== "vitals-minmax")
  ) {
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
 * @param entities - Raw extracted entities
 * @returns Validated data and warnings
 */
function validateSchema(entities: ParsedData): SchemaValidationResult {
  const data = { ...entities };
  const warnings: string[] = [];

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
 * @param data - Parsed data
 * @param warnings - Validation warnings
 * @param sections - Detected sections
 * @returns Confidence 0..1
 */
function calculateConfidence(data: ParsedData, warnings: string[], sections: Record<string, string>): number {
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
 * @param text - Input text
 * @returns Parse result with aggressive fallbacks
 */
export function fallbackParse(text: string): ParseResult {
  const result = parseNote(text);

  if (result.confidence >= 0.5) {
    return result;
  }

  // Additional aggressive fallbacks
  result.warnings.push("Using aggressive fallback parsing");

  // Try treating entire text as subjective if nothing else works
  if (!result.data.subjective && text.length > 50) {
    result.data.subjective = text;
    result.warnings.push("Treating entire note as subjective");
    result.confidence = Math.max(result.confidence, 0.3);
  }

  return result;
}

export default parseNote;
