/* eslint-env node */
/**
 * Azure Static Web Apps API - Track Analytics Event
 * POST /api/analytics/track
 * 
 * Body: { eventType: string, metadata: object }
 * Anonymized usage analytics only - NO PHI
 */

import { trackEvent } from '../table-storage-config.js';
import { validatePayload, SCHEMAS } from '../validation.js';

export default async function handler(request, context) {
  if ((request.method || request?.method) !== 'POST') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  try {
    const body = (typeof request.json === 'function') ? await request.json() : (request.body || {});

    // Validate payload
    const validation = validatePayload(body, SCHEMAS.analyticsTrack);
    if (!validation.valid) {
      return {
        status: 400,
        jsonBody: {
          error: 'Invalid payload',
          details: validation.errors
        }
      };
    }

    const { eventType, metadata = {} } = body;

    const result = await trackEvent(eventType, metadata);

    return {
      status: 200,
      jsonBody: {
        success: true,
        eventId: result.rowKey
      }
    };

  } catch (error) {
    context.log('[API] Error tracking event:', error);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to track event',
        message: error.message
      }
    };
  }
}
