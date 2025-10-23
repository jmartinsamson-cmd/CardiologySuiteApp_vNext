/**
 * Section Synonyms Map
 * Maps canonical section names to arrays of accepted variants
 */

const SECTION_SYNONYMS = {
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
export const SIGNAL_WORDS = {
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
 * Create reverse lookup from synonym to canonical name
 * @returns {Record<string, string>}
 */
function buildSynonymLookup() {
  const lookup = /** @type {Record<string, string>} */ ({});
  for (const [canonical, synonyms] of Object.entries(SECTION_SYNONYMS)) {
    for (const syn of synonyms) {
      lookup[syn.toLowerCase()] = canonical;
    }
  }
  return lookup;
}

/**
 * Score how well a text matches a canonical section
 * Returns { canonical, score, matchedSynonym }
 */
/**
 * @param {string} headerText
 * @param {string} [sectionBody]
 */
export function scoreMatch(headerText, sectionBody = "") {
  // Extracted helpers to reduce cognitive complexity
  /** @type {(text: string) => string} */
  const normalizeHeader = (text) => {
    const base = text.toLowerCase().trim();
    // Use split/join to normalize delimiters and whitespace without relying on replaceAll lib support
    const withDelims = base.split(/[:\-_]/g).join(" ");
    const collapsed = withDelims.split(/\s+/g).join(" ");
    return collapsed;
  };

  const normalized = normalizeHeader(headerText);
  const lookup = buildSynonymLookup();

  // 1) Direct synonym match
  if (lookup[normalized]) {
    return { canonical: lookup[normalized], score: 1, matchedSynonym: normalized };
  }

  // 2) Partial/or approximate match against known synonyms
  /** @type {(norm: string) => ({canonical: string, score: number, matchedSynonym: string} | null)} */
  const findBestSynonymMatch = (norm) => {
    /** @type {{canonical: string, score: number, matchedSynonym: string} | null} */
    let best = null;
    let bestScore = 0;
    for (const [canonical, synonyms] of Object.entries(SECTION_SYNONYMS)) {
      for (const syn of synonyms) {
        const synLower = syn.toLowerCase();
        if (norm.includes(synLower) || synLower.includes(norm)) {
          const score = Math.min(norm.length, synLower.length) / Math.max(norm.length, synLower.length);
          if (score > bestScore) {
            bestScore = score;
            best = { canonical, score, matchedSynonym: syn };
          }
        }
      }
    }
    return best;
  };

  const bestMatch = findBestSynonymMatch(normalized);
  if (bestMatch) return bestMatch;

  // 3) Fallback: detect by signal words in body
  /** @type {(body?: string) => ({canonical: string, score: number, matchedSynonym: string} | null)} */
  const detectBySignals = (body) => {
    if (!body) return null;
    const bodyLower = body.toLowerCase();
    /** @type {{canonical: string, score: number, matchedSynonym: string} | null} */
    let best = null;
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
  };

  return detectBySignals(sectionBody) || { canonical: null, score: 0, matchedSynonym: null };
}
