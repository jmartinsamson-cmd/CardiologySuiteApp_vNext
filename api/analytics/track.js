/* eslint-env node */
/**
 * Azure Static Web Apps API - Track Analytics Event
 * POST /api/analytics/track
 * 
 * Body: { eventType: string, metadata: object }
 * Anonymized usage analytics only - NO PHI
 */

import { trackEvent } from '../table-storage-config.js';

export default async function handler(context, req) {
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
    const { eventType, metadata = {} } = body;

    if (!eventType) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing eventType' })
      };
      return;
    }

    const result = await trackEvent(eventType, metadata);

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        eventId: result.rowKey
      })
    };
    return;

  } catch (error) {
    context.log('[API] Error tracking event:', error);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to track event',
        message: error.message
      })
    };
    return;
  }
}
