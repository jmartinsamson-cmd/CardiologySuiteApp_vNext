// CommonJS version of Data validation utility for Cardiology Suite
async function validateAndCleanJSON(text) {
  // If it's already valid JSON, return as-is (do not mutate valid content)
  try {
    JSON.parse(text);
    return text;
  } catch {
    // fall through to cleaning steps
  }

  // Remove potential BOM and normalize line endings
  let cleaned = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // Fix common JSON syntax issues (best effort; use cautiously)
  cleaned = cleaned
    // 1) Remove stray backslash before the closing quote of a property name: "name\": -> "name":
    //    Matches any simple quoted key ending with an escaped quote before the colon
    .replace(/"([^"\\]*)\\"(\s*:)/g, '"$1"$2')
    // 2) Remove trailing commas before } or ]
    .replace(/,(\s*[}\]])/g, "$1");

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {
    const lines = cleaned.split("\n");
    let pos = 0;
    const match = e.message.match(/position (\d+)/);
    if (match) {
      const errorPos = parseInt(match[1]);
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
      const context = [];
      for (
        let i = Math.max(0, lineNo - 3);
        i < Math.min(lines.length, lineNo + 2);
        i++
      ) {
        context.push(`${i + 1}: ${lines[i]}`);
        if (i === lineNo - 1) {
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

module.exports = { validateAndCleanJSON };
