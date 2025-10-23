/* eslint-env node */
/**
 * Azure Static Web Apps API - Save Clinical Session
 * POST /api/sessions/save
 * 
 * Body: { userId: string, sessionData: object }
 * NO PHI allowed - only preferences and UI state
 */

import { saveClinicalSession } from '../table-storage-config.js';

export default async function handler(context, req) {
  // Only allow POST
  if ((req.method || req?.method) !== 'POST') {
    context.res = {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
    return;
  }

  try {
    const body = (typeof req.json === 'function') ? await req.json() : (req.body || {});
    const { userId, sessionData } = body;

    if (!userId || !sessionData) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing userId or sessionData' })
      };
      return;
    }

    const result = await saveClinicalSession(userId, sessionData);

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        sessionId: result.rowKey,
        message: 'Session saved successfully'
      })
    };
    return;

  } catch (error) {
    context.log('[API] Error saving session:', error);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to save session',
        message: error.message
      })
    };
    return;
  }
}
