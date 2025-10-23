/**
 * Azure Blob Storage upload utility
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { log } from './log.js';
import type { NormalizedItem } from './normalize.js';

interface UploadResult {
  blobPath: string;
  url: string;
  uploadedAt: string;
}

/**
 * Get Blob Service Client from connection string
 */
function getBlobServiceClient(): BlobServiceClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is required');
  }

  return BlobServiceClient.fromConnectionString(connectionString);
}

/**
 * Upload normalized items to Blob Storage
 * @param items - Array of normalized items
 * @param yearMonth - Target year-month (YYYY-MM)
 * @returns Upload result with blob path
 */
export async function uploadToBlob(
  items: NormalizedItem[],
  yearMonth: string
): Promise<UploadResult> {
  const containerName = process.env.BLOB_CONTAINER || 'cards-updates';
  const blobName = `acc-updates/${yearMonth}/updates.json`;

  log.info('Uploading to blob storage', {
    container: containerName,
    blobName,
    itemCount: items.length
  });

  // Support dry-run mode
  if (process.env.DRY_RUN === 'true') {
    log.info('DRY_RUN mode - skipping actual upload');
    return {
      blobPath: `${containerName}/${blobName}`,
      url: `https://storage.example.com/${containerName}/${blobName}`,
      uploadedAt: new Date().toISOString()
    };
  }

  try {
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob' // Public read access
    });

    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Prepare JSON content
    const content = JSON.stringify(items, null, 2);
    const buffer = Buffer.from(content, 'utf-8');

    // Upload with metadata
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/json',
        blobCacheControl: 'public, max-age=3600'
      },
      metadata: {
        itemCount: items.length.toString(),
        uploadedAt: new Date().toISOString(),
        source: 'acc-scraper'
      }
    });

    const uploadedAt = new Date().toISOString();
    const url = blockBlobClient.url;

    log.info('Upload completed', {
      blobPath: blobName,
      url,
      itemCount: items.length,
      sizeBytes: buffer.length
    });

    return {
      blobPath: blobName,
      url,
      uploadedAt
    };

  } catch (error) {
    log.error('Failed to upload to blob storage', {
      container: containerName,
      blobName,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
