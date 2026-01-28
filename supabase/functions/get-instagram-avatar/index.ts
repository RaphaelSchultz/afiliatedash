import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Free avatar services that don't require authentication or scraping
const AVATAR_SERVICES = [
  // unavatar.io - aggregator service with built-in fallbacks
  (username: string) => `https://unavatar.io/instagram/${username}?fallback=false`,
  // wsrv.nl - image proxy/caching service
  (username: string) => `https://wsrv.nl/?url=https://www.instagram.com/${username}&w=200&output=jpg&default=1`,
  // Another unavatar endpoint
  (username: string) => `https://unavatar.io/${username}?fallback=false`,
];

async function checkImageUrl(url: string, timeout = 8000): Promise<{ valid: boolean; finalUrl: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AvatarFetcher/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { valid: false, finalUrl: url };
    }

    const contentType = response.headers.get('content-type') || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    // Must be an image and have some content (not a placeholder)
    const isImage = contentType.startsWith('image/');
    const hasContent = contentLength > 1000; // At least 1KB to avoid tiny placeholders

    return { valid: isImage && hasContent, finalUrl: response.url };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`Failed to check ${url}:`, errorMessage);
    return { valid: false, finalUrl: url };
  }
}

async function getInstagramAvatar(username: string): Promise<string | null> {
  // Clean username (remove @ if present)
  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();

  if (!cleanUsername || cleanUsername.length < 1) {
    throw new Error('Invalid username');
  }

  console.log(`Attempting to fetch avatar for Instagram user: ${cleanUsername}`);

  for (let i = 0; i < AVATAR_SERVICES.length; i++) {
    const serviceUrl = AVATAR_SERVICES[i](cleanUsername);
    console.log(`Trying service ${i + 1}/${AVATAR_SERVICES.length}: ${serviceUrl}`);

    const result = await checkImageUrl(serviceUrl);

    if (result.valid) {
      console.log(`Success with service ${i + 1}: ${result.finalUrl}`);
      return result.finalUrl;
    }

    console.log(`Service ${i + 1} failed, trying next...`);
  }

  console.log('All services failed');
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const avatarUrl = await getInstagramAvatar(username);

    if (!avatarUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not fetch Instagram avatar. The profile may be private or the username may be incorrect.',
          success: false 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        avatarUrl,
        username: username.replace(/^@/, '').trim().toLowerCase()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in get-instagram-avatar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
