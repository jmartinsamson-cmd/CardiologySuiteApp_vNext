/* eslint-env node */
/* global process */
/**
 * Azure Static Web Apps API - Track Analytics Event
 * POST /api/analytics/track
 * 
 * Body: { eventType: string, metadata: object }
 * Anonymized usage analytics only - NO PHI
 */

import { trackEvent } from '../table-storage-config.js';

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return {
      status: 405,
      jsonBody: { error: 'Method not allowed' }
    };
  }

  try {
    const { eventType, metadata = {} } = await req.json();

    if (!eventType) {
      return {
        status: 400,
        jsonBody: { error: 'Missing eventType' }
      };
    }

    // Track event in Cosmos DB
    const result = await trackEvent(eventType, metadata);

    return {
      status: 200,
      jsonBody: {
        success: true,
        eventId: result.id
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
