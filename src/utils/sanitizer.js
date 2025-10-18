// Minimal sanitizer for clinical note input
// You can expand this to strip dangerous HTML, etc.
export function sanitize(input) {
	if (typeof input !== 'string') return '';
	// Remove script/style tags and trim whitespace (expand as needed)
	return input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
							.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
							.trim();
}
