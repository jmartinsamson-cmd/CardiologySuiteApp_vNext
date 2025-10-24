/* eslint-env node */
/**
 * Azure Static Web Apps API - User Preferences
 * GET /api/preferences?userId=xxx
 * POST /api/preferences { userId: string, preferences: object }
 */

import { getUserPreferences, saveUserPreferences } from '../table-storage-config.js';
import { validatePayload, SCHEMAS } from './validation.js';

export default async function handler(request, context) {
  try {
    if ((request.method || request?.method) === 'GET') {
      // Get preferences
      const fullUrl = request.url || (request.originalUrl || '');
      const url = new globalThis.URL(fullUrl, 'https://placeholder.local');
      const userId = url.searchParams.get('userId');

      // Validate userId if provided
      if (userId) {
        const validation = validatePayload({ userId }, SCHEMAS.preferencesGet);
        if (!validation.valid) {
          return {
            status: 400,
            jsonBody: {
              error: 'Invalid userId parameter',
              details: validation.errors
            }
          };
        }
      }

      if (!userId) {
        return { status: 400, jsonBody: { error: 'Missing userId parameter' } };
      }

      const preferences = await getUserPreferences(userId);
      return {
        status: 200,
        jsonBody: preferences || { userId, preferences: {} }
      };

    } else if ((request.method || request?.method) === 'POST') {
      // Save preferences
      const body = (typeof request.json === 'function') ? await request.json() : (request.body || {});

      // Validate payload
      const validation = validatePayload(body, SCHEMAS.preferencesPost);
      if (!validation.valid) {
        return {
          status: 400,
          jsonBody: {
            error: 'Invalid payload',
            details: validation.errors
          }
        };
      }

      const { userId, preferences } = body;

      const result = await saveUserPreferences(userId, preferences);
      return {
        status: 200,
        jsonBody: {
          success: true,
          preferences: result
        }
      };

    } else {
      return { status: 405, jsonBody: { error: 'Method not allowed' } };
    }

  } catch (error) {
    context.log('[API] Error with preferences:', error);
    return {
      status: 500,
      jsonBody: {
        error: 'Failed to process preferences',
        message: error.message
      }
    };
  }
}
