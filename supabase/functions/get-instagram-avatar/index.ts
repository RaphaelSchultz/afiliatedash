import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Instagram API headers - simulating mobile app
const INSTAGRAM_HEADERS = {
  'User-Agent': 'Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate',
  'X-IG-App-ID': '936619743392459',
  'X-IG-Device-ID': 'android-' + Math.random().toString(36).substring(2, 15),
  'X-IG-Connection-Type': 'WIFI',
  'X-IG-Capabilities': '3brTvx0=',
};

// Try Instagram GraphQL API (public profiles)
async function tryInstagramGraphQL(username: string): Promise<string | null> {
  try {
    console.log(`Trying Instagram GraphQL for: ${username}`);
    
    // This endpoint sometimes works for public profiles
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...INSTAGRAM_HEADERS,
        'X-ASBD-ID': '129477',
        'X-CSRFToken': 'missing',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    console.log(`GraphQL status: ${response.status}`);

    if (!response.ok) {
      await response.text(); // consume body
      return null;
    }

    const text = await response.text();
    
    // Check if it's JSON
    if (!text.startsWith('{')) {
      console.log('GraphQL returned non-JSON response');
      return null;
    }

    const data = JSON.parse(text);
    const profilePicUrl = data?.data?.user?.profile_pic_url_hd || data?.data?.user?.profile_pic_url;
    
    if (profilePicUrl) {
      console.log(`Found via GraphQL: ${profilePicUrl.substring(0, 80)}...`);
      return profilePicUrl;
    }

    return null;
  } catch (error) {
    console.error('GraphQL error:', error);
    return null;
  }
}

// Try Instagram search endpoint
async function tryInstagramSearch(username: string): Promise<string | null> {
  try {
    console.log(`Trying Instagram search for: ${username}`);
    
    const searchUrl = `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(username)}`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        ...INSTAGRAM_HEADERS,
        'Referer': 'https://www.instagram.com/',
        'Origin': 'https://www.instagram.com',
      },
    });

    console.log(`Search status: ${response.status}`);
    
    const text = await response.text();

    if (!response.ok || !text.startsWith('{')) {
      console.log('Search returned non-JSON or error');
      return null;
    }

    const data = JSON.parse(text);
    
    // Find exact username match
    const users = data?.users || [];
    for (const item of users) {
      const user = item?.user;
      if (user?.username?.toLowerCase() === username.toLowerCase()) {
        if (user.profile_pic_url) {
          console.log(`Found exact match: ${user.profile_pic_url.substring(0, 80)}...`);
          return user.profile_pic_url;
        }
      }
    }
    
    // Try first similar result
    if (users.length > 0 && users[0]?.user?.profile_pic_url) {
      const firstUser = users[0].user;
      console.log(`Using first result: ${firstUser.username}`);
      return firstUser.profile_pic_url;
    }

    return null;
  } catch (error) {
    console.error('Search error:', error);
    return null;
  }
}

// Try i.instagram.com API (mobile API)
async function tryInstagramMobileAPI(username: string): Promise<string | null> {
  try {
    console.log(`Trying Instagram Mobile API for: ${username}`);
    
    const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: INSTAGRAM_HEADERS,
    });

    console.log(`Mobile API status: ${response.status}`);

    if (!response.ok) {
      await response.text();
      return null;
    }

    const text = await response.text();
    if (!text.startsWith('{')) {
      return null;
    }

    const data = JSON.parse(text);
    const profilePicUrl = data?.data?.user?.profile_pic_url_hd || data?.data?.user?.profile_pic_url;
    
    if (profilePicUrl) {
      console.log(`Found via Mobile API: ${profilePicUrl.substring(0, 80)}...`);
      return profilePicUrl;
    }

    return null;
  } catch (error) {
    console.error('Mobile API error:', error);
    return null;
  }
}

async function getInstagramAvatar(username: string): Promise<{ url: string | null; error?: string }> {
  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();

  if (!cleanUsername || cleanUsername.length < 1) {
    return { url: null, error: 'Nome de usuário inválido' };
  }

  console.log(`Fetching avatar for: ${cleanUsername}`);

  // Try multiple approaches
  let avatarUrl = await tryInstagramGraphQL(cleanUsername);
  
  if (!avatarUrl) {
    avatarUrl = await tryInstagramSearch(cleanUsername);
  }
  
  if (!avatarUrl) {
    avatarUrl = await tryInstagramMobileAPI(cleanUsername);
  }
  
  if (avatarUrl) {
    return { url: avatarUrl };
  }

  return { 
    url: null, 
    error: 'Não foi possível obter a foto. O Instagram está bloqueando requisições do servidor. Tente fazer upload manual.' 
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