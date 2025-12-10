// @ts-nocheck
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Autenticação
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const tenantId = (form.get("tenant_id") as string | null)?.trim();

    if (!file || !tenantId) {
      return new Response(JSON.stringify({ error: "Parâmetros faltando: file, tenant_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar permissão: usuário precisa ser membro do tenant (role >= 1)
    const { data: membership } = await supabase
      .from("tenant_memberships")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!membership || (membership.role ?? 0) < 1) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar arquivo
    const ct = (file.type || "").toLowerCase();
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(ct)) {
      return new Response(JSON.stringify({ error: "Apenas PNG/JPG/WebP são aceitos" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (file.size > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Arquivo muito grande (máx 2MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Garantir bucket store-logos público
    const bucketName = "store-logos";
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === bucketName);
    if (!exists) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024,
        allowedMimeTypes: allowed,
      });
    }

    // Definir extensão a partir do contentType
    const ext = ct.includes("png") ? "png" : ct.includes("jpeg") || ct.includes("jpg") ? "jpg" : "webp";
    const path = `${tenantId}.${ext}`;
    const buffer = await file.arrayBuffer();

    // Upload com upsert
    const { error: upErr } = await supabase.storage
      .from(bucketName)
      .upload(path, buffer, {
        contentType: ct,
        upsert: true,
      });

    if (upErr) {
      console.error("Upload error:", upErr);
      return new Response(JSON.stringify({ error: "Falha no upload" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(path);
    const publicUrl = pub?.publicUrl;

    // Atualizar store_settings.branding.logo_url
    const { data: existingSettings } = await supabase
      .from("store_settings")
      .select("branding")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const branding = { ...(existingSettings?.branding as any || {}), logo_url: publicUrl };

    if (existingSettings) {
      await supabase
        .from("store_settings")
        .update({ branding, updated_at: new Date().toISOString() })
        .eq("tenant_id", tenantId);
    } else {
      await supabase
        .from("store_settings")
        .insert({
          tenant_id: tenantId,
          branding,
          storefront: {},
          contact: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    return new Response(
      JSON.stringify({ success: true, logo_url: publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("upload-logo error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});