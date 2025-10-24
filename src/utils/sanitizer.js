/**
 * Minimal Sanitizer for Clinical Note Input
 *
 * Properly sanitizes HTML by escaping dangerous characters to prevent XSS attacks.
 * Used for sanitizing user input in clinical notes and other text fields.
 */
/**
 * Sanitize a string by escaping HTML special characters
 *
 * @param input - The string to sanitize
 * @returns The sanitized string with HTML characters escaped
 *
 * @example
 * ```ts
 * sanitize('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * ```
 */
export function sanitize(input) {
    if (typeof input !== 'string')
        return '';
    // Escape HTML characters to prevent XSS
    const escaped = input
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#x27;')
        .replaceAll('/', '&#x2F;');
    return escaped.trim();
}
//# sourceMappingURL=sanitizer.js.map