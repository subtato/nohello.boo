/**
 * Cloudflare Pages Function to serve translations from Backblaze B2
 * 
 * This function:
 * - Fetches translations from Backblaze B2 bucket
 * - Caches responses using Cloudflare's edge cache
 * - Falls back gracefully if B2 is unavailable
 * 
 * Route: /translations/:language
 * 
 * Environment variables required:
 * - B2_BUCKET_URL: Full URL to the B2 bucket (e.g., https://f000.backblazeb2.com/file/bucket-name)
 *   OR
 * - B2_BUCKET_NAME + B2_DOWNLOAD_URL: Bucket name and download URL endpoint
 */

interface Env {
  B2_BUCKET_URL?: string;
  B2_BUCKET_NAME?: string;
  B2_DOWNLOAD_URL?: string;
}

export async function onRequestGet(
  context: {
    request: Request;
    params: { language: string };
    env: Env;
  }
): Promise<Response> {
  const { params, env } = context;
  const language = params.language;

  // Validate language code (basic sanitization)
  if (!language || !/^[a-z]{2}(-[A-Z]{2})?$/.test(language)) {
    return new Response(JSON.stringify({ error: 'Invalid language code' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Construct B2 file URL
  let b2Url: string;
  
  if (env.B2_BUCKET_URL) {
    // Use full bucket URL if provided
    b2Url = `${env.B2_BUCKET_URL}/translations/${language}.json`;
  } else if (env.B2_BUCKET_NAME && env.B2_DOWNLOAD_URL) {
    // Construct from bucket name and download URL
    b2Url = `${env.B2_DOWNLOAD_URL}/file/${env.B2_BUCKET_NAME}/translations/${language}.json`;
  } else {
    // If B2 is not configured, return 503 so client can fall back to local files
    return new Response(JSON.stringify({ error: 'Translation service not configured' }), {
      status: 503,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  }

  try {
    // Fetch from B2
    // For public buckets, no auth needed
    // For private buckets, you'd need to add Authorization header with B2 token
    const response = await fetch(b2Url, {
      // @ts-expect-error - Cloudflare-specific fetch options
      cf: {
        // Use Cloudflare's cache
        cacheTtl: 3600, // Cache for 1 hour
        cacheEverything: true,
      },
    });

    if (!response.ok) {
      // If file not found, return 404
      if (response.status === 404) {
        return new Response(JSON.stringify({ error: 'Translation not found' }), {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });
      }

      throw new Error(`B2 request failed: ${response.status} ${response.statusText}`);
    }

    const translationData = await response.json();

    // Return with caching headers
    // Cache for 1 hour, allow stale-while-revalidate for 24 hours
    return new Response(JSON.stringify(translationData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Error fetching translation from B2:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch translation',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}

