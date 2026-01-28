import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Instagram-only avatar service - using ONLY the explicit Instagram endpoint
// The generic unavatar endpoint with source=instagram can still return other platforms (like Twitch)
const INSTAGRAM_AVATAR_SERVICES = [
  // ONLY use the explicit /instagram/ endpoint which guarantees Instagram-only results
  (username: string) => `https://unavatar.io/instagram/${username}?fallback=false`,
];

async function checkImageUrl(url: string, timeout = 10000): Promise<{ valid: boolean; finalUrl: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Use GET instead of HEAD for better compatibility with some services
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`Service returned status ${response.status} for ${url}`);
      return { valid: false, finalUrl: url };
    }

    const contentType = response.headers.get('content-type') || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    // Must be an image and have some content (not a placeholder)
    const isImage = contentType.startsWith('image/');
    // If content-length is available, check it's substantial (>500 bytes to avoid tiny placeholders)
    // If not available, assume valid if it's an image type
    const hasContent = contentLength === 0 || contentLength > 500;

    console.log(`URL check for ${url}: isImage=${isImage}, contentType=${contentType}, contentLength=${contentLength}`);

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

  console.log(`Attempting to fetch Instagram avatar for user: ${cleanUsername}`);

  // Try Instagram-specific services only
  for (let i = 0; i < INSTAGRAM_AVATAR_SERVICES.length; i++) {
    const serviceUrl = INSTAGRAM_AVATAR_SERVICES[i](cleanUsername);
    console.log(`Trying Instagram service ${i + 1}/${INSTAGRAM_AVATAR_SERVICES.length}: ${serviceUrl}`);

    const result = await checkImageUrl(serviceUrl);

    if (result.valid) {
      console.log(`Success with Instagram service ${i + 1}: ${result.finalUrl}`);
      return result.finalUrl;
    }

    console.log(`Instagram service ${i + 1} failed, trying next...`);
  }

  console.log('All Instagram services failed - profile may be private or username incorrect');
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
          error: 'Foto de perfil do Instagram não encontrada. O perfil pode ser privado ou o nome de usuário pode estar incorreto.',
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
