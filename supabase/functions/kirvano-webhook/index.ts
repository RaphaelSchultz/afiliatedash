import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- NOVO TEMPLATE "AFILIATE DASH" (Estilo Card Clean) ---
const getWelcomeTemplate = (name: string, actionLink: string) => {
  const brandColor = "#F97316"; // Laranja da marca
  const dashLink = "https://app.afiliatedash.com.br";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Afiliate Dash</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .button:hover { opacity: 0.9; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 90%; margin: 0 auto;">
          
          <tr>
            <td bgcolor="${brandColor}" align="center" style="padding: 40px 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">AFILIATE DASH</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 50px;">
              
              <h1 style="color: #111827; font-size: 28px; font-weight: 800; margin: 0 0 10px 0; line-height: 1.2;">
                Conta Criada com Sucesso!
              </h1>
              <h2 style="color: #4b5563; font-size: 18px; font-weight: 600; margin: 0 0 30px 0;">
                Bem-vindo ao time, ${name}.
              </h2>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Seu pagamento foi aprovado e sua conta já está ativa. <br>
                Para sua segurança, geramos um link exclusivo para você definir sua senha e começar a configurar seu dashboard.
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left"> <a href="${actionLink}" target="_blank" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px;">
                      DEFINIR MINHA SENHA
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px; margin-bottom: 0;">
                Se você tiver qualquer dúvida ou precisar de ajuda, basta responder a este e-mail ou visitar nossa <a href="${dashLink}" style="color: ${brandColor}; text-decoration: none;">central de ajuda</a>.
              </p>

              </td>
          </tr>
        </table>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding-top: 20px; padding-bottom: 40px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Afiliate Dash. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
};

// --- TEMPLATE DE ATUALIZAÇÃO (Mesmo estilo visual) ---
const getUpdateTemplate = (name: string, planName: string, expiresAt: string) => {
  const brandColor = "#F97316";
  const dashLink = "https://app.afiliatedash.com.br";
  const dateStr = new Date(expiresAt).toLocaleDateString('pt-BR');

  return `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: sans-serif;">
  <table role="presentation" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; max-width: 90%; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <tr>
            <td bgcolor="${brandColor}" align="center" style="padding: 40px 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">AFILIATE DASH</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 50px;">
              <h1 style="color: #111827; font-size: 24px; font-weight: 800; margin: 0 0 20px 0;">Assinatura Atualizada! 🚀</h1>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Olá <strong>${name}</strong>,</p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Seu plano foi atualizado para: <strong>${planName}</strong>.</p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">Válido até: <strong>${dateStr}</strong>.</p>
              <a href="${dashLink}" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-transform: uppercase;">
                ACESSAR DASHBOARD
              </a>
            </td>
          </tr>
        </table>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">© ${new Date().getFullYear()} Afiliate Dash.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// --- CONFIGURAÇÃO E LÓGICA DO WEBHOOK ---

interface KirvanoPayload {
  event: string;
  subscription_id?: string;
  customer: { email: string; name: string; };
  product?: { name: string; };
  plan?: { name: string; next_charge_date?: string; };
  subscription?: { status: string; next_billing_date?: string; plan?: { name: string; }; };
  created_at?: string;
  sale_id?: string;
  status?: string;
  checkout_id?: string;
  payment_method?: string;
  products?: Array<{ name: string; offer_name?: string; offer_id?: string; }>;
}

// Função auxiliar para normalizar string (remove acentos e espaços)
function normalizeSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD') // Separa acentos das letras
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '-') // Espaços viram hífens
    .replace(/[^a-z0-9-]/g, ''); // Remove caracteres especiais
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const payload: KirvanoPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);
    const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

    if (!payload.customer?.email) throw new Error("Email missing");

    const email = payload.customer.email.toLowerCase().trim();
    const name = payload.customer.name || 'Assinante';

    // Dados do Plano e Datas
    // Refatoração: Prioridade para Offer ID da Kirvano -> Slug do Plano
    let planType = 'basic';
    const offerId = payload.products?.[0]?.offer_id;

    if (offerId) {
      // 1. Busca Direta pelo ID da Oferta
      const { data: planData } = await supabaseAdmin
        .from('plans')
        .select('slug')
        .eq('kirvano_offer_id', offerId)
        .maybeSingle();

      if (planData) {
        planType = planData.slug;
      } else {
        // Fallback para lógica de string caso não mapeado
        const planNameDisplay = payload.products?.[0]?.offer_name || payload.products?.[0]?.name || payload.plan?.name || "Premium";
        const normalizedName = normalizeSlug(planNameDisplay);

        console.warn(`Offer ID ${offerId} not found. Falling back to string match: ${normalizedName}`);

        if (normalizedName.includes('pro') || normalizedName.includes('premium')) planType = 'pro';
        else if (normalizedName.includes('intermedia') || normalizedName.includes('scale')) planType = 'intermediate';
        else if (normalizedName.includes('free') || normalizedName.includes('gratis')) planType = 'free';
      }
    } else {
      // Fallback legado (sem offer_id)
      const planNameDisplay = payload.plan?.name || payload.products?.[0]?.name || "Premium";
      const normalizedName = normalizeSlug(planNameDisplay);

      const { data: plansData } = await supabaseAdmin
        .from('plans')
        .select('slug')
        .or(`slug.eq.${normalizedName},name.ilike.%${planNameDisplay}%`)
        .limit(1);

      if (plansData && plansData.length > 0) {
        planType = plansData[0].slug;
      } else {
        if (normalizedName.includes('pro') || normalizedName.includes('premium')) planType = 'pro';
        else if (normalizedName.includes('intermedia')) planType = 'intermediate';
        else if (normalizedName.includes('free') || normalizedName.includes('gratis')) planType = 'free';
      }
    }

    // Nome para display no email
    const planNameDisplay = payload.products?.[0]?.offer_name || payload.plan?.name || "Plano";

    // Calcular expiração
    let expiresAt: string;
    if (payload.plan?.next_charge_date) {
      expiresAt = payload.plan.next_charge_date.replace(' ', 'T');
    } else if (payload.subscription?.next_billing_date) {
      expiresAt = payload.subscription.next_billing_date;
    } else {
      const d = new Date(); d.setDate(d.getDate() + 30);
      expiresAt = d.toISOString();
    }

    // 1. Identificar Usuário (Performance via RPC)
    const { data: rpcUser } = await supabaseAdmin.rpc('get_user_id_by_email', { email_input: email });
    // Se a RPC falhar ou retornar vazio, existingUserId será null
    const existingUserId = rpcUser && rpcUser.length > 0 ? rpcUser[0].id : null;

    let userId: string;
    let isNewUser = false;
    const saleId = payload.sale_id || payload.subscription_id;

    if (!existingUserId) {
      // --- FLUXO DE NOVO USUÁRIO ---
      isNewUser = true;
      console.log(`Creating new user: ${email}`);
      const tempPw = crypto.randomUUID() + "Aa1!";

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email, password: tempPw, email_confirm: true, user_metadata: { full_name: name }
      });
      if (createError || !newUser.user) throw createError;
      userId = newUser.user.id;

      // Enviar Magic Link
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery', email: email
      });

      if (resend && linkData?.properties) {
        const link = linkData.properties.action_link || linkData.properties.hashed_token;
        await resend.emails.send({
          from: 'Afiliate Dash <onboarding@resend.dev>', // ⚠️ TROCAR PELO SEU DOMÍNIO EM PRODUÇÃO
          to: [email],
          subject: '🚀 Bem-vindo ao Afiliate Dash: Defina sua senha',
          html: getWelcomeTemplate(name, link)
        });
      }

    } else {
      // --- FLUXO DE USUÁRIO EXISTENTE (UPGRADE/RENOVAÇÃO) ---
      userId = existingUserId;
      console.log(`Updating existing user: ${email} (ID: ${userId})`);

      if (resend) {
        try {
          await resend.emails.send({
            from: 'Afiliate Dash <onboarding@resend.dev>', // ⚠️ TROCAR PELO SEU DOMÍNIO EM PRODUÇÃO
            to: [email],
            subject: `✅ Assinatura Atualizada: ${planNameDisplay}`,
            html: getUpdateTemplate(name, planNameDisplay, expiresAt)
          });
        } catch (err) {
          console.error("Failed to send update email:", err);
        }
      }
    }

    // 2. Atualizar Assinatura no Banco
    // Se o pagamento foi aprovado, a gente sobrescreve plan_type
    // Isso garante Upgrade/Downgrade automático
    const { error: upsertError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_type: planType,
        is_active: payload.status === 'APPROVED',
        external_id: saleId,
        last_event_payload: payload as unknown as object, // legacy
        kirvano_payload: payload, // full JSON
        offer_id: offerId || null, // Novo campo na tabela user_subscriptions
        expires_at: expiresAt,
        checkout_id: payload.checkout_id || null,
        payment_method: payload.payment_method || null,
        payment_status: payload.status || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, user_id: userId, is_new: isNewUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    // Em produção pode omitir o erro exato para o cliente, mas aqui ajuda o debug
    const errorObj = error as any;
    return new Response(JSON.stringify({
      error: {
        message: errorObj.message || 'Unknown error',
        name: errorObj.name,
        code: errorObj.code,
        details: errorObj.details,
        hint: errorObj.hint,
        stack: errorObj.stack // Optional: remove in production
      }
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
