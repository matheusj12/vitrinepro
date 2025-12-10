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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    // Cliente Admin para operações privilegiadas (ignora RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação do usuário que fez a requisição (ainda precisa do JWT)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é super admin (role = 3)
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership || membership.role !== 3) {
      console.error('Acesso negado. Role:', membership?.role);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas super admins.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar métricas
    const [
      { count: totalTenants },
      { count: activeTenants },
      { count: suspendedTenants },
      { count: totalProducts },
      { count: totalQuotes },
      { count: totalUsers }
    ] = await Promise.all([
      supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }).eq('active', true),
      supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }).eq('active', false),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('quotes').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('tenant_memberships').select('user_id', { count: 'exact', head: true })
    ]);

    // Buscar tenants recentes
    const { data: recentTenants } = await supabaseAdmin
      .from('tenants')
      .select('id, company_name, slug, email, active, created_at, subscription_status')
      .order('created_at', { ascending: false })
      .limit(10);

    // Buscar subscriptions por status
    const { data: subscriptionStats } = await supabaseAdmin
      .from('subscriptions')
      .select('status');

    const subscriptionsByStatus = subscriptionStats?.reduce((acc: any, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const dashboard = {
      metrics: {
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        suspendedTenants: suspendedTenants || 0,
        totalProducts: totalProducts || 0,
        totalQuotes: totalQuotes || 0,
        totalUsers: totalUsers || 0
      },
      subscriptionsByStatus,
      recentTenants: recentTenants || []
    };

    console.log('Dashboard gerado com sucesso:', dashboard);

    return new Response(
      JSON.stringify(dashboard),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no superadmin-dashboard:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});