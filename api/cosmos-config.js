/* eslint-env node */
/* global process, console */
/**
 * Azure Cosmos DB Configuration and Helper Functions
 * Free Tier: 400 RU/s and 25GB storage included
 */

import { CosmosClient } from '@azure/cosmos';

// Cosmos DB configuration
const endpoint = process.env.COSMOS_ENDPOINT || process.env.AZURE_COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY || process.env.AZURE_COSMOS_KEY;
const databaseId = 'cardiology-app';

// Initialize Cosmos client
let cosmosClient = null;

export function getCosmosClient() {
  if (!endpoint || !key) {
    console.warn('[Cosmos] Credentials not configured. Set COSMOS_ENDPOINT and COSMOS_KEY in environment.');
    return null;
  }
  
  if (!cosmosClient) {
    cosmosClient = new CosmosClient({ endpoint, key });
  }
  
  return cosmosClient;
}

/**
 * Get or create database and container
 * @param {string} containerId - Container name
 * @param {string} partitionKey - Partition key path (e.g., '/userId')
 * @returns {Promise<{database: any, container: any}>}
 */
export async function getContainer(containerId, partitionKey) {
  const client = getCosmosClient();
  if (!client) {
    throw new Error('Cosmos DB client not initialized');
  }

  // Create database if it doesn't exist
  const { database } = await client.databases.createIfNotExists({
    id: databaseId
  });

  // Create container if it doesn't exist
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: [partitionKey] }
  });

  return { database, container };
}

/**
 * Container configurations
 */
export const CONTAINERS = {
  SESSIONS: {
    id: 'clinical-sessions',
    partitionKey: '/userId'
  },
  NOTES: {
    id: 'parsed-notes',
    partitionKey: '/sessionId'
  },
  PREFERENCES: {
    id: 'user-preferences',
    partitionKey: '/userId'
  },
  ANALYTICS: {
    id: 'analytics-events',
    partitionKey: '/date'
  },
  TEMPLATES: {
    id: 'clinical-templates',
    partitionKey: '/templateType'
  }
};

/**
 * Save clinical session (NO PHI!)
 * @param {string} userId - Anonymized user ID
 * @param {object} sessionData - Session data (preferences, UI state)
 * @returns {Promise<object>}
 */
export async function saveClinicalSession(userId, sessionData) {
  const { container } = await getContainer(
    CONTAINERS.SESSIONS.id,
    CONTAINERS.SESSIONS.partitionKey
  );

  const item = {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    ...sessionData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const { resource } = await container.items.create(item);
  return resource;
}

/**
 * Save parsed note template (NO PHI!)
 * @param {string} sessionId - Session ID
 * @param {object} parsedNote - Anonymized parsed note
 * @returns {Promise<object>}
 */
export async function saveParsedNote(sessionId, parsedNote) {
  const { container } = await getContainer(
    CONTAINERS.NOTES.id,
    CONTAINERS.NOTES.partitionKey
  );

  const item = {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    template: parsedNote.template || 'default',
    structure: parsedNote.structure, // Just the structure, no PHI
    createdAt: new Date().toISOString()
  };

  const { resource } = await container.items.create(item);
  return resource;
}

/**
 * Track analytics event (anonymized)
 * @param {string} eventType - Event type (e.g., 'note_parsed', 'template_generated')
 * @param {object} metadata - Event metadata (no PHI)
 * @returns {Promise<object>}
 */
export async function trackEvent(eventType, metadata = {}) {
  const { container } = await getContainer(
    CONTAINERS.ANALYTICS.id,
    CONTAINERS.ANALYTICS.partitionKey
  );

  const today = new Date().toISOString().split('T')[0];
  const item = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: today,
    eventType,
    metadata,
    timestamp: new Date().toISOString()
  };

  const { resource } = await container.items.create(item);
  return resource;
}

/**
 * Get user preferences
 * @param {string} userId - User ID
 * @returns {Promise<object|null>}
 */
export async function getUserPreferences(userId) {
  const { container } = await getContainer(
    CONTAINERS.PREFERENCES.id,
    CONTAINERS.PREFERENCES.partitionKey
  );

  try {
    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId',
        parameters: [{ name: '@userId', value: userId }]
      })
      .fetchAll();

    return resources[0] || null;
  } catch (error) {
    console.error('[Cosmos] Error fetching preferences:', error);
    return null;
  }
}

/**
 * Save user preferences
 * @param {string} userId - User ID
 * @param {object} preferences - User preferences
 * @returns {Promise<object>}
 */
export async function saveUserPreferences(userId, preferences) {
  const { container } = await getContainer(
    CONTAINERS.PREFERENCES.id,
    CONTAINERS.PREFERENCES.partitionKey
  );

  const existing = await getUserPreferences(userId);

  if (existing) {
    // Update existing
    const updated = {
      ...existing,
      ...preferences,
      updatedAt: new Date().toISOString()
    };
    const { resource } = await container.item(existing.id, userId).replace(updated);
    return resource;
  } else {
    // Create new
    const item = {
      id: `pref-${userId}`,
      userId,
      ...preferences,
      createdAt: new Date().toISOString()
    };
    const { resource } = await container.items.create(item);
    return resource;
  }
}

export default {
  getCosmosClient,
  getContainer,
  CONTAINERS,
  saveClinicalSession,
  saveParsedNote,
  trackEvent,
  getUserPreferences,
  saveUserPreferences
};
