import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('Sem Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { 
        headers: { Authorization: authHeader } 
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // Extrair token JWT do header
    const token = authHeader.replace('Bearer ', '');

    // Autenticação obrigatória - passar token diretamente
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar tenant
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      console.error('Erro ao buscar membership:', membershipError);
      return new Response(
        JSON.stringify({ success: false, error: 'Tenant não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { themeId, preview = false } = body;

    if (!themeId) {
      console.error('themeId não fornecido');
      return new Response(
        JSON.stringify({ success: false, error: 'themeId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Aplicando tema:', { themeId, preview, tenantId: membership.tenant_id });

    // Chamar função apply_theme
    const { data, error } = await supabase.rpc('apply_theme', {
      p_tenant_id: membership.tenant_id,
      p_theme_id: themeId,
      p_user_id: user.id,
      p_is_preview: preview,
    });

    if (error) {
      console.error('Erro ao aplicar tema via RPC:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message || 'Erro ao aplicar tema' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tema aplicado com sucesso:', data);

    // Retornar tema aplicado
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .select('*')
      .eq('id', themeId)
      .single();

    if (themeError) {
      console.error('Erro ao buscar tema:', themeError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        preview,
        theme_id: themeId,
        theme: theme || null,
        ...data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro crítico em themes-apply:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar requisição'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
