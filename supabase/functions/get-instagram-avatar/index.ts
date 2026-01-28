import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://www.instagram.com/',
  'Origin': 'https://www.instagram.com',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'X-IG-App-ID': '936619743392459',
};

// Approach 4: Instagram internal search endpoint
async function tryInstagramSearch(username: string): Promise<string | null> {
  try {
    console.log(`Trying Instagram search endpoint for: ${username}`);
    
    const searchUrl = `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(username)}`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: BROWSER_HEADERS,
    });

    if (!response.ok) {
      console.log(`Instagram search returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Find exact username match in results
    const users = data?.users || [];
    for (const item of users) {
      const user = item?.user;
      if (user?.username?.toLowerCase() === username.toLowerCase()) {
        const profilePicUrl = user.profile_pic_url;
        if (profilePicUrl) {
          console.log(`Found profile pic via search: ${profilePicUrl.substring(0, 50)}...`);
          return profilePicUrl;
        }
      }
    }
    
    // If no exact match, try first result if username is similar
    if (users.length > 0 && users[0]?.user?.profile_pic_url) {
      const firstUser = users[0].user;
      if (firstUser.username.toLowerCase().includes(username.toLowerCase()) ||
          username.toLowerCase().includes(firstUser.username.toLowerCase())) {
        console.log(`Using first similar result: ${firstUser.username}`);
        return firstUser.profile_pic_url;
      }
    }

    console.log('No matching user found in search results');
    return null;
  } catch (error) {
    console.error('Instagram search error:', error);
    return null;
  }
}

// Fallback: unavatar.io services
async function tryUnavatar(username: string): Promise<string | null> {
  const services = [
    `https://unavatar.io/instagram/${username}?fallback=false`,
    `https://unavatar.io/${username}?fallback=false`,
  ];

  for (const url of services) {
    try {
      console.log(`Trying unavatar: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'image/*',
        },
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.startsWith('image/')) {
          console.log(`Unavatar success: ${url}`);
          return url;
        }
      }
    } catch (error) {
      console.log(`Unavatar failed for ${url}:`, error);
    }
  }

  return null;
}

async function getInstagramAvatar(username: string): Promise<{ url: string | null; error?: string }> {
  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();

  if (!cleanUsername || cleanUsername.length < 1) {
    return { url: null, error: 'Nome de usuário inválido' };
  }

  console.log(`Fetching Instagram avatar for: ${cleanUsername}`);

  // Try Approach 4 first: Instagram search endpoint
  let avatarUrl = await tryInstagramSearch(cleanUsername);
  
  if (avatarUrl) {
    return { url: avatarUrl };
  }

  // Fallback to unavatar services
  avatarUrl = await tryUnavatar(cleanUsername);
  
  if (avatarUrl) {
    return { url: avatarUrl };
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