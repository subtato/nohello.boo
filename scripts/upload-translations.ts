#!/usr/bin/env node
/**
 * Script to upload translation files to Backblaze B2
 * 
 * Usage:
 *   npm run upload-translations
 * 
 * Environment variables required:
 *   B2_APPLICATION_KEY_ID - Your B2 application key ID
 *   B2_APPLICATION_KEY - Your B2 application key
 *   B2_BUCKET_NAME - Name of your B2 bucket
 *   B2_BUCKET_ID - Your B2 bucket ID (optional, will be looked up if not provided)
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface B2AuthResponse {
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  accountId: string;
  recommendedPartSize: number;
  absoluteMinimumPartSize: number;
}

interface B2UploadUrlResponse {
  uploadUrl: string;
  authorizationToken: string;
}

interface B2FileInfo {
  fileId: string;
  fileName: string;
  uploadTimestamp: number;
}

async function b2Authorize(
  keyId: string,
  key: string
): Promise<B2AuthResponse> {
  const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${btoa(`${keyId}:${key}`)}`,
    },
  });

  if (!response.ok) {
    throw new Error(`B2 authorization failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as B2AuthResponse;
}

async function getUploadUrl(
  apiUrl: string,
  authToken: string,
  bucketId: string
): Promise<B2UploadUrlResponse> {
  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      Authorization: authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucketId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get upload URL: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as B2UploadUrlResponse;
}

async function uploadFile(
  uploadUrl: string,
  authToken: string,
  fileName: string,
  fileContent: Buffer,
  contentType: string = 'application/json'
): Promise<B2FileInfo> {
  // Calculate SHA1 hash
  const crypto = await import('crypto');
  const sha1 = crypto.createHash('sha1').update(fileContent).digest('hex');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: authToken,
      'X-Bz-File-Name': fileName,
      'Content-Type': contentType,
      'X-Bz-Content-Sha1': sha1,
      'X-Bz-Info-Author': 'nohello-v3',
    },
    body: fileContent,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return (await response.json()) as B2FileInfo;
}

async function getBucketId(
  apiUrl: string,
  authToken: string,
  bucketName: string,
  accountId: string
): Promise<string> {
  const response = await fetch(`${apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: {
      Authorization: authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accountId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to list buckets: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { buckets: Array<{ bucketName: string; bucketId: string }> };
  const bucket = data.buckets.find((b) => b.bucketName === bucketName);

  if (!bucket) {
    throw new Error(`Bucket "${bucketName}" not found`);
  }

  return bucket.bucketId;
}

async function main() {
  const keyId = process.env.B2_APPLICATION_KEY_ID;
  const key = process.env.B2_APPLICATION_KEY;
  const bucketName = process.env.B2_BUCKET_NAME;
  const bucketId = process.env.B2_BUCKET_ID;

  if (!keyId || !key || !bucketName) {
    console.error('Missing required environment variables:');
    console.error('  B2_APPLICATION_KEY_ID');
    console.error('  B2_APPLICATION_KEY');
    console.error('  B2_BUCKET_NAME');
    process.exit(1);
  }

  try {
    console.log('Authenticating with Backblaze B2...');
    const auth = await b2Authorize(keyId, key);
    console.log('✓ Authenticated');

    // Get bucket ID if not provided
    let finalBucketId = bucketId;
    if (!finalBucketId) {
      console.log(`Looking up bucket ID for "${bucketName}"...`);
      finalBucketId = await getBucketId(auth.apiUrl, auth.authorizationToken, bucketName, auth.accountId);
      console.log(`✓ Found bucket ID: ${finalBucketId}`);
    }

    // Get upload URL
    console.log('Getting upload URL...');
    const uploadUrlData = await getUploadUrl(auth.apiUrl, auth.authorizationToken, finalBucketId);
    console.log('✓ Got upload URL');

    // Read translation files
    const localesDir = join(__dirname, '../src/i18n/locales');
    const files = readdirSync(localesDir).filter((f) => f.endsWith('.json'));

    console.log(`\nFound ${files.length} translation file(s):`);

    // Upload each file
    for (const file of files) {
      const language = file.replace('.json', '');
      const filePath = join(localesDir, file);
      const fileContent = readFileSync(filePath);
      const b2FileName = `translations/${language}.json`;

      console.log(`\nUploading ${file} -> ${b2FileName}...`);
      
      try {
        const result = await uploadFile(
          uploadUrlData.uploadUrl,
          uploadUrlData.authorizationToken,
          b2FileName,
          fileContent
        );
        console.log(`✓ Uploaded successfully (fileId: ${result.fileId})`);
      } catch (error) {
        console.error(`✗ Failed to upload ${file}:`, error);
        // Continue with other files
      }
    }

    console.log('\n✓ All translations uploaded successfully!');
    console.log(`\nDownload URL: ${auth.downloadUrl}/file/${bucketName}/translations/`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

