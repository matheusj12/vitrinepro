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
    const { record } = await req.json();
    
    if (!record || !record.email) {
      console.log("Webhook inválido - sem email");
      return new Response(JSON.stringify({ success: false }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar informações do tenant
    const { data: tenant } = await supabase
      .from("tenants")
      .select("company_name, slug")
      .eq("user_id", record.id)
      .single();

    const companyName = tenant?.company_name || "sua loja";
    const storeUrl = tenant?.slug ? `${new URL(req.url).origin}/loja/${tenant.slug}` : "";

    // Template de boas-vindas
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d6efd;">🎉 Bem-vindo ao Catálogo Virtual!</h2>
        <p>Olá! Sua conta foi confirmada com sucesso.</p>
        <p><strong>${companyName}</strong> está ativa e pronta para receber pedidos! 🚀</p>
        
        <h3 style="color: #333; margin-top: 30px;">📋 Comece por aqui:</h3>
        <ul style="line-height: 2; font-size: 15px;">
          <li>📦 <strong>Cadastre seus primeiros produtos</strong></li>
          <li>🗂 <strong>Organize em categorias</strong></li>
          <li>🎨 <strong>Personalize sua vitrine</strong></li>
          <li>💬 <strong>Configure o WhatsApp de atendimento</strong></li>
        </ul>

        ${storeUrl ? `
          <p style="text-align: center; margin: 30px 0;">
            <a href="${storeUrl}" 
               style="background:#0d6efd;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">
               Ver Minha Loja
            </a>
          </p>
        ` : ''}

        <p style="margin-top: 30px;">Você tem <strong>7 dias de teste grátis</strong> para explorar todos os recursos.</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Qualquer dúvida, estamos aqui para ajudar! 💙
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          <strong>Equipe Catálogo Virtual</strong>
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
        to: [record.email],
        subject: "🎉 Bem-vindo! Sua loja está pronta",
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      console.error("Erro ao enviar e-mail de boas-vindas:", await resendResponse.text());
    } else {
      console.log("E-mail de boas-vindas enviado para:", record.email);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro no webhook de boas-vindas:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});