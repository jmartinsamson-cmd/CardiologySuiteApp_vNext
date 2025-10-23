/* eslint-env node */
/* global process */
// eslint-disable-next-line no-unused-vars
export default async function handler(_request, _context) {
  const info = {
    ok: true,
    runtime: 'node',
  node: process.version,
    env: {
      hasAppInsightsKey: Boolean(process.env.APPINSIGHTS_INSTRUMENTATIONKEY),
      hasStorageConn: Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING),
      hasStorageAccount: Boolean(process.env.AZURE_STORAGE_ACCOUNT),
      hasStorageKey: Boolean(process.env.AZURE_STORAGE_KEY)
    }
  };

  return {
    status: 200,
    jsonBody: info
  };
}
