import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'Mobile';
  if (/tablet/i.test(ua)) return 'Tablet';
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

export default function Redirect() {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleRedirect() {
      if (!slug) {
        setError('Link não encontrado');
        return;
      }

      try {
        // Fetch link data
        const { data: link, error: linkError } = await supabase
          .from('links')
          .select('*')
          .eq('slug', slug)
          .eq('active', true)
          .single();

        if (linkError || !link) {
          setError('Link não encontrado ou inativo');
          return;
        }

        // Register analytics
        const referrer = document.referrer;
        const device = detectDevice();
        const channel = detectChannel(referrer);

        // Insert analytics (fire and forget)
        supabase
          .from('link_analytics')
          .insert({
            link_id: link.id,
            device,
            channel,
            referrer: referrer || null,
            region: null, // Will be set by edge function
            country: null, // Will be set by edge function
          })
          .then(() => {});

        // Increment click count
        supabase
          .rpc('increment_link_clicks', { link_slug: slug })
          .then(() => {});

        // Handle Facebook Pixel
        if (link.pixel_id) {
          // Create pixel tracking page with redirect
          const pixelHtml = `
            <!DOCTYPE html>
            <html>
            <head>
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
            </head>
            <body>
              <p>Redirecionando...</p>
            </body>
            </html>
          `;
          document.open();
          document.write(pixelHtml);
          document.close();
        } else {
          // Direct redirect
          window.location.href = link.original_url;
        }
      } catch (err) {
        console.error('Redirect error:', err);
        setError('Erro ao processar redirecionamento');
      }
    }

    handleRedirect();
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Oops!</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}
