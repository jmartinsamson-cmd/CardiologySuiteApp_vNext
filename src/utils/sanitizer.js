// Minimal sanitizer for clinical note input
// Properly sanitizes HTML by escaping dangerous characters
/**
 * @param {string} input
 * @returns {string}
 */
export function sanitize(input) {
	if (typeof input !== 'string') return '';
	
	// Escape HTML characters to prevent XSS
	const escaped = input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/\//g, '&#x2F;');
	
	return escaped.trim();
}
