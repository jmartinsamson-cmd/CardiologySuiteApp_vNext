/* eslint-env node */
/**
 * Azure Static Web Apps API - Save Clinical Session
 * POST /api/sessions/save
 * 
 * Body: { userId: string, sessionData: object }
 * NO PHI allowed - only preferences and UI state
 */

import { saveClinicalSession } from '../table-storage-config.js';
import { validatePayload, SCHEMAS } from '../validation.js';

export default async function handler(request, context) {
  // Only allow POST
  if ((request.method || request?.method) !== 'POST') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  try {
    const body = (typeof request.json === 'function') ? await request.json() : (request.body || {});

    // Validate payload
    const validation = validatePayload(body, SCHEMAS.sessionSave);
    if (!validation.valid) {
      return {
        status: 400,
        jsonBody: {
          error: 'Invalid payload',
          details: validation.errors
        }
      };
    }

    const { userId, sessionData } = body;

    const result = await saveClinicalSession(userId, sessionData);

    return {
      status: 200,
      jsonBody: {
        success: true,
        sessionId: result.rowKey,
        message: 'Session saved successfully'
      }
    };

  } catch (error) {
    context.log('[API] Error saving session:', error);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to save session',
        message: error.message
      }
    };
  }
}
