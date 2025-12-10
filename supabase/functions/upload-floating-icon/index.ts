// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // multipart/form-data
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const tenantId = form.get("tenantId");

    if (!file || !tenantId) {
      return new Response(
        JSON.stringify({ error: "Arquivo ou tenantId faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validações: apenas PNG, até 200 KB
    if (file.type !== "image/png") {
      return new Response(
        JSON.stringify({ error: "Apenas arquivos PNG são aceitos" }),
        { status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const maxBytes = 200 * 1024;
    if (file.size > maxBytes) {
      return new Response(
        JSON.stringify({ error: "Arquivo muito grande. Máximo 200 KB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Caminho no bucket public
    const fileName = `floating-icons/${tenantId}.png`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("public")
      .upload(fileName, arrayBuffer, {
        upsert: true,
        contentType: "image/png",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Falha no upload" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // URL pública correta
    const { data: publicData } = supabase.storage
      .from("public")
      .getPublicUrl(fileName);

    const url = publicData?.publicUrl;

    return new Response(
      JSON.stringify({ url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("upload-floating-icon error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});