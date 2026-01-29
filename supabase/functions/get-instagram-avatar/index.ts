import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username é obrigatório', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean username (remove @ if present)
    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    
    console.log(`Fetching Instagram avatar for: ${cleanUsername}`);

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    
    if (!RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Serviço de busca de avatar não configurado', 
          success: false,
          suggestion: 'Configure a chave RAPIDAPI_KEY nas configurações.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Instagram Statistics API from RapidAPI
    const apiUrl = `https://instagram-statistics-api.p.rapidapi.com/community?url=https://www.instagram.com/${cleanUsername}/`;

    console.log(`Calling RapidAPI: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'instagram-statistics-api.p.rapidapi.com'
      }
    });

    console.log(`RapidAPI response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RapidAPI error: ${response.status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          error: 'Não foi possível buscar o perfil do Instagram', 
          success: false,
          suggestion: 'Verifique se o username está correto e tente novamente.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('RapidAPI response data:', JSON.stringify(data).substring(0, 500));

    // Extract profile picture URL - prioritize HD version
    const avatarUrl = data?.data?.profile_pic_url_hd || data?.data?.profile_pic_url || data?.profile_pic_url_hd || data?.profile_pic_url;

    if (!avatarUrl) {
      console.error('No avatar URL found in response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: 'Nenhum avatar encontrado para este username', 
          success: false,
          suggestion: 'Faça upload manual da sua foto de perfil.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found avatar URL: ${avatarUrl}`);

    return new Response(
      JSON.stringify({ 
        avatar_url: avatarUrl, 
        success: true,
        username: cleanUsername
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error fetching Instagram avatar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        success: false,
        suggestion: 'Tente novamente mais tarde ou faça upload manual.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
