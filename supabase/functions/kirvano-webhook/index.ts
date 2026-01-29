import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- NOVO TEMPLATE DE EMAIL (HTML RESPONSIVO) ---
const getWelcomeTemplate = (name: string, actionLink: string) => {
  const brandColor = "#F97316"; 
  
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<title>Bem-vindo!</title>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style type="text/css">
table {border-collapse: separate; table-layout: fixed; mso-table-lspace: 0pt; mso-table-rspace: 0pt}
table td {border-collapse: collapse}
.ExternalClass {width: 100%}
.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%}
body, a, li, p, h1, h2, h3 {-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;}
html {-webkit-text-size-adjust: none !important}
body {min-width: 100%; Margin: 0px; padding: 0px;}
img {Margin: 0; padding: 0; -ms-interpolation-mode: bicubic}
a[x-apple-data-detectors] {color: inherit !important; text-decoration: none !important;}
@media (max-width: 480px) {
.t57{padding:0 0 22px!important}.t42,.t53,.t69,.t8{text-align:left!important}.t41,.t52,.t68,.t7{vertical-align:top!important;width:600px!important}.t5{border-top-left-radius:0!important;border-top-right-radius:0!important;padding:20px 30px!important}.t39{border-bottom-right-radius:0!important;border-bottom-left-radius:0!important;padding:30px!important}
}
</style>
<link href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@500;800&amp;display=swap" rel="stylesheet" type="text/css" />
</head>
<body id=body class=t80 style="min-width:100%;Margin:0px;padding:0px;background-color:#E0E0E0;"><div class=t79 style="background-color:#E0E0E0;"><table role=presentation width=100% cellpadding=0 cellspacing=0 border=0 align=center><tr><td class=t78 style="font-size:0;line-height:0;mso-line-height-rule:exactly;background-color:#E0E0E0;" valign=top align=center>
<table role=presentation width=100% cellpadding=0 cellspacing=0 border=0 align=center id=innerTable><tr><td align=center>
<table class=t60 role=presentation cellpadding=0 cellspacing=0 style="Margin-left:auto;Margin-right:auto;"><tr><td width=566 class=t59 style="width:566px;">
<table class=t58 role=presentation cellpadding=0 cellspacing=0 width=100% style="width:100%;"><tr><td class=t57 style="padding:50px 10px 31px 10px;"><div class=t56 style="width:100%;text-align:left;"><div class=t55 style="display:inline-block;"><table class=t54 role=presentation cellpadding=0 cellspacing=0 align=left valign=top>
<tr class=t53><td></td><td class=t52 width=546 valign=top>
<table role=presentation width=100% cellpadding=0 cellspacing=0 class=t51 style="width:100%;"><tr><td class=t50 style="background-color:transparent;"><table role=presentation width=100% cellpadding=0 cellspacing=0 style="width:100% !important;"><tr><td align=center>
<table class=t15 role=presentation cellpadding=0 cellspacing=0 style="Margin-left:auto;Margin-right:auto;"><tr><td width=546 class=t14 style="width:600px;">
<table class=t13 role=presentation cellpadding=0 cellspacing=0 width=100% style="width:100%;"><tr><td class=t12><div class=t11 style="width:100%;text-align:left;"><div class=t10 style="display:inline-block;"><table class=t9 role=presentation cellpadding=0 cellspacing=0 align=left valign=top>
<tr class=t8><td></td><td class=t7 width=546 valign=top>
<table role=presentation width=100% cellpadding=0 cellspacing=0 class=t6 style="width:100%;"><tr><td class=t5 style="overflow:hidden;background-color:${brandColor};padding:49px 50px 42px 50px;border-radius:18px 18px 0 0;"><table role=presentation width=100% cellpadding=0 cellspacing=0 style="width:100% !important;"><tr><td align=left>
<table class=t4 role=presentation cellpadding=0 cellspacing=0 style="Margin-right:auto;"><tr><td width=85 class=t3 style="width:85px;">
<table class=t2 role=presentation cellpadding=0 cellspacing=0 width=100% style="width:100%;"><tr><td class=t1><div style="font-size:0px;"><img class=t0 style="display:block;border:0;height:auto;width:100%;Margin:0;max-width:100%;" width=85 height=85 alt="" src="https://611b5b8b-e4e9-47f0-90e4-64553da7c655.b-cdn.net/e/be824f9f-dfea-4239-b8c6-4ae622b2008d/8a5155fc-cdf1-49cc-ab0d-d87450c9301f.png"/></div></td></tr></table>
</td></tr></table>
</td></tr></table></td></tr></table>
</td><td></td></tr></table></div></div></td></tr></table>
</td></tr><tr><td align=center>
<table class=t49 role=presentation cellpadding=0 cellspacing=0 style="Margin-left:auto;Margin-right:auto;"><tr><td width=546 class=t48 style="width:600px;">
<table class=t47 role=presentation cellpadding=0 cellspacing=0 width=100% style="width:100%;"><tr><td class=t46><div class=t45 style="width:100%;text-align:left;"><div class=t44 style="display:inline-block;"><table class=t43 role=presentation cellpadding=0 cellspacing=0 align=left valign=top>
<tr class=t42><td></td><td class=t41 width=546 valign=top>
<table role=presentation width=100% cellpadding=0 cellspacing=0 class=t40 style="width:100%;"><tr><td class=t39 style="overflow:hidden;background-color:#F8F8F8;padding:40px 50px 40px 50px;border-radius:0 0 18px 18px;"><table role=presentation width=100% cellpadding=0 cellspacing=0 style="width:100% !important;"><tr><td align=center>
<table class=t20 role=presentation cellpadding=0 cellspacing=0 style="Margin-left:auto;Margin-right:auto;"><tr><td width=381 class=t19 style="width:381px;">
<table class=t18 role=presentation cellpadding=0 cellspacing=0 width=100% style="width:100%;"><tr><td class=t17><h1 class=t16 style="margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:41px;font-weight:800;font-style:normal;font-size:30px;text-decoration:none;text-transform:none;letter-spacing:-1.56px;direction:ltr;color:#191919;text-align:left;mso-line-height-rule:exactly;mso-text-raise:3px;">Pagamento Aprovado!<br/>Bem-vindo, ${name}!</h1></td></tr></table>
</td></tr></table>
</td></tr><tr><td><div class=t21 style="mso-line-height-rule:exactly;mso-line-height-alt:25px;line-height:25px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align=left>
<table class=t26 role=presentation cellpadding=0 cellspacing=0 style="Margin-right:auto;"><tr><td width=446 class=t25 style="width:563px;">
<table class=t24 role=presentation cellpadding=0 cellspacing=0 width=100% style="width:100%;"><tr><td class=t23><p class=t22 style="margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:normal;font-size:14px;text-decoration:none;text-transform:none;letter-spacing:-0.56px;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">Sua conta foi criada automaticamente com sucesso. Para acessar o painel e começar a usar, você precisa definir sua senha segura clicando no botão abaixo.</p></td></tr></table>
</td></tr></table>
</td></tr><tr><td><div class=t27 style="mso-line-height-rule:exactly;mso-line-height-alt:15px;line-height:15px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align=left>
<table class=t32 role=presentation cellpadding=0 cellspacing=0 style="Margin-right:auto;"><tr><td width=234 class=t31 style="width:234px;">
<table class=t30 role=presentation cellpadding=0 cellspacing=0 width=100% style="width:100%;"><tr><td class=t29 style="overflow:hidden;background-color:${brandColor};text-align:center;line-height:44px;mso-line-height-rule:exactly;mso-text-raise:10px;padding:10px 30px 10px 30px;border-radius:40px 40px 40px 40px;">
<a class=t28 href="${actionLink}" style="display:block;margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:44px;font-weight:800;font-style:normal;font-size:12px;text-decoration:none;text-transform:uppercase;letter-spacing:2.4px;direction:ltr;color:#FFFFFF;text-align:center;mso-line-height-rule:exactly;mso-text-raise:10px;" target=_blank>DEFINIR SENHA</a>
</td></tr></table>
</td></tr></table>
</td></tr><tr><td><div class=t33 style="mso-line-height-rule:exactly;mso-line-height-alt:15px;line-height:15px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align=left>
<table class=t38 role=presentation cellpadding=0 cellspacing=0 style="Margin-right:auto;"><tr><td width=446 class=t37 style="width:563px;">
<table class=t36 role=presentation cellpadding=0 cellspacing=0 width=100% style="width:100%;"><tr><td class=t35><p class=t34 style="margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:normal;font-size:14px;text-decoration:none;text-transform:none;letter-spacing:-0.56px;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">Se você tiver qualquer dúvida ou precisar de ajuda, responda a este e-mail.</p></td></tr></table>
</td></tr></table>
</td></tr></table></td></tr></table>
</td><td></td></tr></table></div></div></td></tr></table>
</td></tr><tr><td align=center>
<table class=t76 role=presentation cellpadding=0 cellspacing=0 style="Margin-left:auto;Margin-right:auto;"><tr><td width=600 class=t75 style="width:600px;">
<table class=t74 role=presentation cellpadding=0 cellspacing=0 width=100% style="width:100%;"><tr><td class=t73><div class=t72 style="width:100%;text-align:left;"><div class=t71 style="display:inline-block;"><table class=t70 role=presentation cellpadding=0 cellspacing=0 align=left valign=top>
<tr class=t69><td></td><td class=t68 width=600 valign=top>
<table role=presentation width=100% cellpadding=0 cellspacing=0 class=t67 style="width:100%;"><tr><td class=t66 style="padding:0 50px 0 50px;"><table role=presentation width=100% cellpadding=0 cellspacing=0 style="width:100% !important;"><tr><td align=center>
<table class=t65 role=presentation cellpadding=0 cellspacing=0 style="Margin-left:auto;Margin-right:auto;"><tr><td width=500 class=t64 style="width:600px;">
<table class=t63 role=presentation cellpadding=0 cellspacing=0 width=100% style="width:100%;"><tr><td class=t62><p class=t61 style="margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:normal;font-size:12px;text-decoration:none;text-transform:none;direction:ltr;color:#888888;text-align:center;mso-line-height-rule:exactly;mso-text-raise:3px;">&#xA9; ${new Date().getFullYear()} Afiliado Direct. Todos os direitos reservados.<br/></p></td></tr></table>
</td></tr></table>
</td></tr></table></td></tr></table>
</td><td></td></tr></table></div></div></td></tr></table>
</td></tr><tr><td><div class=t77 style="mso-line-height-rule:exactly;mso-line-height-alt:50px;line-height:50px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr></table></td></tr></table></div></body>
</html>
  `;
};

// 2. Template Simples para Atualizações
const getUpdateTemplate = (name: string, planName: string, expiresAt: string) => {
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

// --- INTERFACES & LÓGICA ---
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
          from: 'Afiliado Dashboard <onboarding@resend.dev>',
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
            from: 'Afiliado Dashboard <onboarding@resend.dev>',
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
