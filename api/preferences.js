/* eslint-env node */
/* global process */
/**
 * Azure Static Web Apps API - User Preferences
 * GET /api/preferences?userId=xxx
 * POST /api/preferences { userId: string, preferences: object }
 */

import { getUserPreferences, saveUserPreferences } from '../table-storage-config.js';

export default async function handler(req, context) {
  try {
    if (req.method === 'GET') {
      // Get preferences
      const url = new URL(req.url);
      const userId = url.searchParams.get('userId');

      if (!userId) {
        return {
          status: 400,
          jsonBody: { error: 'Missing userId parameter' }
        };
      }

      const preferences = await getUserPreferences(userId);

      return {
        status: 200,
        jsonBody: preferences || { userId, preferences: {} }
      };

    } else if (req.method === 'POST') {
      // Save preferences
      const { userId, preferences } = await req.json();

      if (!userId || !preferences) {
        return {
          status: 400,
          jsonBody: { error: 'Missing userId or preferences' }
        };
      }

      const result = await saveUserPreferences(userId, preferences);

      return {
        status: 200,
        jsonBody: {
          success: true,
          preferences: result
        }
      };

    } else {
      return {
        status: 405,
        jsonBody: { error: 'Method not allowed' }
      };
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
