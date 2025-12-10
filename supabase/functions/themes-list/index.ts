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
    const authHeader = req.headers.get('Authorization');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    let tenantId: string | null = null;
    let tenantPlanSlug: string | null = null;

    // Buscar tenant se autenticado
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: membership } = await supabase
          .from('tenant_memberships')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        
        if (membership) {
          tenantId = membership.tenant_id;
          
          // Buscar plano do tenant
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select(`
              plan_id,
              plans (slug)
            `)
            .eq('tenant_id', tenantId)
            .single();
          
          if (subscription && subscription.plans) {
            tenantPlanSlug = (subscription.plans as any).slug;
          }
        }
      }
    }

    // Buscar tema atual do tenant
    let currentThemeId: string | null = null;
    if (tenantId) {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('selected_theme_id')
        .eq('id', tenantId)
        .single();
      
      if (tenantData) {
        currentThemeId = tenantData.selected_theme_id;
      }
    }

    // Buscar todos temas globais ativos (todos são gratuitos por enquanto)
    const { data: themes, error: themesError } = await supabase
      .from('themes')
      .select('*')
      .is('tenant_id', null)
      .eq('active', true)
      .order('created_at');

    if (themesError) throw themesError;

    // Formatar resposta com is_allowed sempre true (todos gratuitos)
    const formattedThemes = (themes || []).map(theme => ({
      id: theme.id,
      name: theme.name,
      slug: theme.slug,
      description: theme.description || '',
      thumbnail_url: theme.thumbnail_url || '/images/themes/default-thumb.png',
      colors: theme.colors || {},
      config: theme.config || {},
      is_premium: false, // Todos gratuitos por enquanto
      is_allowed: true,  // Todos permitidos
      is_current: currentThemeId === theme.id,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedThemes,
        tenant_plan: tenantPlanSlug || 'free',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em themes-list:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        data: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});