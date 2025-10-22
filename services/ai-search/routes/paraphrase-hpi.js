/* eslint-env node */
/* global console */
/**
 * Paraphrase HPI endpoint - Uses GPT-4o-mini to paraphrase clinical HPI text
 * with auto-discovery and graceful fallback to rule-based paraphrasing
 */

import { paraphraseHPI, getHpiStatus } from "../helpers/hpi-paraphraser.js";

/**
 * Register paraphrase-hpi routes
 * @param {import('express').Express} app
 */
export default function registerParaphraseHPIRoutes(app) {
  app.post("/api/paraphrase-hpi", async (req, res) => {
    const { hpi } = req.body;

    if (!hpi || typeof hpi !== "string" || hpi.length < 50) {
      return res.status(400).json({ 
        ok: false, 
        error: "Invalid HPI: must be a string with at least 50 characters" 
      });
    }

    try {
      const result = await paraphraseHPI(hpi);
      return res.json(result);

    } catch (/** @type {any} */ error) {
      console.error("[paraphrase-hpi] Error:", error?.message || String(error));
      
      return res.status(500).json({ 
        ok: false, 
        error: error?.message || "Paraphrase failed" 
      });
    }
  });

  // Diagnostics endpoint to check HPI paraphrasing status
  app.get("/api/paraphrase-hpi/status", (req, res) => {
    const status = getHpiStatus();
    res.json(status);
  });
}
