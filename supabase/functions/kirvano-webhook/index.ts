import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- TEMPLATES DE EMAIL ---

// 1. Template para Novos Usuários (Com Link de Senha)
const getWelcomeTemplate = (name: string, actionLink: string) => {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color: #f4f4f5; font-family: sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e4e4e7;">
    <div style="background: #18181b; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Afiliado Dashboard</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #18181b; margin-top: 0;">Pagamento Aprovado! 🚀</h2>
      <p style="color: #52525b; line-height: 1.5;">Olá <strong>${name}</strong>,</p>
      <p style="color: #52525b; line-height: 1.5;">Sua conta foi criada com sucesso. Para acessar o painel, defina sua senha segura abaixo:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionLink}" style="background: #F97316; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Definir Senha e Acessar</a>
      </div>
      <p style="color: #71717a; font-size: 14px;">Ou use este link: <a href="${actionLink}" style="color: #F97316;">${actionLink}</a></p>
    </div>
  </div>
</body>
</html>`;
};

// 2. Template para Usuários Existentes (Upgrade/Renovação)
const getUpdateTemplate = (name: string, planName: string, expiresAt: string) => {
  // Formatar data para PT-BR simples
  const dateObj = new Date(expiresAt);
  const dateStr = dateObj.toLocaleDateString('pt-BR');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color: #f4f4f5; font-family: sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e4e4e7;">
    <div style="background: #18181b; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Afiliado Dashboard</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #18181b; margin-top: 0;">Assinatura Atualizada ✅</h2>
      <p style="color: #52525b; line-height: 1.5;">Olá <strong>${name}</strong>,</p>
      <p style="color: #52525b; line-height: 1.5;">Confirmamos a atualização do seu plano para: <strong>${planName}</strong>.</p>
      <p style="color: #52525b; line-height: 1.5;">Sua assinatura está ativa até: <strong>${dateStr}</strong>.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://app.afiliadodirect.com.br/dashboard" style="background: #F97316; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Ir para o Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// --- INTERFACES & HELPERS ---
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
}

function mapPlanType(planName: string | undefined): string {
  if (!planName) return 'basic';
  const lower = planName.toLowerCase();
  if (lower.includes('pro') || lower.includes('premium') || lower.includes('anual')) return 'pro';
  if (lower.includes('interm')) return 'intermediate';
  return 'basic';
}

// --- MAIN FUNCTION ---
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
    const planNameDisplay = payload.plan?.name || payload.product?.name || "Plano Premium";
    const planType = mapPlanType(planNameDisplay);
    const saleId = payload.sale_id || payload.subscription_id;

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

    // 1. Identificar Usuário
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email?.toLowerCase() === email);
    
    let userId: string;
    let isNewUser = false;

    if (!existingUser) {
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
          from: 'Afiliado Dashboard <onboarding@resend.dev>', // ⚠️ Troque pelo seu domínio em Prod
          to: [email],
          subject: '🚀 Acesso Liberado: Defina sua senha',
          html: getWelcomeTemplate(name, link)
        });
      }

    } else {
      // --- FLUXO DE USUÁRIO EXISTENTE (UPGRADE/RENOVAÇÃO) ---
      userId = existingUser.id;
      console.log(`Updating existing user: ${email}`);

      if (resend) {
        try {
          await resend.emails.send({
            from: 'Afiliado Dashboard <onboarding@resend.dev>', // ⚠️ Troque pelo seu domínio em Prod
            to: [email],
            subject: `✅ Assinatura Atualizada: ${planNameDisplay}`,
            html: getUpdateTemplate(name, planNameDisplay, expiresAt)
          });
          console.log(`Update email sent to ${email}`);
        } catch (err) {
          console.error("Failed to send update email:", err);
        }
      }
    }

    // 2. Atualizar Assinatura no Banco
    const { error: upsertError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_type: planType,
        is_active: payload.status === 'APPROVED',
        external_id: saleId,
        last_event_payload: payload as unknown as object,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, user_id: userId, is_new: isNewUser }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
