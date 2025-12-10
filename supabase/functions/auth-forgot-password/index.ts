import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar se usuário existe (mas sempre retornar sucesso por segurança)
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = userData?.users?.some(u => u.email === email);

    if (userExists) {
      // Gerar link de reset
      const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${new URL(req.url).origin}/reset-password`
      });

      if (error) {
        console.error("Erro ao gerar link de reset:", error);
      } else {
        // Enviar e-mail via Resend usando fetch
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0d6efd;">🔐 Recupere sua senha</h2>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Catálogo Virtual</strong>.</p>
            <p>Para criar uma nova senha, clique no botão abaixo:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${new URL(req.url).origin}/reset-password" 
                 style="background:#0d6efd;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">
                 Resetar Senha
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              ⏱️ Este link é válido por <strong>60 minutos</strong>.
            </p>
            <p style="color: #666; font-size: 14px;">
              Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá segura.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              Equipe Catálogo Virtual
            </p>
          </div>
        `;

        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Catálogo Virtual <onboarding@resend.dev>",
            to: [email],
            subject: "Recuperação de Senha - Catálogo Virtual",
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          console.error("Erro ao enviar e-mail via Resend:", await resendResponse.text());
        }
      }
    }

    // Sempre retornar sucesso para não revelar se o e-mail existe
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Se o e-mail estiver cadastrado, você receberá as instruções para resetar sua senha" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na função forgot-password:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});