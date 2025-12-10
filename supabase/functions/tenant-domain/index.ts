import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET - obter domínio e status
    if (req.method === "GET") {
      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("id, custom_domain, custom_domain_verified")
        .eq("user_id", user.id)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: "Tenant não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            custom_domain: tenant.custom_domain || null,
            verified: tenant.custom_domain_verified || false,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST - salvar domínio
    if (req.method === "POST") {
      const { custom_domain } = await req.json();

      if (!custom_domain || custom_domain.trim() === "") {
        return new Response(
          JSON.stringify({ success: false, error: "Domínio é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Limpar domínio (remover http/https, www, espaços)
      const cleanDomain = custom_domain
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .trim();

      // Validar formato básico
      const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
      if (!domainRegex.test(cleanDomain)) {
        return new Response(
          JSON.stringify({ success: false, error: "Formato de domínio inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Atualizar domínio (marcar como não verificado)
      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          custom_domain: cleanDomain,
          custom_domain_verified: false,
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Erro ao salvar domínio:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao salvar domínio" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Domínio salvo. Configure o DNS conforme as instruções.",
          data: {
            custom_domain: cleanDomain,
            verified: false,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro na função tenant-domain:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});