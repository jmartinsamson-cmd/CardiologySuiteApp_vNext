/* eslint-env browser */
import { debugLog, debugError } from "../utils/logger.js";

/**
 * hintedParser.js - Hinted Parser Layer for User-Trained Format Recognition
 * ===========================================================================
 * Extends the base parser with user-provided hints/aliases for better section detection.
 * Falls back to generic parsing if hints don't match.
 */

/**
 * Parse a clinical note using user-provided hints
 * @param {string} text - Clinical note text
 * @param {object|null} [hints=null] - Format-specific hints (optional, will use learned patterns if not provided)
 * @returns {object} Parsed sections with matched aliases info
 */
function parseWithHints(text, hints = null) {
  // @ts-ignore - Extending window object for debug flag
  const debug = window.__PARSER_DEBUG__ || false;
  /** @type {Record<string, any>} */
  const result = {
    vitals: [],
    hpi: '',
    assessment: '',
    plan: '',
    matchedAliases: {},
    fullText: text
  };

  if (!text || typeof text !== 'string') {
    return result;
  }

  // Get patterns: user hints > learned patterns > defaults
  let patterns = hints;
  // @ts-ignore - Extending window object for getLearnedPatterns
  if (!patterns && typeof window.getLearnedPatterns === 'function') {
    // @ts-ignore - Extending window object for getLearnedPatterns
    patterns = window.getLearnedPatterns();
    if (patterns && debug) {
      debugLog('📚 [HintedParser] Using learned patterns from training examples');
    }
  }
  if (!patterns) {
    patterns = getDefaultPatterns();
    if (debug) {
      debugLog('📖 [HintedParser] Using default patterns');
    }
  }
  
  if (debug) {
    debugLog('🔍 [HintedParser] Using patterns:', patterns);
  }

  // Split into lines for processing
  const lines = text.split(/\n/);
  
  // Track current section
  /** @type {string|null} */
  let currentSection = null;
  /** @type {string[]} */
  let currentContent = [];
  /** @type {Record<string, string>} */
  const sections = {};

  // Helper: commit current section
  const commit = () => {
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
      if (debug) {
        debugLog(`✅ [HintedParser] Captured ${currentSection}: ${sections[currentSection].substring(0, 50)}...`);
      }
      currentContent = [];
    }
  };

  // Process each line
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Keep empty lines within sections
      if (currentSection) {
        currentContent.push(line);
      }
      continue;
    }

    // Check if line matches any section header
    let matched = false;
    for (const [sectionName, config] of Object.entries(patterns)) {
      if (config.regex && config.regex.test(trimmed)) {
        // Found a new section header
        commit(); // Save previous section
        currentSection = sectionName;
        result.matchedAliases[sectionName] = trimmed;
        
        if (debug) {
          debugLog(`🎯 [HintedParser] Matched ${sectionName} header: "${trimmed}"`);
        }

        // Check if content follows on same line after colon
        const contentAfterHeader = trimmed.replace(config.regex, '').replace(/^:\s*/, '').trim();
        if (contentAfterHeader) {
          currentContent.push(contentAfterHeader);
        }
        
        matched = true;
        break;
      }
    }

    // If not a header, add to current section
    if (!matched && currentSection) {
      currentContent.push(line);
    } else if (!matched && !currentSection) {
      // Pre-header content - store as preamble
      if (!sections.__preamble) sections.__preamble = '';
      sections.__preamble += line + '\n';
    }
  }

  // Commit final section
  commit();

  // Map sections to result
  result.hpi = sections.hpi || sections.__preamble || '';
  result.assessment = sections.assessment || '';
  result.plan = sections.plan || '';

  // Extract vitals if section exists
  if (sections.vitals) {
    result.vitals = extractVitalsFromText(sections.vitals);
  }

  // Fallback: if main sections empty, try generic extraction
  if (!result.hpi && !result.assessment && !result.plan) {
    if (debug) {
      debugLog('⚠️ [HintedParser] No sections matched, falling back to generic parse');
    }
    return fallbackToGenericParse(text);
  }

  return result;
}

