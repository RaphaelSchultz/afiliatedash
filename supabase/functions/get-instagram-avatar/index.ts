import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Try unavatar.io - aggregates from multiple sources
async function tryUnavatar(username: string): Promise<string | null> {
  const url = `https://unavatar.io/${username}?fallback=false`;
  
  try {
    console.log(`Trying unavatar: ${url}`);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    console.log(`Unavatar status: ${response.status}`);

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.startsWith('image/')) {
        console.log(`Unavatar success`);
        return url;
      }
    }
  } catch (error) {
    console.log(`Unavatar error:`, error);
  }

  return null;
}

async function getAvatar(username: string): Promise<{ url: string | null; error?: string; source?: string }> {
  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();

  if (!cleanUsername || cleanUsername.length < 1) {
    return { url: null, error: 'Nome de usuário inválido' };
  }

  console.log(`Fetching avatar for: ${cleanUsername}`);

  // Use unavatar (aggregates GitHub, Gravatar, Twitter, etc.)
  const avatarUrl = await tryUnavatar(cleanUsername);
  
  if (avatarUrl) {
    return { url: avatarUrl, source: 'unavatar' };
  }

  return { 
    url: null, 
    error: 'Nenhum avatar encontrado para este username.' 
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

    const result = await getAvatar(username);

    if (!result.url) {
      return new Response(
        JSON.stringify({ 
          error: result.error,
          success: false,
          suggestion: 'Faça upload manual da sua foto de perfil.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        avatarUrl: result.url,
        source: result.source,
        username: username.replace(/^@/, '').trim().toLowerCase()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});