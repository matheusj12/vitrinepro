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

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: membership } = await supabase
      .from("tenant_memberships")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== 3) {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas super admins." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const network = (form.get("network") as string | null)?.toLowerCase();

    if (!file || !network) {
      return new Response(JSON.stringify({ error: "Parâmetros faltando: file, network" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowed = ["instagram", "facebook", "tiktok", "youtube", "pinterest", "linkedin", "twitter"];
    if (!allowed.includes(network)) {
      return new Response(JSON.stringify({ error: "Network inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ct = file.type;
    if (!(ct === "image/svg+xml" || ct === "image/png")) {
      return new Response(JSON.stringify({ error: "Apenas SVG ou PNG são aceitos" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (file.size > 512 * 1024) {
      return new Response(JSON.stringify({ error: "Arquivo muito grande (máx 512KB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = ct === "image/svg+xml" ? "svg" : "png";
    const path = `social/${network}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: upErr } = await supabase.storage
      .from("public")
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

    const { data: pub } = supabase.storage.from("public").getPublicUrl(path);

    return new Response(JSON.stringify({ success: true, url: pub.publicUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("superadmin-upload-social-icon error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});