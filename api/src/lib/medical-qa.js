/* eslint-env node */
/* global process, console */
import dotenv from "dotenv";
import OpenAI from "openai";
import { searchGuidelines } from "./rag/azureSearchClient.js";

// Load .env for Azure OpenAI credentials (if not already loaded)
if (!process.env.AZURE_OPENAI_ENDPOINT) {
  dotenv.config();
}

let openai = null;

/**
 * Get or initialize OpenAI client (lazy initialization)
 * @returns {OpenAI} OpenAI client instance
 */
function getOpenAIClient() {
  if (openai) return openai;
  
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4.1-minisamson";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";

  if (!endpoint || !apiKey || !deployment) {
    throw new Error("Missing Azure OpenAI environment variables");
  }

  openai = new OpenAI({
    apiKey,
    baseURL: `${endpoint}/openai/deployments/${deployment}`,
    defaultQuery: { "api-version": apiVersion },
    defaultHeaders: { "api-key": apiKey },
  });
  
  return openai;
}

/**
 * Answer a medical question using RAG from indexed cardiology guidelines
 * Implements the Prompty pattern from /docs/ai/MedicalQandA.prompt.yml
 * 
 * @param {string} question - The medical question to answer
 * @param {{ maxSources?: number, temperature?: number }} options - Optional configuration
 * @returns {Promise<{
 *   answer: string,
 *   sources: Array<{title: string, url: string, score: number}>,
 *   confidence: number,
 *   retrieval: { query: string, hitsCount: number, topScore: number }
 * }>}
 */
export async function answerMedicalQuestion(question, options = {}) {
  const { maxSources = 5, temperature = 0.2 } = options;
  const startTime = Date.now();
  
  // Step 1: Retrieve relevant guideline documents using RAG
  const searchResults = await searchGuidelines(question, { topK: maxSources });
  
  if (!searchResults || searchResults.length === 0) {
    return {
      answer: "I couldn't find relevant information in the cardiology guidelines repository to answer this question.",
      sources: [],
      confidence: 0,
      retrieval: { query: question, hitsCount: 0, topScore: 0 },
      latency: Date.now() - startTime,
    };
  }
  
  // Extract context from search results
  const contextDocs = searchResults.map((doc, idx) => 
    `[Source ${idx + 1}: ${doc.title}]\n${doc.content}`
  ).join('\n\n');
  
  // Calculate retrieval quality metrics
  const topScore = searchResults[0]?.score || 0;
  const avgScore = searchResults.reduce((sum, doc) => sum + (doc.score || 0), 0) / searchResults.length;
  
  // Step 2: Generate answer using GPT-4 with RAG context
  // System prompt follows the Prompty template pattern
  const systemPrompt = `You are a cardiovascular medical assistant that provides answers to medical questions using ONLY the information from the repository files provided below.

CRITICAL RULES:
1. Base ALL answers EXCLUSIVELY on the provided guideline documents
2. If the answer is not in the provided documents, say "This information is not available in the current guidelines"
3. Always cite specific sources using [Source N] notation
4. Provide evidence-based recommendations with guideline class/level when available
5. Flag any limitations or missing information
6. Use medical terminology accurately but explain complex concepts clearly

CONTEXT FROM CARDIOLOGY GUIDELINES:
${contextDocs}

Answer format:
- Direct answer to the question
- Supporting evidence with citations [Source N]
- Guideline recommendations (ACC/AHA class I-III if applicable)
- Clinical considerations or caveats
- Reference the specific sources used`;

  try {
    const client = getOpenAIClient();
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4.1-minisamson";
    
    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature,
      max_tokens: 2000,
    });
    
    const answer = response.choices[0]?.message?.content || "";
    
    // Calculate confidence based on retrieval quality and answer characteristics
    let confidence = 0;
    
    // Factor 1: Search result quality (0-0.4)
    confidence += Math.min(0.4, (topScore / 20) * 0.4);
    
    // Factor 2: Multiple sources (0-0.2)
    confidence += Math.min(0.2, (searchResults.length / maxSources) * 0.2);
    
    // Factor 3: Answer has citations (0-0.2)
    const hasCitations = /\[Source \d+\]/.test(answer);
    confidence += hasCitations ? 0.2 : 0;
    
    // Factor 4: Average search score (0-0.2)
    confidence += Math.min(0.2, (avgScore / 15) * 0.2);
    
    confidence = Math.min(1.0, confidence);
    
    // Extract sources with metadata
    const sources = searchResults.map(doc => ({
      title: doc.title || 'Unknown',
      url: doc.url || '',
      score: doc.score || 0,
    }));
    
    return {
      answer,
      sources,
      confidence,
      retrieval: {
        query: question,
        hitsCount: searchResults.length,
        topScore,
        avgScore,
      },
      latency: Date.now() - startTime,
    };
    
  } catch (error) {
    console.error('[medical-qa] Error generating answer:', error);
    return {
      answer: "An error occurred while generating the answer. Please try again.",
      sources: [],
      confidence: 0,
      retrieval: {
        query: question,
        hitsCount: searchResults.length,
        topScore,
      },
      latency: Date.now() - startTime,
      error: error.message,
    };
  }
}

/**
 * Batch answer multiple questions (useful for educational content generation)
 * @param {string[]} questions - Array of medical questions
 * @param {{ maxSources?: number, temperature?: number }} options
 * @returns {Promise<Array<any>>}
 */
export async function answerMultipleQuestions(questions, options = {}) {
  const results = await Promise.allSettled(
    questions.map(q => answerMedicalQuestion(q, options))
  );
  
  return results.map((result, idx) => ({
    question: questions[idx],
    ...(result.status === 'fulfilled' ? result.value : { error: result.reason?.message || 'Unknown error' }),
  }));
}

// Example usage (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  const testQuestion = "Explain the signs and symptoms of an Acute Myocardial Infarction and how to treat.";
  
  console.log('Testing Medical Q&A with RAG...\n');
  console.log('Question:', testQuestion, '\n');
  
  answerMedicalQuestion(testQuestion).then(result => {
    console.log('=== ANSWER ===');
    console.log(result.answer);
    console.log('\n=== SOURCES ===');
    result.sources.forEach((src, idx) => {
      console.log(`${idx + 1}. ${src.title} (score: ${src.score.toFixed(2)})`);
      if (src.url) console.log(`   URL: ${src.url}`);
    });
    console.log('\n=== METADATA ===');
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Retrieval: ${result.retrieval.hitsCount} documents, top score ${result.retrieval.topScore.toFixed(2)}`);
    console.log(`Latency: ${result.latency}ms`);
  }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
