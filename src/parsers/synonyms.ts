/**
 * Section Synonyms Map
 * Maps canonical section names to arrays of accepted variants
 */

type SectionKey =
  | "subjective"
  | "objective"
  | "assessment"
  | "plan"
  | "pmh"
  | "psh"
  | "medications"
  | "allergies"
  | "vitals"
  | "labs"
  | "imaging"
  | "ros"
  | "family_history"
  | "social_history";

const SECTION_SYNONYMS: Record<SectionKey, string[]> = {
  subjective: [
    "subjective",
    "hpi",
    "history of present illness",
    "present illness",
    "interval history",
    "chief complaint",
    "cc",
    "reason for visit",
    "ros",
    "review of systems",
    "hx/pe",
    "hx",
  ],
  objective: [
    "objective",
    "exam",
    "physical exam",
    "physical examination",
    "pe",
    "vitals",
    "vital signs",
    "examination",
  ],
  assessment: [
    "assessment",
    "impression",
    "impressions",
    "diagnosis",
    "diagnoses",
    "assessment/impression",
    "assessment & impression",
    "a&p",
    "impression and plan",
    "impression/plan",
    "problems addressed",
  ],
  plan: [
    "plan",
    "assessment/plan",
    "assessment and plan",
    "a/p",
    "a&p",
    "recommendations",
    "treatment plan",
    "management",
    "disposition",
    "treatment",
    "therapy",
  ],
  pmh: [
    "past medical history",
    "pmh",
    "medical history",
    "history",
    "past history",
    "background",
  ],
  psh: ["past surgical history", "psh", "surgical history", "prior surgeries"],
  medications: [
    "medications",
    "meds",
    "current medications",
    "current meds",
    "home medications",
    "home meds",
    "prescription",
  ],
  allergies: [
    "allergies",
    "drug allergies",
    "allergy",
    "nkda",
    "adverse reactions",
  ],
  vitals: ["vitals", "vital signs", "vs", "vitals signs"],
  labs: [
    "labs",
    "laboratory",
    "laboratory results",
    "lab results",
    "lab work",
    "laboratory data",
  ],
  imaging: [
    "imaging",
    "diagnostic studies",
    "studies",
    "radiology",
    "diagnostics",
  ],
  ros: ["review of systems", "ros", "systems review"],
  family_history: ["family history", "fh", "familial history"],
  social_history: ["social history", "sh", "social", "lifestyle"],
};

/**
 * Signal words that indicate section content even without headers
 */
type SignalKey = "subjective" | "objective" | "assessment" | "plan";

export const SIGNAL_WORDS: Record<SignalKey, string[]> = {
  subjective: [
    "reports",
    "complains of",
    "presents with",
    "states",
    "denies",
    "describes",
    "experiencing",
    "endorses",
    "pt reports",
    "patient reports",
  ],
  objective: [
    "exam shows",
    "examination reveals",
    "on exam",
    "physical exam",
    "appears",
    "found to have",
    "noted to have",
  ],
  assessment: [
    "likely",
    "consistent with",
    "suspect",
    "diagnosis",
    "impression",
    "differential includes",
    "ddx",
    "appears to be",
  ],
  plan: [
    "will start",
    "initiate",
    "continue",
    "discontinue",
    "order",
    "recommend",
    "advised",
    "instructed",
    "follow up",
    "return if",
  ],
};

/**
 * Match result with canonical name, confidence score, and matched synonym
 */
export interface MatchResult {
  canonical: string | null;
  score: number;
  matchedSynonym: string | null;
}

/**
 * Create reverse lookup from synonym to canonical name
 */
function buildSynonymLookup(): Record<string, string> {
  const lookup: Record<string, string> = {};
  for (const [canonical, synonyms] of Object.entries(SECTION_SYNONYMS)) {
    for (const syn of synonyms) {
      lookup[syn.toLowerCase()] = canonical;
    }
  }
  return lookup;
}

/**
 * Normalize header text by removing special characters and collapsing whitespace
 */
function normalizeHeader(text: string): string {
  const base = text.toLowerCase().trim();
  // Use split/join to normalize delimiters and whitespace
  const withDelims = base.split(/[:\-_]/g).join(" ");
  const collapsed = withDelims.split(/\s+/g).join(" ");
  return collapsed;
}

/**
 * Find best synonym match for normalized header text
 */
function findBestSynonymMatch(normalized: string): MatchResult | null {
  let best: MatchResult | null = null;
  let bestScore = 0;
  
  for (const [canonical, synonyms] of Object.entries(SECTION_SYNONYMS)) {
    for (const syn of synonyms) {
      const synLower = syn.toLowerCase();
      if (normalized.includes(synLower) || synLower.includes(normalized)) {
        const score = Math.min(normalized.length, synLower.length) / Math.max(normalized.length, synLower.length);
        if (score > bestScore) {
          bestScore = score;
          best = { canonical, score, matchedSynonym: syn };
        }
      }
    }
  }
  
  return best;
}

/**
 * Detect section by signal words in body text
 */
function detectBySignals(sectionBody?: string): MatchResult | null {
  if (!sectionBody) return null;
  
  const bodyLower = sectionBody.toLowerCase();
  let best: MatchResult | null = null;
  let bestScore = 0;
  
  for (const [canonical, signals] of Object.entries(SIGNAL_WORDS)) {
    const matchCount = signals.filter((sig) => bodyLower.includes(sig)).length;
    if (matchCount >= 2) {
      const score = Math.min(0.6 + matchCount * 0.05, 0.8); // Lower confidence for signal-based
      if (score > bestScore) {
        bestScore = score;
        best = { canonical, score, matchedSynonym: "signal-words" };
      }
    }
  }
  
  return best;
}

/**
 * Score how well a text matches a canonical section
 * Returns { canonical, score, matchedSynonym }
 * @param headerText - Header text to match
 * @param sectionBody - Optional body text for signal word detection
 * @returns Match result with canonical name and confidence score
 */
export function scoreMatch(headerText: string, sectionBody: string = ""): MatchResult {
  const normalized = normalizeHeader(headerText);
  const lookup = buildSynonymLookup();

  // 1) Direct synonym match
  if (lookup[normalized]) {
    return { canonical: lookup[normalized], score: 1, matchedSynonym: normalized };
  }

  // 2) Partial or approximate match against known synonyms
  const bestMatch = findBestSynonymMatch(normalized);
  if (bestMatch) return bestMatch;

  // 3) Fallback: detect by signal words in body
  return detectBySignals(sectionBody) || { canonical: null, score: 0, matchedSynonym: null };
}
