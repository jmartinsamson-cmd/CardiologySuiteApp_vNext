/**
 * @file Text utilities for RAG (Retrieval-Augmented Generation)
 * PHI de-identification and text processing helpers
 */

/**
 * De-identify clinical text by removing PHI patterns
 * @param {string} text - Clinical text with potential PHI
 * @returns {string} De-identified text
 */
export function deidentify(text) {
  if (!text) return '';

  let sanitized = text;

  // Remove dates (MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD)
  sanitized = sanitized.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, '[DATE]');
  sanitized = sanitized.replace(/\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b/g, '[DATE]');

  // Remove phone numbers (###-###-####, (###) ###-####, etc.)
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  sanitized = sanitized.replace(/\(\d{3}\)\s*\d{3}[-.]?\d{4}/g, '[PHONE]');

  // Remove emails
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');

  // Remove SSN patterns (###-##-####)
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');

  // Remove MRN/ID patterns (common formats: MRN: ######, MRN######, ID: ######)
  sanitized = sanitized.replace(/\b(MRN|ID|PATIENT ID)[\s:]*\d{6,10}\b/gi, '[MRN]');

  return sanitized;
}

/**
 * Truncate text to maximum length, preserving word boundaries
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length in characters
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;

  // Find the last space before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Extract key terms from clinical text
 * @param {string} text - Clinical text
 * @returns {string[]} Array of extracted terms
 */
export function extractKeyTerms(text) {
  if (!text) return [];

  const terms = [];
  const lowerText = text.toLowerCase();

  // Common cardiac conditions
  const conditions = [
    'heart failure', 'hfref', 'hfpef', 'cardiomyopathy',
    'atrial fibrillation', 'afib', 'flutter',
    'coronary artery disease', 'cad', 'acs', 'mi', 'stemi', 'nstemi',
    'hypertension', 'htn',
    'valvular disease', 'aortic stenosis', 'mitral regurgitation',
    'arrhythmia', 'bradycardia', 'tachycardia'
  ];

  conditions.forEach(condition => {
    if (lowerText.includes(condition)) {
      terms.push(condition);
    }
  });

  return Array.from(new Set(terms)); // Deduplicate
}
