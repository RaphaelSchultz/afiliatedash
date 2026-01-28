import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use unavatar.io directly - most reliable service
async function tryUnavatar(username: string): Promise<string | null> {
  const services = [
    `https://unavatar.io/${username}?fallback=false`,
    `https://unavatar.io/instagram/${username}?fallback=false`,
  ];

  for (const url of services) {
    try {
      console.log(`Trying: ${url}`);
      const response = await fetch(url, {
        method: 'HEAD', // Just check if image exists
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        console.log(`Content-Type: ${contentType}`);
        
        if (contentType.startsWith('image/')) {
          console.log(`Success: ${url}`);
          return url;
        }
      }
    } catch (error) {
      console.log(`Failed for ${url}:`, error);
    }
  }

  return null;
}

async function getInstagramAvatar(username: string): Promise<{ url: string | null; error?: string }> {
  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();

  if (!cleanUsername || cleanUsername.length < 1) {
    return { url: null, error: 'Nome de usuário inválido' };
  }

  console.log(`Fetching avatar for: ${cleanUsername}`);

  // Try unavatar services
  const avatarUrl = await tryUnavatar(cleanUsername);
  
  if (avatarUrl) {
    return { url: avatarUrl };
  }

  return { 
    url: null, 
    error: 'Foto não encontrada. O perfil pode ser privado ou inexistente.' 
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
          suggestion: 'Você pode fazer upload manual da sua foto de perfil.'
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