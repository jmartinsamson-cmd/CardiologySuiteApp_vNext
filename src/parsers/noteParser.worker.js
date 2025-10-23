/* eslint-env worker */
/* global self */
// ============================================================================
// NOTE PARSER WEB WORKER (Not yet implemented)
// ============================================================================
//
// Purpose: Offload heavy note parsing to a separate thread to prevent UI freezing
//
// This worker runs parsing in the background, allowing the main thread to
// remain responsive even with very large notes (>20k characters)
//
// Status: Placeholder - Web Workers require parsers to be refactored to not
//         depend on window globals. Using multiple yield points instead.

// Import parser functions (they need to be self-contained)
// Note: Web Workers can't access window object or DOM

import { debugLog, debugWarn, debugError } from "../utils/logger.js";
self.addEventListener("message", async (event) => {
  const { type, text, parserId } = event.data;

  if (type === "PARSE_NOTE") {
    try {
      debugLog(`[Worker] Starting parse for ${text.length} characters`);

      // For now, send back a message that we need the parser in the main thread
      // This is a limitation - we'll use a different approach
      self.postMessage({
        type: "ERROR",
        error: "Web Worker parsing not yet implemented - using fallback",
        parserId,
      });
    } catch (error) {
      debugError("[Worker] Parse error:", error);
      self.postMessage({
        type: "ERROR",
        error: error.message,
        parserId,
      });
    }
  }
});

debugLog("[Worker] Note parser worker initialized (placeholder)");
