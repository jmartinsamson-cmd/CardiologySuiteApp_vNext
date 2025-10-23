/* eslint-env node */
/* global process */
/**
 * Azure Static Web Apps API - Save Clinical Session
 * POST /api/sessions/save
 * 
 * Body: { userId: string, sessionData: object }
 * NO PHI allowed - only preferences and UI state
 */

import { saveClinicalSession } from '../table-storage-config.js';

export default async function handler(req, context) {
  // Only allow POST
  if (req.method !== 'POST') {
    return {
      status: 405,
      jsonBody: { error: 'Method not allowed' }
    };
  }

  try {
    const { userId, sessionData } = await req.json();

    if (!userId || !sessionData) {
      return {
        status: 400,
        jsonBody: { error: 'Missing userId or sessionData' }
      };
    }

    // Save to Cosmos DB
    const result = await saveClinicalSession(userId, sessionData);

    return {
      status: 200,
      jsonBody: {
        success: true,
        sessionId: result.id,
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
