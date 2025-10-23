/* eslint-env node */
/**
 * Azure Static Web Apps API - User Preferences
 * GET /api/preferences?userId=xxx
 * POST /api/preferences { userId: string, preferences: object }
 */

import { getUserPreferences, saveUserPreferences } from '../table-storage-config.js';

export default async function handler(context, req) {
  try {
    if ((req.method || req?.method) === 'GET') {
      // Get preferences
      const fullUrl = req.url || (req.originalUrl || '');
  const url = new globalThis.URL(fullUrl, 'https://placeholder.local');
      const userId = url.searchParams.get('userId');

      if (!userId) {
        context.res = {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing userId parameter' })
        };
        return;
      }

      const preferences = await getUserPreferences(userId);

      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences || { userId, preferences: {} })
      };
      return;

    } else if ((req.method || req?.method) === 'POST') {
      // Save preferences
      const body = (typeof req.json === 'function') ? await req.json() : (req.body || {});
      const { userId, preferences } = body;

      if (!userId || !preferences) {
        context.res = {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing userId or preferences' })
        };
        return;
      }

      const result = await saveUserPreferences(userId, preferences);

      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          preferences: result
        })
      };
      return;

    } else {
      context.res = {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
      return;
    }

  } catch (error) {
    context.log('[API] Error with preferences:', error);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process preferences',
        message: error.message
      })
    };
    return;
  }
}
