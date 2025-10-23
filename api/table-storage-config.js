/* eslint-env node */
/* global process, console */
/**
 * Azure Table Storage Configuration - 100% FREE Alternative to Cosmos DB
 * Uses existing storage account (cardiologysuitepub)
 * 
 * Benefits:
 * - Completely FREE (included in storage account)
 * - Simple key-value store
 * - Perfect for sessions, preferences, analytics
 * - NO Cosmos DB quotas or limits
 */

import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';

const accountName = process.env.AZURE_STORAGE_ACCOUNT || 'cardiologysuitepub';
const accountKey = process.env.AZURE_STORAGE_KEY;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Table names
export const TABLES = {
  SESSIONS: 'clinicalsessions',
  PREFERENCES: 'userpreferences',
  ANALYTICS: 'analyticsevents',
  TEMPLATES: 'clinicaltemplates'
};

/**
 * Get Table Client
 * @param {string} tableName
 * @returns {TableClient}
 */
function getTableClient(tableName) {
  if (connectionString) {
    return TableClient.fromConnectionString(connectionString, tableName);
  } else if (accountKey) {
    const credential = new AzureNamedKeyCredential(accountName, accountKey);
    return new TableClient(
      `https://${accountName}.table.core.windows.net`,
      tableName,
      credential
    );
  } else {
    throw new Error('Azure Storage credentials not configured');
  }
}

/**
 * Create table if it doesn't exist
 * @param {string} tableName
 */
async function ensureTable(tableName) {
  try {
    const client = getTableClient(tableName);
    await client.createTable();
    console.log(`[Table Storage] Created table: ${tableName}`);
  } catch (error) {
    if (error.statusCode === 409) {
      // Table already exists
      console.log(`[Table Storage] Table exists: ${tableName}`);
    } else {
      console.error(`[Table Storage] Error creating table:`, error);
    }
  }
}

/**
 * Save clinical session (NO PHI!)
 * @param {string} userId - Anonymized user ID
 * @param {object} sessionData - Session data
 * @returns {Promise<object>}
 */
export async function saveClinicalSession(userId, sessionData) {
  await ensureTable(TABLES.SESSIONS);
  const client = getTableClient(TABLES.SESSIONS);

  const entity = {
    partitionKey: userId,
    rowKey: `session-${Date.now()}`,
    ...sessionData,
    timestamp: new Date().toISOString()
  };

  await client.createEntity(entity);
  return entity;
}

/**
 * Get user preferences
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getUserPreferences(userId) {
  await ensureTable(TABLES.PREFERENCES);
  const client = getTableClient(TABLES.PREFERENCES);

  try {
    const entity = await client.getEntity(userId, 'preferences');
    return entity;
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Save user preferences
 * @param {string} userId
 * @param {object} preferences
 * @returns {Promise<object>}
 */
export async function saveUserPreferences(userId, preferences) {
  await ensureTable(TABLES.PREFERENCES);
  const client = getTableClient(TABLES.PREFERENCES);

  const entity = {
    partitionKey: userId,
    rowKey: 'preferences',
    ...preferences,
    updatedAt: new Date().toISOString()
  };

  await client.upsertEntity(entity, 'Replace');
  return entity;
}

/**
 * Track analytics event (anonymized)
 * @param {string} eventType
 * @param {object} metadata
 * @returns {Promise<object>}
 */
export async function trackEvent(eventType, metadata = {}) {
  await ensureTable(TABLES.ANALYTICS);
  const client = getTableClient(TABLES.ANALYTICS);

  const today = new Date().toISOString().split('T')[0];
  const entity = {
    partitionKey: today,
    rowKey: `${eventType}-${Date.now()}`,
    eventType,
    ...metadata,
    timestamp: new Date().toISOString()
  };

  await client.createEntity(entity);
  return entity;
}

/**
 * Get analytics for date range
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export async function getAnalytics(startDate, endDate) {
  await ensureTable(TABLES.ANALYTICS);
  const client = getTableClient(TABLES.ANALYTICS);

  const entities = client.listEntities({
    queryOptions: {
      filter: `PartitionKey ge '${startDate}' and PartitionKey le '${endDate}'`
    }
  });

  const results = [];
  for await (const entity of entities) {
    results.push(entity);
  }

  return results;
}

/**
 * Initialize all tables
 */
export async function initializeTables() {
  for (const tableName of Object.values(TABLES)) {
    await ensureTable(tableName);
  }
  console.log('[Table Storage] All tables initialized');
}

export default {
  TABLES,
  saveClinicalSession,
  getUserPreferences,
  saveUserPreferences,
  trackEvent,
  getAnalytics,
  initializeTables
};