/**
 * Extract vitals from vitals section text
 * Handles multiple formats: key:value, bullets, inline
 * @param {string} text - Text containing vitals information
 * @returns {any[]} Array of vitals objects
 */
function extractVitalsFromText(text) {
  const vitals = [];
  
  // Use the global extractVitals if available
  if (typeof window.extractVitals === 'function') {
    return window.extractVitals(text, {});
  }

  // Fallback: simple extraction
  const patterns = {
    bp: /\b(?:BP|Blood Pressure)\s*:?\s*(\d{2,3}\/\d{2,3})/i,
    hr: /\b(?:HR|Heart Rate|Pulse)\s*:?\s*(\d{2,3})/i,
    rr: /\b(?:RR|Respiratory Rate|Resp)\s*:?\s*(\d{1,2})/i,
    temp: /\b(?:Temp|Temperature)\s*:?\s*(\d{2,3}(?:\.\d)?)\s*°?[FC]?/i,
    spo2: /\b(?:SpO2|O2 Sat)\s*:?\s*(\d{2,3})%?/i
  };

  for (const [name, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      vitals.push({ name: name.toUpperCase(), value: match[1], raw: match[0] });
    }
  }

  return vitals;
}

/**
 * Fallback to generic parser
 * @param {string} text - Clinical note text
 * @returns {object} Parsed result from generic parser
 */
function fallbackToGenericParse(text) {
  // Try parseClinicalNoteFull if available
  if (typeof window.parseClinicalNoteFull === 'function') {
    return window.parseClinicalNoteFull(text);
  }

  // Minimal fallback
  return {
    vitals: [],
    hpi: text,
    assessment: '',
    plan: '',
    matchedAliases: {},
    fullText: text,
    fallback: true
  };
}

/**
 * Get default patterns
 */
function getDefaultPatterns() {
  return {
    vitals: {
      regex: /^(?:Vitals?|Vital\s*Signs?|VS|V\/S)\s*:?/i,
      aliases: ['Vitals', 'Vital Signs', 'VS', 'V/S']
    },
    hpi: {
      regex: /^(?:History\s*of\s*Present\s*Illness|HPI|History|Present\s*Illness)\s*:?/i,
      aliases: ['HPI', 'History of Present Illness', 'History']
    },
    assessment: {
      regex: /^(?:Assessment|Impression|IMP|A\/P|Diagnosis)\s*:?/i,
      aliases: ['Assessment', 'Impression', 'IMP', 'A/P']
    },
    plan: {
      regex: /^(?:Plan|P|Recommendations|Management)\s*:?/i,
      aliases: ['Plan', 'Recommendations', 'Management']
    }
  };
}

/**
 * Test function for console debugging
 * Usage: window.__testHintedParse__(note, hints)
 * @param {string} note - Clinical note text
 * @param {object|null} [hints=null] - Optional hints
 * @returns {object|null} Parsed result or null
 */
function testHintedParse(note, hints = null) {
  if (!note || typeof note !== 'string') {
    debugError('Invalid note provided');
    return null;
  }
  debugLog('🧪 [TestHintedParse] Starting...');
  debugLog('📝 Note length:', note.length);
  debugLog('🎯 Hints:', hints);
  
  /** @type {any} */
  const result = parseWithHints(note, hints);
  
  debugLog('\n📊 Results:');
  debugLog('  Vitals:', result.vitals?.length || 0, 'items');
  debugLog('  HPI:', result.hpi?.length || 0, 'chars');
  debugLog('  Assessment:', result.assessment?.length || 0, 'chars');
  debugLog('  Plan:', result.plan?.length || 0, 'chars');
  debugLog('  Matched Aliases:', result.matchedAliases);
  
  return result;
}

// Expose to window
if (typeof window !== 'undefined') {
  // @ts-ignore - Extending window object for browser console access
  window.parseWithHints = parseWithHints;
  // @ts-ignore - Extending window object for browser console access
  window.__testHintedParse__ = testHintedParse;
}

// ES module export
export { parseWithHints, testHintedParse, extractVitalsFromText };
