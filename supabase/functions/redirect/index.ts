import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Link {
  id: string;
  original_url: string;
  pixel_id: string | null;
  active: boolean;
}

function detectDevice(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

function detectChannel(referrer: string): string {
  if (!referrer) return 'Direto';
  
  const lowerReferrer = referrer.toLowerCase();
  
  if (lowerReferrer.includes('facebook') || lowerReferrer.includes('fb.')) return 'Facebook';
  if (lowerReferrer.includes('instagram')) return 'Instagram';
  if (lowerReferrer.includes('whatsapp') || lowerReferrer.includes('wa.me')) return 'WhatsApp';
  if (lowerReferrer.includes('twitter') || lowerReferrer.includes('x.com')) return 'Twitter/X';
  if (lowerReferrer.includes('tiktok')) return 'TikTok';
  if (lowerReferrer.includes('youtube')) return 'YouTube';
  if (lowerReferrer.includes('google')) return 'Google';
  if (lowerReferrer.includes('bing')) return 'Bing';
  if (lowerReferrer.includes('telegram')) return 'Telegram';
  
  return 'Outro';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug não fornecida' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch link
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id, original_url, pixel_id, active')
      .eq('slug', slug)
      .single();

    if (linkError || !link) {
      return new Response(
        JSON.stringify({ error: 'Link não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!link.active) {
      return new Response(
        JSON.stringify({ error: 'Link inativo' }),
        { 
          status: 410, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract request metadata
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';
    const cfRegion = req.headers.get('cf-region-code') || null;
    const cfCountry = req.headers.get('cf-ipcountry') || null;

    const device = detectDevice(userAgent);
    const channel = detectChannel(referrer);

    // Register analytics (async, don't wait)
    supabase
      .from('link_analytics')
      .insert({
        link_id: link.id,
        device,
        channel,
        referrer: referrer || null,
        region: cfRegion,
        country: cfCountry,
      })
      .then(() => {});

    // Increment click count
    supabase
      .rpc('increment_link_clicks', { link_slug: slug })
      .then(() => {});

    // If pixel_id exists, return HTML with pixel tracking
    if (link.pixel_id) {
      const pixelHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecionando...</title>
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${link.pixel_id}');
    fbq('track', 'PageView');
    setTimeout(function() {
      window.location.href = '${link.original_url}';
    }, 500);
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${link.original_url}">
  </noscript>
</head>
<body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
  <p>Redirecionando...</p>
</body>
</html>`;

      return new Response(pixelHtml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // No pixel, direct redirect
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': link.original_url,
      },
    });

  } catch (error) {
    console.error('Redirect error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
