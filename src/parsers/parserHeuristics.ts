/* eslint-env browser */
import { debugLog, debugWarn, debugError } from "../utils/logger.js";

/**
 * parserHeuristics.ts - User-Trainable Parser Heuristics System
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

/**
 * Pattern configuration
 */
interface PatternConfig {
  aliases: string[];
  regex: RegExp;
  custom?: boolean;
}

/**
 * Section hints
 */
interface SectionHints {
  [section: string]: {
    aliases: string[];
  };
}

/**
 * Format definition
 */
interface FormatDefinition {
  label: string;
  created: string;
  sections: Record<string, PatternConfig>;
}

/**
 * Stored formats
 */
interface StoredFormats {
  [formatLabel: string]: FormatDefinition;
}

// Built-in default patterns (fallback)
const DEFAULT_PATTERNS: Record<string, PatternConfig> = {
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
  private formats: StoredFormats;
  private debug: boolean;

  constructor() {
    this.formats = this.loadFromStorage();
    this.debug = (window as any)[DEBUG_KEY] || false;
  }

  /**
   * Load all saved formats from localStorage
   */
  private loadFromStorage(): StoredFormats {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredFormats;
        this.log('✅ Loaded heuristics from storage:', Object.keys(parsed));
        return parsed;
      }
    } catch (error) {
      debugWarn('Failed to load parser heuristics:', error);
    }
    return {};
  }

  /**
   * Save all formats to localStorage
   */
  private saveToStorage(): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.formats));
      this.log('💾 Saved heuristics to storage');
      return true;
    } catch (error) {
      debugError('Failed to save parser heuristics:', error);
      return false;
    }
  }

  /**
   * Save a new format or update existing
   */
  saveFormat(formatLabel: string, hints: SectionHints): boolean {
    // Validate hints structure
    if (!hints || typeof hints !== 'object') {
      throw new Error('Invalid hints object');
    }

    // Build regex patterns from aliases
    const processed: Record<string, PatternConfig> = {};
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
  getFormat(formatLabel: string): FormatDefinition | null {
    return this.formats[formatLabel] || null;
  }

  /**
   * Get all available formats
   */
  getAllFormats(): string[] {
    return Object.keys(this.formats);
  }

  /**
   * Delete a format
   */
  deleteFormat(formatLabel: string): boolean {
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
  exportToJSON(): string {
    return JSON.stringify(this.formats, null, 2);
  }

  /**
   * Import formats from JSON
   */
  importFromJSON(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString) as StoredFormats;
      if (typeof imported !== 'object') {
        throw new Error('Invalid JSON structure');
      }

      // Merge with existing (imported wins)
      this.formats = { ...this.formats, ...imported };
      this.saveToStorage();
      this.log('📥 Imported heuristics:', Object.keys(imported));
      return true;
    } catch (error) {
      debugError('Failed to import heuristics:', error);
      return false;
    }
  }

  /**
   * Clear all saved formats
   */
  clearAll(): void {
    this.formats = {};
    localStorage.removeItem(STORAGE_KEY);
    this.log('🗑️ Cleared all heuristics');
  }

  /**
   * Get combined patterns for a format (custom + defaults)
   */
  getCombinedPatterns(formatLabel: string): Record<string, PatternConfig> {
    const custom = this.formats[formatLabel];
    const combined: Record<string, PatternConfig> = {};

    // Start with defaults
    for (const [section, defaultConfig] of Object.entries(DEFAULT_PATTERNS)) {
      combined[section] = { ...defaultConfig };
    }

    // Override with custom patterns if available
    if (custom?.sections) {
      for (const [section, customConfig] of Object.entries(custom.sections)) {
        combined[section] = { ...customConfig };
      }
    }

    return combined;
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      debugLog('[ParserHeuristics]', ...args);
    }
  }

  /**
   * Enable/disable debug mode
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
    (window as any)[DEBUG_KEY] = enabled;
  }
}

// Create singleton instance
const heuristics = new ParserHeuristics();

// Expose to window for global access
if (typeof window !== 'undefined') {
  (window as any).parserHeuristics = heuristics;
  
  // Expose debug toggle
  (window as any).__PARSER_DEBUG__ = false;
  Object.defineProperty(window, '__PARSER_DEBUG__', {
    get() { return heuristics.setDebug; },
    set(value: boolean) { heuristics.setDebug(value); }
  });
}

// ES module export
export { ParserHeuristics, heuristics as default };
