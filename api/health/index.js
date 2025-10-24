/* eslint-env node */
/* global process */
// eslint-disable-next-line no-unused-vars
export default async function handler(_request, _context) {
  const startTime = Date.now();

  // Check storage environment
  const storageEnv = {
    hasAppInsightsKey: Boolean(process.env.APPINSIGHTS_INSTRUMENTATIONKEY),
    hasStorageConn: Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING),
    hasStorageAccount: Boolean(process.env.AZURE_STORAGE_ACCOUNT),
    hasStorageKey: Boolean(process.env.AZURE_STORAGE_KEY),
    hasCosmosEndpoint: Boolean(process.env.COSMOS_ENDPOINT || process.env.AZURE_COSMOS_ENDPOINT),
    hasCosmosKey: Boolean(process.env.COSMOS_KEY || process.env.AZURE_COSMOS_KEY)
  };

  // Probe dependencies
  const dependencyChecks = await probeDependencies();

  const responseTime = Date.now() - startTime;
  const allDepsHealthy = Object.values(dependencyChecks).every(check => check.healthy);

  const info = {
    ok: allDepsHealthy,
    runtime: 'node',
    node: process.version,
    responseTime: `${responseTime}ms`,
    timestamp: new Date().toISOString(),
    env: storageEnv,
    dependencies: dependencyChecks
  };

  const statusCode = allDepsHealthy ? 200 : 503; // 503 Service Unavailable if deps are down

  return {
    status: statusCode,
    jsonBody: info
  };
}

// Probe external dependencies
async function probeDependencies() {
  const checks = {
    tableStorage: { healthy: false, latency: null, error: null },
    cosmosDb: { healthy: false, latency: null, error: null }
  };

  // Probe Table Storage
  try {
    const start = Date.now();
    const { getTableClient, TABLES } = await import('./table-storage-config.js');
    const tableClient = getTableClient(TABLES.SESSIONS);

    // Simple existence check (doesn't create table)
    await tableClient.getTableProperties();
    checks.tableStorage.healthy = true;
    checks.tableStorage.latency = Date.now() - start;
  } catch (error) {
    checks.tableStorage.error = error.message;
    checks.tableStorage.latency = Date.now() - start;
  }

  // Probe Cosmos DB
  try {
    const start = Date.now();
    const { getCosmosClient } = await import('./cosmos-config.js');
    const client = getCosmosClient();

    if (client) {
      // Simple connectivity check - list databases (should work with read permissions)
      const iterator = client.databases.readAll();
      await iterator.fetchNext(); // Just check we can connect
      checks.cosmosDb.healthy = true;
    } else {
      checks.cosmosDb.error = 'Cosmos client not initialized - missing credentials';
    }
    checks.cosmosDb.latency = Date.now() - start;
  } catch (error) {
    checks.cosmosDb.error = error.message;
    checks.cosmosDb.latency = Date.now() - start;
  }

  return checks;
}
