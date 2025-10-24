/**
 * Debug Logger Utility
 * 
 * Provides conditional logging that only outputs in development mode.
 * Prevents console.log clutter in production builds.
 * 
 * Usage:
 * ```ts
 * import { debugLog, debugWarn, debugError } from './src/utils/logger.js';
 * debugLog('Parsing note:', noteText);  // Only logs in dev mode
 * console.error('Critical error');      // Always logs (use for real errors)
 * ```
 */

import { config } from '../../config/environment.js';

/**
 * Log debug information (development only)
 * @param args - Arguments to log
 */
export function debugLog(...args: unknown[]): void {
  if (config.debugMode) {
    console.log(...args);
  }
}

/**
 * Log warning (development only)
 * @param args - Arguments to log
 */
export function debugWarn(...args: unknown[]): void {
  if (config.debugMode) {
    console.warn(...args);
  }
}

/**
 * Log error (always logs, even in production)
 * @param args - Arguments to log
 */
export function debugError(...args: unknown[]): void {
  console.error(...args);
}

/**
 * Log information (development only)
 * @param args - Arguments to log
 */
export function debugInfo(...args: unknown[]): void {
  if (config.debugMode) {
    console.info(...args);
  }
}

/**
 * Log table (development only)
 * @param data - Data to display as table
 * @param columns - Optional column names
 */
export function debugTable(data: unknown, columns?: string[]): void {
  if (config.debugMode) {
    console.table(data, columns);
  }
}

/**
 * Start a performance timer (development only)
 * @param label - Timer label
 */
export function debugTimeStart(label: string): void {
  if (config.debugMode) {
    console.time(label);
  }
}

/**
 * End a performance timer (development only)
 * @param label - Timer label
 */
export function debugTimeEnd(label: string): void {
  if (config.debugMode) {
    console.timeEnd(label);
  }
}

/**
 * Group console output (development only)
 * @param label - Group label
 * @param fn - Function to execute within group
 */
export function debugGroup(label: string, fn: () => void): void {
  if (config.debugMode) {
    console.group(label);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  } else {
    fn();
  }
}

/**
 * Assert a condition and log if false (development only)
 * @param condition - Condition to check
 * @param args - Arguments to log if assertion fails
 */
export function debugAssert(condition: boolean, ...args: unknown[]): void {
  if (config.debugMode) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.assert(condition, ...(args as any[]));
  }
}

/**
 * Default export with all logging functions
 */
export default {
  log: debugLog,
  warn: debugWarn,
  error: debugError,
  info: debugInfo,
  table: debugTable,
  timeStart: debugTimeStart,
  timeEnd: debugTimeEnd,
  group: debugGroup,
  assert: debugAssert
};
