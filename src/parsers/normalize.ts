/**
 * Text Normalization Pipeline
 * Converts messy input to clean, parseable text
 */

/**
 * Normalize text for parsing
 * - Convert smart quotes to ASCII
 * - Normalize dashes
 * - Collapse excessive newlines
 * - Strip trailing spaces
 * - Unify line endings
 * - Preserve original casing in content
 * @param text - Raw input text
 * @returns Normalized text
 */
export function normalize(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  let normalized = text;

  // Convert smart quotes to ASCII
  normalized = normalized.replaceAll(/[\u2018\u2019]/g, "'"); // Single quotes
  normalized = normalized.replaceAll(/[\u201C\u201D]/g, '"'); // Double quotes

  // Normalize dashes
  normalized = normalized.replaceAll(/[\u2013\u2014]/g, "-"); // En/em dash to hyphen
  normalized = normalized.replaceAll("\u2026", "..."); // Ellipsis

  // Normalize other Unicode punctuation
  normalized = normalized.replaceAll("\u00A0", " "); // Non-breaking space

  // Unify line endings
  normalized = normalized.replaceAll("\r\n", "\n");
  normalized = normalized.replaceAll("\r", "\n");

  // Strip trailing spaces from each line
  normalized = normalized
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");

  // Collapse 3+ newlines to 2
  normalized = normalized.replaceAll(/\n{3,}/g, "\n\n");

  // Collapse multiple spaces to single (but preserve paragraph structure)
  normalized = normalized.replaceAll(/[^\S\n]+/g, " ");

  // Trim start/end
  normalized = normalized.trim();

  return normalized;
}

/**
 * Date pattern configuration
 */
interface DatePattern {
  regex: RegExp;
  parse: (match: RegExpMatchArray) => string;
}

/**
 * Month name to number mapping
 */
const MONTH_MAP: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

/**
 * Standardize date formats to YYYY-MM-DD when unambiguous
 * @param dateStr - Date string in various formats
 * @returns ISO date string or null if ambiguous
 */
function standardizeDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try common formats
  const patterns: DatePattern[] = [
    // MM/DD/YYYY or M/D/YYYY
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      parse: (m) => `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`,
    },
    // YYYY/MM/DD
    {
      regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
      parse: (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`,
    },
    // Mon DD, YYYY or Month DD, YYYY
    {
      regex:
        /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})$/i,
      parse: (m) => {
        const month = MONTH_MAP[m[1].toLowerCase().substring(0, 3)];
        return `${m[3]}-${month}-${m[2].padStart(2, "0")}`;
      },
    },
    // DD-Mon-YYYY
    {
      regex:
        /^(\d{1,2})-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-(\d{4})$/i,
      parse: (m) => {
        const month = MONTH_MAP[m[2].toLowerCase().substring(0, 3)];
        return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
      },
    },
  ];

  const trimmed = dateStr.trim();
  for (const pattern of patterns) {
    const match = pattern.regex.exec(trimmed);
    if (match) {
      try {
        const isoDate = pattern.parse(match);
        // Validate it's a real date
        const d = new Date(isoDate);
        if (!Number.isNaN(d.getTime())) {
          return isoDate;
        }
      } catch {
        continue;
      }
    }
  }

  return null; // Ambiguous or unrecognized
}

/**
 * Extract and standardize dates from text
 * @param text - Text potentially containing dates
 * @returns Array of ISO date strings
 */
export function extractDates(text: string): string[] {
  const datePatterns: RegExp[] = [
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
  ];

  const found = new Set<string>();

  for (const pattern of datePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const standardized = standardizeDate(match[0]);
      if (standardized) {
        found.add(standardized);
      }
    }
  }

  return Array.from(found);
}
