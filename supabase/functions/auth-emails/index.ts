import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AuthEmailRequest {
  email: string;
  action: "request_reset" | "password_changed";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action }: AuthEmailRequest = await req.json();

    if (!email || !action) {
      throw new Error("Missing required fields: email and action");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "request_reset") {
      // Generate password reset link using Supabase Admin API
      const { data, error: linkError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: email,
        options: {
          redirectTo: `${req.headers.get("origin") || "https://afiliatedash.lovable.app"}/update-password`,
        },
      });

      if (linkError) {
        console.error("Error generating reset link:", linkError);
        // Don't reveal if email exists or not for security
        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const resetLink = data.properties?.action_link;

      if (resetLink) {
        const emailResponse = await resend.emails.send({
          from: "Afiliado Dashboard <noreply@afiliatedash.lovable.app>",
          to: [email],
          subject: "Redefinir sua senha",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <tr>
                        <td style="background: linear-gradient(135deg, #ee4d2d 0%, #ff6b47 100%); padding: 32px 24px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Redefinir Senha</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 32px 24px;">
                          <p style="color: #3f3f46; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                            Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova senha:
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding: 16px 0;">
                                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ee4d2d 0%, #ff6b47 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                  Redefinir Senha
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
                            Se você não solicitou essa redefinição, ignore este email. Sua senha permanecerá a mesma.
                          </p>
                          <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 16px 0 0 0;">
                            Este link expira em 1 hora.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #fafafa; padding: 20px 24px; text-align: center; border-top: 1px solid #e4e4e7;">
                          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} Afiliado Dashboard. Todos os direitos reservados.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        });

        console.log("Password reset email sent successfully:", emailResponse);
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (action === "password_changed") {
      const emailResponse = await resend.emails.send({
        from: "Afiliado Dashboard <noreply@afiliatedash.lovable.app>",
        to: [email],
        subject: "Sua senha foi alterada",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px 24px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Senha Alterada</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 32px 24px;">
                        <p style="color: #3f3f46; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                          Sua senha foi alterada com sucesso!
                        </p>
                        <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 0;">
                          Se você não fez essa alteração, entre em contato conosco imediatamente.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #fafafa; padding: 20px 24px; text-align: center; border-top: 1px solid #e4e4e7;">
                        <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} Afiliado Dashboard. Todos os direitos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      console.log("Password changed email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: any) {
    console.error("Error in auth-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
