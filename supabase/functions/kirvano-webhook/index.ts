import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Kirvano webhook payload interface
interface KirvanoPayload {
  event: string;
  subscription_id?: string;
  customer: {
    email: string;
    name: string;
  };
  product?: {
    name: string;
  };
  plan?: {
    name: string;
  };
  subscription?: {
    status: string;
    next_billing_date?: string;
    plan?: {
      name: string;
    };
  };
  created_at?: string;
}

// Map Kirvano plan names to internal plan types
function mapPlanType(planName: string | undefined): string {
  if (!planName) return 'basic';
  
  const lowerPlan = planName.toLowerCase();
  if (lowerPlan.includes('pro') || lowerPlan.includes('premium')) {
    return 'pro';
  }
  if (lowerPlan.includes('enterprise') || lowerPlan.includes('business')) {
    return 'enterprise';
  }
  return 'basic';
}

// Generate a secure random password (for internal use only, never sent to user)
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: KirvanoPayload = await req.json();
    
    console.log('Kirvano webhook received:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.customer?.email) {
      console.error('Missing customer email in payload');
      return new Response(
        JSON.stringify({ error: 'Missing customer email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin Supabase client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const customerEmail = payload.customer.email.toLowerCase().trim();
    const customerName = payload.customer.name || 'Usuário';
    
    // Step A: Check if user exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingUser = existingUsers.users.find(
      (u) => u.email?.toLowerCase() === customerEmail
    );

    let userId: string;
    let isNewUser = false;

    // Step B: Create new user if doesn't exist
    if (!existingUser) {
      isNewUser = true;
      console.log(`Creating new user for email: ${customerEmail}`);

      // Generate secure password (never sent to user)
      const tempPassword = generateSecurePassword();

      // Create user with confirmed email (payment validates identity)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: customerName,
        },
      });

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      console.log(`User created with ID: ${userId}`);

      // Generate password recovery link (magic link for setting password)
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: customerEmail,
      });

      if (linkError || !linkData) {
        console.error('Error generating recovery link:', linkError);
        // Continue without email - user can request password reset later
      } else {
        // Send welcome email with magic link via Resend API
        if (RESEND_API_KEY) {
          try {
            const recoveryLink = linkData.properties?.action_link || linkData.properties?.hashed_token;
            
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Afiliado Dashboard <onboarding@resend.dev>',
                to: [customerEmail],
                subject: 'Bem-vindo ao Afiliado Dashboard - Acesse sua conta',
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #F97316; margin: 0;">🎉 Pagamento Aprovado!</h1>
                    </div>
                    
                    <p style="font-size: 16px;">Olá <strong>${customerName}</strong>,</p>
                    
                    <p style="font-size: 16px;">Seu pagamento foi aprovado com sucesso e sua conta está pronta para uso!</p>
                    
                    <p style="font-size: 16px;">Para acessar o sistema e definir sua senha segura, clique no botão abaixo:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${recoveryLink}" 
                         style="display: inline-block; background: linear-gradient(135deg, #F97316, #EA580C); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Acessar e Definir Senha
                      </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666;">
                      <strong>⚠️ Este link expira em 24 horas.</strong><br>
                      Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
                      <a href="${recoveryLink}" style="color: #F97316; word-break: break-all;">${recoveryLink}</a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="font-size: 12px; color: #999; text-align: center;">
                      Se você não realizou este pagamento, por favor ignore este email.<br>
                      © ${new Date().getFullYear()} Afiliado Dashboard
                    </p>
                  </body>
                  </html>
                `,
              }),
            });

            if (!emailResponse.ok) {
              const errorData = await emailResponse.text();
              console.error('Resend API error:', errorData);
            } else {
              console.log(`Welcome email sent to ${customerEmail}`);
            }
          } catch (emailError) {
            // Log error but don't fail the webhook
            console.error('Failed to send welcome email:', emailError);
          }
        } else {
          console.warn('RESEND_API_KEY not configured, skipping welcome email');
        }
      }
    } else {
      // Step C: User already exists
      userId = existingUser.id;
      console.log(`User already exists with ID: ${userId}`);
    }

    // Step D: Update subscription
    const planName = payload.plan?.name || payload.subscription?.plan?.name || payload.product?.name;
    const planType = mapPlanType(planName);
    const externalId = payload.subscription_id || null;
    
    // Calculate expiration date (default 30 days if not provided)
    let expiresAt: string | null = null;
    if (payload.subscription?.next_billing_date) {
      expiresAt = payload.subscription.next_billing_date;
    } else {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 30);
      expiresAt = expDate.toISOString();
    }

    // Determine if subscription is active based on event type
    const activeEvents = ['subscription.created', 'subscription.renewed', 'payment.approved', 'subscription.activated'];
    const isActive = activeEvents.some(e => payload.event?.toLowerCase().includes(e.toLowerCase().replace('.', '_')) || payload.event?.toLowerCase() === e.toLowerCase());

    // Upsert subscription
    const { error: upsertError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_type: planType,
        is_active: isActive !== false, // Default to true if we can't determine
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        external_id: externalId,
        last_event_payload: payload as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Subscription updated for user ${userId}: plan=${planType}, active=${isActive}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isNewUser ? 'User created and subscription activated' : 'Subscription updated',
        user_id: userId,
        plan_type: planType,
        is_new_user: isNewUser,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
