/* eslint-env node */
/* global console */

/**
 * Medical Q&A route using Prompty pattern with RAG
 * Implements /api/medical-qa endpoint
 */

import { answerMedicalQuestion, answerMultipleQuestions } from "../medical-qa.js";

/**
 * Register medical Q&A routes
 * @param {import('express').Application} app - Express app
 */
export default function registerMedicalQARoutes(app) {
  
  /**
   * POST /api/medical-qa
   * Body: { question: string, maxSources?: number, temperature?: number }
   * Returns: { answer, sources, confidence, retrieval, latency }
   */
  app.post("/api/medical-qa", async (req, res) => {
    try {
      const { question, maxSources, temperature } = req.body || {};
      
      if (!question || typeof question !== "string") {
        return res.status(400).json({
          ok: false,
          error: "Missing or invalid 'question' field (string required)",
        });
      }
      
      const trimmed = question.trim();
      if (!trimmed) {
        return res.status(400).json({
          ok: false,
          error: "Question cannot be empty",
        });
      }
      
      const options = {};
      if (typeof maxSources === "number" && maxSources > 0) {
        options.maxSources = Math.min(maxSources, 10); // Cap at 10 sources
      }
      if (typeof temperature === "number" && temperature >= 0 && temperature <= 1) {
        options.temperature = temperature;
      }
      
      const result = await answerMedicalQuestion(trimmed, options);
      
      return res.json({
        ok: true,
        ...result,
      });
      
    } catch (error) {
      console.error("[medical-qa] Error in /api/medical-qa:", error);
      return res.status(500).json({
        ok: false,
        error: "Internal server error",
        message: error.message,
      });
    }
  });
  
  /**
   * POST /api/medical-qa/batch
   * Body: { questions: string[], maxSources?: number, temperature?: number }
   * Returns: { ok, results: Array<{ question, answer, sources, confidence }> }
   */
  app.post("/api/medical-qa/batch", async (req, res) => {
    try {
      const { questions, maxSources, temperature } = req.body || {};
      
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          ok: false,
          error: "Missing or invalid 'questions' field (non-empty array required)",
        });
      }
      
      // Validate all questions are strings
      const validQuestions = questions.filter(q => typeof q === "string" && q.trim());
      if (validQuestions.length === 0) {
        return res.status(400).json({
          ok: false,
          error: "No valid questions provided",
        });
      }
      
      // Limit batch size
      if (validQuestions.length > 10) {
        return res.status(400).json({
          ok: false,
          error: "Batch size limited to 10 questions",
        });
      }
      
      const options = {};
      if (typeof maxSources === "number" && maxSources > 0) {
        options.maxSources = Math.min(maxSources, 10);
      }
      if (typeof temperature === "number" && temperature >= 0 && temperature <= 1) {
        options.temperature = temperature;
      }
      
      const results = await answerMultipleQuestions(validQuestions, options);
      
      return res.json({
        ok: true,
        count: results.length,
        results,
      });
      
    } catch (error) {
      console.error("[medical-qa] Error in /api/medical-qa/batch:", error);
      return res.status(500).json({
        ok: false,
        error: "Internal server error",
        message: error.message,
      });
    }
  });
  
  console.log("[ai-search] Medical Q&A routes registered:");
  console.log("  POST /api/medical-qa        - Answer a single medical question");
  console.log("  POST /api/medical-qa/batch  - Answer multiple questions");
}
