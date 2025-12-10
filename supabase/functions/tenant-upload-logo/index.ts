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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar tenant do usuário
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ success: false, error: "Tenant não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "Arquivo não enviado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar tipo de arquivo
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ success: false, error: "Tipo de arquivo inválido. Use PNG, JPG ou WebP." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ success: false, error: "Arquivo muito grande. Máximo 2MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Nome do arquivo único
    const fileExt = file.name.split(".").pop();
    const fileName = `${tenant.id}/logo-${Date.now()}.${fileExt}`;

    // Upload para storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("store-logos")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Erro no upload:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao fazer upload" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("store-logos")
      .getPublicUrl(fileName);

    // Atualizar logo_url no store_settings
    const currentBranding = {} as any;
    
    const { data: existingSettings } = await supabase
      .from("store_settings")
      .select("branding")
      .eq("tenant_id", tenant.id)
      .single();

    const branding = {
      ...(existingSettings?.branding || currentBranding),
      logo_url: publicUrl,
    };

    const { error: updateError } = await supabase
      .from("store_settings")
      .upsert({
        tenant_id: tenant.id,
        branding,
      }, {
        onConflict: "tenant_id",
      });

    if (updateError) {
      console.error("Erro ao atualizar configurações:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          logo_url: publicUrl,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro na função upload-logo:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});