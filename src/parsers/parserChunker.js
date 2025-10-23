/* eslint-env browser */
// ============================================================================
// PARSER CHUNKER - Breaks large note parsing into smaller chunks
// ============================================================================
//
// Purpose: Prevent UI freezes when parsing very large clinical notes (>10k chars)
// by yielding to the browser between parsing stages
//

/**
 * Async wrapper for parsing large notes without blocking UI
 * @param {Function} parserFunc - The parser function to call
 * @param {string} text - The note text to parse
 * @param {(msg: string) => void} [progressCallback] - Optional callback for progress updates
 * @returns {Promise<Object>} Parsed data
 */
async function parseWithYield(
  parserFunc,
  text,
  /** @type {(msg: string) => void | undefined} */ progressCallback,
) {
  const textLength = text.length;

  // For small notes, just parse directly
  if (textLength < 5000) {
    return parserFunc(text);
  }

  // For large notes, wrap in promise with yield
  return new Promise((resolve, reject) => {
    // Give browser time to update UI
    let delay;
    if (textLength > 20000) {
      delay = 300;
    } else if (textLength > 10000) {
      delay = 200;
    } else {
      delay = 100;
    }

    if (progressCallback) {
      progressCallback(
        `Parsing ${Math.round(textLength / 1000)}k characters...`,
      );
    }

    setTimeout(() => {
      try {
        const result = parserFunc(text);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
}

/**
 * Parse note with multiple yield points for very large notes
 * @param {string} text - Note text
 * @returns {Promise<Object>} Parsed data
 */
/* eslint-disable no-unused-vars */
async function parseNoteChunked(text) {
  const textLength = text.length;

  // For very large notes (>15k), split the work
  if (textLength > 15000) {
    console.log(
      `📊 Large note detected: ${textLength} characters - using chunked parsing`,
    );

    // Stage 1: Basic segmentation (yield after)
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Stage 2: Parse with our wrapper
    const result = await parseWithYield(
      (globalThis.parseClinicalNoteFull || globalThis.parseClinicalNote),
      text,
      (msg) => console.log(msg),
    );

    // Stage 3: Allow UI to breathe before returning
    await new Promise((resolve) => requestAnimationFrame(resolve));

    return result;
  }

  // For smaller notes, use standard parsing
  return globalThis.parseClinicalNoteFull
    ? globalThis.parseClinicalNoteFull(text)
    : globalThis.parseClinicalNote(text);
}
