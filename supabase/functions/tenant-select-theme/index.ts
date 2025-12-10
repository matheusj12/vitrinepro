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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar tenant do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      console.error('Membership não encontrado:', membershipError);
      return new Response(
        JSON.stringify({ error: 'Tenant não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é admin/owner (role >= 1)
    if (membership.role < 1) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas admins.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { themeId } = await req.json();

    if (!themeId) {
      return new Response(
        JSON.stringify({ error: 'themeId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se tema existe e está ativo
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .select('*')
      .eq('id', themeId)
      .eq('active', true)
      .single();

    if (themeError || !theme) {
      console.error('Tema não encontrado:', themeError);
      return new Response(
        JSON.stringify({ error: 'Tema não encontrado ou inativo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar subscription do tenant para temas PRO
    if (theme.type === 'pro') {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('tenant_id', membership.tenant_id)
        .single();

      // Verificar se plano permite tema PRO
      const allowedPlans = ['essencial', 'pro'];
      const planSlug = subscription?.plans?.slug;

      if (!planSlug || !allowedPlans.includes(planSlug)) {
        return new Response(
          JSON.stringify({ 
            error: 'Tema PRO disponível apenas para planos Essencial ou Pro',
            requiredPlan: 'essencial'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Atualizar theme_id em store_settings
    const { error: updateError } = await supabase
      .from('store_settings')
      .update({ theme_id: themeId, updated_at: new Date().toISOString() })
      .eq('tenant_id', membership.tenant_id);

    if (updateError) {
      console.error('Erro ao atualizar tema:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tema atualizado:', { tenant_id: membership.tenant_id, theme_id: themeId, theme_name: theme.name });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Tema "${theme.name}" selecionado com sucesso`,
        theme: {
          id: theme.id,
          name: theme.name,
          type: theme.type
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no tenant-select-theme:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
