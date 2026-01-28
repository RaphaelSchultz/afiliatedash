import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

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
          .select('id, slug, original_url, active')
          .eq('slug', slug)
          .eq('active', true)
          .single();

        if (linkError || !link) {
          setError('Link não encontrado ou inativo');
          return;
        }

        // Register analytics (fire and forget)
        const referrer = document.referrer;
        const device = detectDevice();
        const channel = detectChannel(referrer);

        supabase
          .from('link_analytics')
          .insert({
            link_id: link.id,
            device,
            channel,
            referrer: referrer || null,
            region: null,
            country: null,
          })
          .then(() => {});

        // Increment click count
        supabase
          .rpc('increment_link_clicks', { link_slug: slug })
          .then(() => {});

        // Direct redirect (fast)
        window.location.href = link.original_url;
      } catch (err) {
        console.error('Redirect error:', err);
        setError('Erro ao processar redirecionamento');
      }
    }

    handleRedirect();
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Blank white page during redirect
  return <div className="min-h-screen bg-white" />;
}
