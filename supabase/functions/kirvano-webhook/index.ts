import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- TEMPLATES DE EMAIL (Incorporado para evitar erro de módulo) ---
const getWelcomeTemplate = (name: string, actionLink: string) => {
  const primaryColor = "#F97316"; // Laranja do SaaS
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="padding: 20px 0 30px 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; border: 1px solid #cccccc; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td align="center" bgcolor="#18181b" style="padding: 40px 0 30px 0;">
             <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Afiliado Dashboard</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #153643; font-size: 28px; font-weight: bold;">
                    Pagamento Aprovado! 🚀
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0 30px 0; color: #153643; font-size: 16px; line-height: 24px;">
                    Olá <strong>${name}</strong>,<br><br>
                    Obrigado por assinar. Sua conta foi criada automaticamente e está pronta para uso.<br><br>
                    Para garantir sua segurança, geramos um link exclusivo para você definir sua senha e acessar o painel agora mesmo.
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="${primaryColor}" style="border-radius: 6px;">
                          <a href="${actionLink}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Minha Conta &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 0 0 0; color: #153643; font-size: 16px; line-height: 24px;">
                    <p style="font-size: 14px; color: #71717a;">Este link expira em 24 horas. Se o botão não funcionar, copie e cole:<br>
                    <a href="${actionLink}" style="color: ${primaryColor};">${actionLink}</a></p>
                  </td>
                </tr>
              </table>
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

// --- FIM DOS TEMPLATES ---

// Interfaces e Helpers
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
  const lowerPlan = planName.toLowerCase();
  if (lowerPlan.includes('pro') || lowerPlan.includes('premium') || lowerPlan.includes('anual')) return 'pro';
  if (lowerPlan.includes('interm')) return 'intermediate';
  return 'basic';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const payload: KirvanoPayload = await req.json();
    console.log('Kirvano webhook received:', JSON.stringify(payload, null, 2));

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase Config");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

    if (!payload.customer?.email) throw new Error("Missing email in payload");

    const customerEmail = payload.customer.email.toLowerCase().trim();
    const customerName = payload.customer.name || 'Usuário';

    // 1. Verificar/Criar Usuário
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.users.find(u => u.email?.toLowerCase() === customerEmail);
    
    let userId = existingUser?.id;
    let isNewUser = !existingUser;

    if (isNewUser) {
      console.log(`Creating new user: ${customerEmail}`);
      // Senha temporária aleatória apenas para criação (nunca enviada)
      const tempPassword = crypto.randomUUID() + "Aa1!"; 
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: customerName }
      });
      
      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        throw createError;
      }
      userId = newUser.user.id;

      // Gerar Magic Link
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: customerEmail,
      });

      // Enviar Email via Resend
      if (resend && linkData && linkData.properties) {
        const actionLink = linkData.properties.action_link || linkData.properties.hashed_token;
        
        try {
          await resend.emails.send({
            from: 'Afiliado Dashboard <onboarding@resend.dev>', // ⚠️ Altere para seu domínio verificado em Prod
            to: [customerEmail],
            subject: '🚀 Acesso Liberado: Defina sua senha',
            html: getWelcomeTemplate(customerName, actionLink),
          });
          console.log(`Email enviado para ${customerEmail}`);
        } catch (emailError) {
          console.error("Erro ao enviar email:", emailError);
        }
      }
    } else {
        userId = existingUser!.id;
    }

    // 2. Processar Assinatura
    const planName = payload.plan?.name || payload.product?.name;
    const planType = mapPlanType(planName);
    const saleId = payload.sale_id || payload.subscription_id;
    
    // Data de expiração
    let expiresAt: string | null = null;
    if (payload.plan?.next_charge_date) {
        expiresAt = payload.plan.next_charge_date.replace(' ', 'T'); // Fix Kirvano date format
    } else if (payload.subscription?.next_billing_date) {
        expiresAt = payload.subscription.next_billing_date;
    } else {
        const d = new Date(); d.setDate(d.getDate() + 30);
        expiresAt = d.toISOString();
    }

    // Upsert na Assinatura
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

    if (upsertError) {
        console.error("Erro ao salvar assinatura:", upsertError);
        throw upsertError;
    }

    return new Response(JSON.stringify({ success: true, user_id: userId, is_new: isNewUser }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
