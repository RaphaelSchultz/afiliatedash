import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EVO_BASE_URL = "https://evo.ispconsulte.com.br/message";
const EVO_INSTANCE = "tim"; // Instance name
const EVO_API_KEY = "429683C4C977415CAAFCCE10F7D57E11";
const ADMIN_PHONE = "5527993111899";

interface ReportPayload {
    message: string;
    mediaUrl?: string | null;
    user_context?: {
        name?: string;
        email?: string;
        tenant_id?: string;
    };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { message, mediaUrl, user_context }: ReportPayload = await req.json();

        if (!message) {
            throw new Error('Message is required');
        }

        const formattedMessage = `🚨 *Novo Report de Bug*\n\n` +
            `*Usuário:* ${user_context?.name || 'Não informado'}\n` +
            `*Email:* ${user_context?.email || 'Não informado'}\n` +
            `*Tenant ID:* ${user_context?.tenant_id || 'N/A'}\n\n` +
            `*Descrição do Problema:*\n${message}\n\n` +
            `_Enviado via AfiliateDash Central de Ajuda_`;

        console.log('Sending WhatsApp message to:', ADMIN_PHONE, 'Media:', mediaUrl ? 'Yes' : 'No');

        let endpoint = `${EVO_BASE_URL}/sendText/${EVO_INSTANCE}`;
        let body: any = {
            number: ADMIN_PHONE,
            text: formattedMessage,
            options: {
                delay: 1200,
                presence: "composing",
                linkPreview: false
            }
        };

        if (mediaUrl) {
            endpoint = `${EVO_BASE_URL}/sendMedia/${EVO_INSTANCE}`;
            // Determine media type (basic check)
            const isVideo = mediaUrl.match(/\.(mp4|mov|avi|mkv)$/i);
            const mediaType = isVideo ? "video" : "image";

            body = {
                number: ADMIN_PHONE,
                media: mediaUrl,
                mediatype: mediaType,
                caption: formattedMessage,
                fileName: mediaUrl.split('/').pop() || "evidence",
                options: {
                    delay: 1200,
                    presence: "composing"
                }
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVO_API_KEY,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Evolution API Error:', errorText);
            throw new Error(`Failed to send message: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Error in send-whatsapp-report:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
