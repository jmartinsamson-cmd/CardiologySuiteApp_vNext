/**
 * Azure OpenAI normalization with schema validation
 */

import { request } from 'undici';
import { z } from 'zod';
import { log } from './log.js';
import type { RawItem } from './acc-item.js';

// Zod schema for normalized output
const NormalizedItemSchema = z.object({
  source: z.literal('ACC'),
  section: z.enum(['Journal Scan', 'Clinical Trial', 'Article', 'Guideline', 'Update', 'Other']),
  sourceUrl: z.string().url(),
  title: z.string(),
  pubDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  authors: z.array(z.string()),
  studyType: z.enum(['RCT', 'Meta-analysis', 'Observational', 'Guideline', 'Expert Analysis']).nullable(),
  keyFindings: z.array(z.string()),
  clinicalTakeaways: z.array(z.string()),
  links: z.array(z.object({
    label: z.enum(['DOI', 'PDF', 'Full text', 'ClinicalTrials.gov', 'Guideline']),
    url: z.string().url()
  }))
});

export type NormalizedItem = z.infer<typeof NormalizedItemSchema>;

interface NormalizeConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
}

/**
 * Get Azure OpenAI configuration from environment
 */
function getConfig(): NormalizeConfig {
  const endpoint = process.env.AOAI_ENDPOINT;
  const apiKey = process.env.AOAI_KEY;
  const deployment = process.env.AOAI_DEPLOYMENT;

  if (!endpoint || !apiKey || !deployment) {
    throw new Error('Missing Azure OpenAI configuration (AOAI_ENDPOINT, AOAI_KEY, AOAI_DEPLOYMENT)');
  }

  return { endpoint, apiKey, deployment };
}

/**
 * Call Azure OpenAI Chat Completions API
 */
async function callAzureOpenAI(
  prompt: string,
  config: NormalizeConfig,
  maxRetries: number = 2
): Promise<string> {
  const url = `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=2025-01-01-preview`;

  const body = JSON.stringify({
    messages: [
      {
        role: 'system',
        content: 'You are a medical information extraction assistant. Extract structured data from clinical content and return valid JSON only. Be precise and conservative - use null if information is unknown.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0,
    max_tokens: 2000,
    response_format: { type: 'json_object' }
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.apiKey
        },
        body
      });

      const responseBody = await response.body.json();

      if (response.statusCode !== 200) {
        throw new Error(`Azure OpenAI API error: ${response.statusCode} - ${JSON.stringify(responseBody)}`);
      }

      const content = (responseBody as any).choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in Azure OpenAI response');
      }

      return content;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000) + Math.random() * 1000;
        log.warn('Azure OpenAI call failed, retrying', {
          attempt,
          error: lastError.message,
          backoffMs
        });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error('Azure OpenAI call failed');
}

/**
 * Create normalization prompt for a raw item
 */
function createPrompt(raw: RawItem): string {
  const linksJson = raw.links.length > 0 ? JSON.stringify(raw.links) : '[]';
  
  return `Extract and normalize the following medical article information into JSON format.

**Input:**
Title: ${raw.rawTitle}
Date: ${raw.rawDate || 'unknown'}
URL: ${raw.itemUrl}
Section: ${raw.section}
Authors: ${raw.authors.join(', ') || 'unknown'}
Links: ${linksJson}
Body excerpt: ${raw.rawBody}

**Required JSON schema:**
{
  "source": "ACC",
  "section": "Journal Scan|Clinical Trial|Article|Guideline|Update|Other",
  "sourceUrl": "${raw.itemUrl}",
  "title": "normalized title",
  "pubDate": "YYYY-MM-DD",
  "authors": ["author names"],
  "studyType": "RCT|Meta-analysis|Observational|Guideline|Expert Analysis|null",
  "keyFindings": ["finding 1", "finding 2", ...],
  "clinicalTakeaways": ["takeaway 1", "takeaway 2", ...],
  "links": [{"label": "DOI|PDF|Full text|ClinicalTrials.gov|Guideline", "url": "..."}]
}

**Rules:**
- Use null for studyType if unknown
- Include 2-5 keyFindings if available
- Include 1-3 clinicalTakeaways if available
- Only include links from the provided links array
- Ensure pubDate is in YYYY-MM-DD format
- Map section to closest match from allowed values

Return ONLY the JSON object, no explanation.`;
}

/**
 * Normalize a single raw item using Azure OpenAI
 */
export async function normalizeItem(raw: RawItem): Promise<NormalizedItem | null> {
  const config = getConfig();
  
  try {
    const prompt = createPrompt(raw);
    const responseText = await callAzureOpenAI(prompt, config);

    // Parse and validate JSON
    const parsed = JSON.parse(responseText);
    const validated = NormalizedItemSchema.parse(parsed);

    log.debug('Item normalized successfully', { url: raw.itemUrl });
    return validated;

  } catch (error) {
    log.error('Failed to normalize item', {
      url: raw.itemUrl,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Normalize items in batches
 */
export async function normalizeItems(rawItems: RawItem[], batchSize: number = 1): Promise<NormalizedItem[]> {
  const results: NormalizedItem[] = [];
  
  for (let i = 0; i < rawItems.length; i += batchSize) {
    const batch = rawItems.slice(i, i + batchSize);
    
    for (const raw of batch) {
      const normalized = await normalizeItem(raw);
      if (normalized) {
        results.push(normalized);
      }
    }
    
    log.info('Batch normalized', {
      batch: Math.floor(i / batchSize) + 1,
      processed: Math.min(i + batchSize, rawItems.length),
      total: rawItems.length
    });
  }

  return results;
}
