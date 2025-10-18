/**
 * Regex utility functions
 */

/**
 * Ensure a regex has the global flag to prevent infinite loops in matchAll
 * @param {RegExp} re - Regular expression
 * @returns {RegExp} RegExp with global flag added
 */
export function withGlobal(re: RegExp): RegExp {
  const f = re.flags.includes('g') ? re.flags : re.flags + 'g';
  return new RegExp(re.source, f);
}
