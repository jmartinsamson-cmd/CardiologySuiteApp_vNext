/**
 * Diagnosis Sidebar Sanitizer
 * Filters non-medical items from diagnosis lists
 *
 * Usage: import { sanitizeDiagnosesList } from './utils/diagnosisSanitizer.js';
 */

const WHITELIST_URL = new URL("../../data/diagnosis_whitelist.json?url", import.meta.url).href;
const BLACKLIST_URL = new URL("../../data/diagnosis_blacklist.json?url", import.meta.url).href;
const FEATURES_URL = new URL("../../config/features.json?url", import.meta.url).href;

// Lazy-loaded data
let WHITELIST = null;
let BLACKLIST = null;
let FEATURES = null;

/**
 * Normalize string for comparison (case-insensitive, trimmed)
 * @param {string} s - String to normalize
 * @returns {string} Normalized string
 */
function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

/**
 * Load configuration files asynchronously
 * @returns {Promise<void>}
 */
async function loadConfig() {
  if (WHITELIST !== null) return; // Already loaded

  try {
    const [whitelistRes, blacklistRes, featuresRes] = await Promise.all([
      fetch(WHITELIST_URL),
      fetch(BLACKLIST_URL),
      fetch(FEATURES_URL),
    ]);

    WHITELIST = await whitelistRes.json();
    BLACKLIST = await blacklistRes.json();
    FEATURES = await featuresRes.json();
  } catch (error) {
    console.warn(
      "[diagnosisSanitizer] Could not load config files, sanitization disabled",
      error,
    );
    WHITELIST = [];
    BLACKLIST = [];
    FEATURES = { sidebar_sanitize: false };
  }
}

/**
 * Synchronously load config if available (for non-async contexts)
 * Falls back to empty arrays if not yet loaded
 */
function getConfigSync() {
  if (WHITELIST === null) {
    // Not loaded yet, return safe defaults (no filtering)
    return {
      whitelist: new Set(),
      blacklist: new Set(),
      enabled: false,
    };
  }

  const WL = new Set(WHITELIST.map(norm));
  const BL = new Set(BLACKLIST.map(norm));

  return {
    whitelist: WL,
    blacklist: BL,
    enabled: FEATURES.sidebar_sanitize === true,
  };
}

/**
 * Filter diagnosis list to remove non-medical items
 * @param {Array} allItems - Array of diagnosis objects or strings
 * @returns {Array} Filtered array with medical diagnoses only
 */
export function sanitizeDiagnosesList(allItems) {
  const config = getConfigSync();

  if (!config.enabled) {
    // Feature disabled, return all items unchanged
    console.debug("[sidebar] Sanitization disabled by feature flag");
    return allItems;
  }

  const before = allItems.length;
  console.debug(
    `[sidebar] Filtering ${before} items (whitelist: ${config.whitelist.size}, blacklist: ${config.blacklist.size})`,
  );

  const filtered = allItems.filter((item) => {
    // Extract label/name from item (handles both objects and strings)
    const label = norm(item.label || item.name || item.toString());

    // Hard exclude if in blacklist
    if (config.blacklist.has(label)) {
      console.debug(`[sidebar] BLOCKED by blacklist: "${item.name || item}"`);
      return false;
    }

    // If whitelist exists, only allow known medical items
    if (config.whitelist.size > 0) {
      const allowed = config.whitelist.has(label);
      if (!allowed) {
        console.debug(`[sidebar] NOT in whitelist: "${item.name || item}"`);
      }
      return allowed;
    }

    // No whitelist = allow all (except blacklist)
    return true;
  });

  const removed = before - filtered.length;
  console.debug(
    `[sidebar] Filtered ${removed} non-medical items (${before} -> ${filtered.length})`,
  );

  return filtered;
}

/**
 * Initialize sanitizer (preload config)
 * Call this on page load
 * @returns {Promise<void>}
 */
export async function initDiagnosisSanitizer() {
  await loadConfig();
  console.debug("[sidebar] Diagnosis sanitizer initialized");
}

/**
 * Check if an individual diagnosis should be visible
 * @param {string|Object} item - Diagnosis item
 * @returns {boolean} True if item should be displayed
 */
export function isDiagnosisVisible(item) {
  const config = getConfigSync();

  if (!config.enabled) {
    return true;
  }

  const label = norm(item.label || item.name || item.toString());

  if (config.blacklist.has(label)) {
    return false;
  }

  if (config.whitelist.size > 0) {
    return config.whitelist.has(label);
  }

  return true;
}

export default {
  sanitizeDiagnosesList,
  initDiagnosisSanitizer,
  isDiagnosisVisible,
};
