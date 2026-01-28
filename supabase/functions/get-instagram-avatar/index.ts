import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple fallback services for Instagram avatar fetching
const AVATAR_SERVICES = [
  // unavatar.io with explicit Instagram endpoint
  (username: string) => `https://unavatar.io/instagram/${username}?fallback=false`,
  // unavatar.io generic endpoint (may work when explicit fails)
  (username: string) => `https://unavatar.io/${username}?fallback=false`,
  // ui-avatars.com as fallback - generates avatar from initials (always works)
  // This won't be the Instagram photo but at least provides a fallback
];

async function checkImageUrl(url: string, timeout = 8000): Promise<{ valid: boolean; finalUrl: string; status?: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`Service returned status ${response.status} for ${url}`);
      return { valid: false, finalUrl: url, status: response.status };
    }

    const contentType = response.headers.get('content-type') || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    const isImage = contentType.startsWith('image/');
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

async function getInstagramAvatar(username: string): Promise<{ url: string | null; error?: string }> {
  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();

  if (!cleanUsername || cleanUsername.length < 1) {
    return { url: null, error: 'Nome de usuário inválido' };
  }

  console.log(`Attempting to fetch Instagram avatar for user: ${cleanUsername}`);

  let lastStatus: number | undefined;

  // Try each service
  for (let i = 0; i < AVATAR_SERVICES.length; i++) {
    const serviceUrl = AVATAR_SERVICES[i](cleanUsername);
    console.log(`Trying service ${i + 1}/${AVATAR_SERVICES.length}: ${serviceUrl}`);

    const result = await checkImageUrl(serviceUrl);
    lastStatus = result.status;

    if (result.valid) {
      console.log(`Success with service ${i + 1}: ${result.finalUrl}`);
      return { url: result.finalUrl };
    }

    console.log(`Service ${i + 1} failed (status: ${result.status}), trying next...`);
  }

  // Determine error message based on last status
  if (lastStatus === 403) {
    return { 
      url: null, 
      error: 'O serviço de busca de avatars está temporariamente bloqueado. Por favor, faça upload manual da sua foto.' 
    };
  }

  return { 
    url: null, 
    error: 'Foto do Instagram não encontrada. O perfil pode ser privado ou o nome de usuário pode estar incorreto.' 
  };
}

serve(async (req) => {
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

    const result = await getInstagramAvatar(username);

    if (!result.url) {
      return new Response(
        JSON.stringify({ 
          error: result.error,
          success: false,
          suggestion: 'Você pode fazer upload manual da sua foto de perfil clicando em "Fazer upload".'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        avatarUrl: result.url,
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
