/* eslint-env browser */
/**
 * parserHeuristics.js - User-Trainable Parser Heuristics System
 * ================================================================
 * Allows users to teach the parser new clinical note formats by providing
 * header aliases and regex patterns. Stores learned patterns in localStorage.
 * 
 * Features:
 * - Format-specific header aliases (e.g., "Vitals|VS|V/S")
 * - Persistent storage with import/export
 * - Graceful fallback to built-in patterns
 * - Debug logging for pattern matching
 */

const STORAGE_KEY = 'parser_hints_v1';
const DEBUG_KEY = '__PARSER_DEBUG__';

// Built-in default patterns (fallback)
const DEFAULT_PATTERNS = {
  vitals: {
    aliases: ['Vitals?:', 'Vital Signs?:', 'VS:', 'V/S:'],
    regex: /^(?:Vitals?|Vital\s*Signs?|VS|V\/S)\s*:?/i
  },
  hpi: {
    aliases: ['History of Present Illness:', 'HPI:', 'History:', 'Present Illness:'],
    regex: /^(?:History\s*of\s*Present\s*Illness|HPI|History|Present\s*Illness)\s*:?/i
  },
  assessment: {
    aliases: ['Assessment:', 'Impression:', 'IMP:', 'A:', 'A/P:', 'Diagnosis:'],
    regex: /^(?:Assessment|Impression|IMP|A\/P|Diagnosis)\s*:?/i
  },
  plan: {
    aliases: ['Plan:', 'P:', 'Recommendations:', 'Management:'],
    regex: /^(?:Plan|P|Recommendations|Management)\s*:?/i
  }
};

/**
 * Parse Heuristics Manager
 */
class ParserHeuristics {
  constructor() {
    this.formats = this.loadFromStorage();
    this.debug = window[DEBUG_KEY] || false;
  }

  /**
   * Load all saved formats from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.log('✅ Loaded heuristics from storage:', Object.keys(parsed));
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load parser heuristics:', error);
    }
    return {};
  }

  /**
   * Save all formats to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.formats));
      this.log('💾 Saved heuristics to storage');
      return true;
    } catch (error) {
      console.error('Failed to save parser heuristics:', error);
      return false;
    }
  }

  /**
   * Save a new format or update existing
   */
  saveFormat(formatLabel, hints) {
    // Validate hints structure
    if (!hints || typeof hints !== 'object') {
      throw new Error('Invalid hints object');
    }

    // Build regex patterns from aliases
    const processed = {};
    for (const [section, config] of Object.entries(hints)) {
      if (!config.aliases || !Array.isArray(config.aliases)) continue;
      
      // Filter out empty aliases
      const cleanAliases = config.aliases.filter(a => a && a.trim());
      if (cleanAliases.length === 0) continue;

      // Build regex from aliases
      const pattern = cleanAliases
        .map(alias => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special chars
        .join('|');
      
      // Security: Pattern is safely escaped above - all regex special chars are sanitized
      // codacy-disable-next-line
      processed[section] = {
        aliases: cleanAliases,
        regex: new RegExp(`^(?:${pattern})`, 'i'),
        custom: true
      };
    }

    this.formats[formatLabel] = {
      label: formatLabel,
      created: new Date().toISOString(),
      sections: processed
    };

    this.saveToStorage();
    this.log(`✅ Saved format: ${formatLabel}`);
    return true;
  }

  /**
   * Get hints for a specific format
   */
  getFormat(formatLabel) {
    return this.formats[formatLabel] || null;
  }

  /**
   * Get all available formats
   */
  getAllFormats() {
    return Object.keys(this.formats);
  }

  /**
   * Delete a format
   */
  deleteFormat(formatLabel) {
    if (this.formats[formatLabel]) {
      delete this.formats[formatLabel];
      this.saveToStorage();
      this.log(`🗑️ Deleted format: ${formatLabel}`);
      return true;
    }
    return false;
  }

  /**
   * Export all formats as JSON
   */
  exportToJSON() {
    return JSON.stringify(this.formats, null, 2);
  }

  /**
   * Import formats from JSON
   */
  importFromJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (typeof imported !== 'object') {
        throw new Error('Invalid JSON structure');
      }

      // Merge with existing (imported wins)
      this.formats = { ...this.formats, ...imported };
      this.saveToStorage();
      this.log('📥 Imported heuristics:', Object.keys(imported));
      return true;
    } catch (error) {
      console.error('Failed to import heuristics:', error);
      return false;
    }
  }

  /**
   * Clear all saved formats
   */
  clearAll() {
    this.formats = {};
    localStorage.removeItem(STORAGE_KEY);
    this.log('🗑️ Cleared all heuristics');
  }

  /**
   * Get combined patterns for a format (custom + defaults)
   */
  getCombinedPatterns(formatLabel) {
    const custom = this.formats[formatLabel];
    const combined = {};

    // Start with defaults
    for (const [section, defaultConfig] of Object.entries(DEFAULT_PATTERNS)) {
      combined[section] = { ...defaultConfig };
    }

    // Override with custom patterns if available
    if (custom && custom.sections) {
      for (const [section, customConfig] of Object.entries(custom.sections)) {
        combined[section] = { ...customConfig };
      }
    }

    return combined;
  }

  /**
   * Debug logging
   */
  log(...args) {
    if (this.debug) {
      console.log('[ParserHeuristics]', ...args);
    }
  }

  /**
   * Enable/disable debug mode
   */
  setDebug(enabled) {
    this.debug = enabled;
    window[DEBUG_KEY] = enabled;
  }
}

// Create singleton instance
const heuristics = new ParserHeuristics();

// Expose to window for global access
if (typeof window !== 'undefined') {
  window.parserHeuristics = heuristics;
  
  // Expose debug toggle
  window.__PARSER_DEBUG__ = false;
  Object.defineProperty(window, '__PARSER_DEBUG__', {
    get() { return heuristics.debug; },
    set(value) { heuristics.setDebug(value); }
  });
}

// ES module export
export { ParserHeuristics, heuristics as default };
