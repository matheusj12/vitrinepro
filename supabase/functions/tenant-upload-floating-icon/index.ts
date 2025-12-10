// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter tenant do usuário
    const { data: membership, error: membershipError } = await supabase
      .from("tenant_memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ success: false, error: "Tenant não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "Arquivo não enviado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validações: apenas PNG, até 200KB
    if (file.type !== "image/png") {
      return new Response(
        JSON.stringify({ success: false, error: "Apenas arquivos PNG são aceitos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const maxBytes = 200 * 1024;
    if (file.size > maxBytes) {
      return new Response(
        JSON.stringify({ success: false, error: "Arquivo muito grande. Máximo 200 KB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar no bucket existente, em pasta floating-icons/
    const fileName = `floating-icons/${membership.tenant_id}/icon-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("store-logos")
      .upload(fileName, file, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao fazer upload do ícone" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("store-logos")
      .getPublicUrl(uploadData.path);

    // Atualizar store_settings.storefront.whatsapp_icon_url
    const { data: existing } = await supabase
      .from("store_settings")
      .select("storefront")
      .eq("tenant_id", membership.tenant_id)
      .single();

    const storefront = { ...(existing?.storefront || {}), whatsapp_icon_url: publicUrl };

    const { error: upsertError } = await supabase
      .from("store_settings")
      .upsert(
        {
          tenant_id: membership.tenant_id,
          storefront,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id" }
      );

    if (upsertError) {
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao salvar configurações" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { whatsapp_icon_url: publicUrl },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});