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
  const normalized = headerText
    .toLowerCase()
    .trim()
    .replace(/[:\-_]/g, " ")
    .replace(/\s+/g, " ");
  const lookup = buildSynonymLookup();

  // Direct synonym match
  if (lookup[normalized]) {
    return {
      canonical: lookup[normalized],
      score: 1.0,
      matchedSynonym: normalized,
    };
  }

  // Partial match - check if any synonym is contained
  let bestMatch = null;
  let bestScore = 0;

  for (const [canonical, synonyms] of Object.entries(SECTION_SYNONYMS)) {
    for (const syn of synonyms) {
      if (
        normalized.includes(syn.toLowerCase()) ||
        syn.toLowerCase().includes(normalized)
      ) {
        const score =
          Math.min(normalized.length, syn.length) /
          Math.max(normalized.length, syn.length);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { canonical, score, matchedSynonym: syn };
        }
      }
    }
  }

  // Signal word detection if no header match
  if (!bestMatch && sectionBody) {
    for (const [canonical, signals] of Object.entries(SIGNAL_WORDS)) {
      const bodyLower = sectionBody.toLowerCase();
      const matchCount = signals.filter((sig) =>
        bodyLower.includes(sig),
      ).length;
      if (matchCount >= 2) {
        const score = 0.6 + matchCount * 0.05; // Lower confidence for signal-based
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            canonical,
            score: Math.min(score, 0.8),
            matchedSynonym: "signal-words",
          };
        }
      }
    }
  }

  return bestMatch || { canonical: null, score: 0, matchedSynonym: null };
}
