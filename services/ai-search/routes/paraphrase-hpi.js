/* eslint-env node */
/* global process */
/**
 * Paraphrase HPI endpoint - Uses GPT-4o-mini to paraphrase clinical HPI text
 * Fail-soft endpoint for UI; returns error if AI unavailable
 */

import { getOpenAIClient } from "../helpers/gpt4-analyzer.js";
import { withBackoff } from "../helpers/retry.js";
import { logAIEvent } from "../helpers/telemetry.js";

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
      const client = getOpenAIClient();
      if (!client) {
        return res.status(503).json({ 
          ok: false, 
          error: "OpenAI client not configured" 
        });
      }

      // Paraphrase prompt
      const systemPrompt = `You are a clinical documentation assistant. Your task is to paraphrase the provided History of Present Illness (HPI) into a clear, professional, third-person medical narrative. Maintain all clinical details, preserve medical terminology, and ensure the output is concise and suitable for a progress note. Do not add any information not present in the original text.`;

      const userPrompt = `Paraphrase the following HPI:\n\n${hpi}`;

      // Call OpenAI with backoff retry
      // For Azure OpenAI, use the HPI-specific deployment name (configurable)
      const deployment = process.env.AZURE_OPENAI_HPI_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini";
      console.log(`[paraphrase-hpi] Using deployment: ${deployment}`);
      
      const startTime = Date.now();
      const completion = await withBackoff(
        async () => {
          return await client.chat.completions.create({
            model: deployment,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 1000,
          });
        },
        {
          retries: 2,
          baseMs: 500,
          maxMs: 5000,
          retryOn: (err) => {
            const status = err?.status || err?.response?.status;
            return status === 429 || (status >= 500 && status < 600);
          },
        }
      );

      const paraphrased = completion.choices[0]?.message?.content?.trim() || "";
      const latency = Date.now() - startTime;

      // Log telemetry
      logAIEvent("paraphrase_hpi", {
        originalLength: hpi.length,
        paraphrasedLength: paraphrased.length,
        latencyMs: latency,
        model: "gpt-4o-mini",
      });

      return res.json({ ok: true, paraphrased });

    } catch (/** @type {any} */ error) {
      console.error("[paraphrase-hpi] Error:", error?.message || String(error));
      
      logAIEvent("paraphrase_hpi_error", {
        errorMessage: error?.message || "Unknown error",
      });

      return res.status(500).json({ 
        ok: false, 
        error: error?.message || "Paraphrase failed" 
      });
    }
  });
}
