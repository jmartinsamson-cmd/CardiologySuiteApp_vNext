// Data validation utility for Cardiology Suite
async function validateAndCleanJSON(text) {
  // Remove potential BOM and normalize line endings
  let cleaned = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // Fix common JSON syntax issues
  cleaned = cleaned
    // Fix unescaped quotes in strings
    .replace(
      /(?<!\\)"([^"]*?)"/g,
      (_, content) => `"${content.replace(/"/g, '\\"')}"`,
    )
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, "$1")
    // Fix missing quotes around property names
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

  try {
    // Test if the cleaned JSON is valid
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {
    // If still invalid, try to locate the error
    const lines = cleaned.split("\n");
    let pos = 0;

    // Extract position from error message
    const match = e.message.match(/position (\d+)/);
    if (match) {
      const errorPos = parseInt(match[1]);

      // Find the line number and character
      let lineNo = 0;
      let charPos = 0;
      for (let i = 0; i < lines.length; i++) {
        if (pos + lines[i].length >= errorPos) {
          lineNo = i + 1;
          charPos = errorPos - pos;
          break;
        }
        pos += lines[i].length + 1; // +1 for \n
      }

      // Get context around the error
      const context = [];
      for (
        let i = Math.max(0, lineNo - 3);
        i < Math.min(lines.length, lineNo + 2);
        i++
      ) {
        context.push(`${i + 1}: ${lines[i]}`);
        if (i === lineNo - 1) {
          // Add pointer to error position
          context.push(" ".repeat(charPos + 3) + "^");
        }
      }

      throw new Error(
        `JSON Syntax Error at line ${lineNo}, char ${charPos}:\n${context.join("\n")}`,
      );
    }
    throw e;
  }
}

// Export function for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateAndCleanJSON };
}
