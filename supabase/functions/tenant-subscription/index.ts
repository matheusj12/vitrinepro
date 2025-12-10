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
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Tenant não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar subscription com plano
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans (*)
      `)
      .eq('tenant_id', membership.tenant_id)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Subscription não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular se trial expirou
    const now = new Date();
    const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
    const trialExpired = trialEndsAt ? now > trialEndsAt : false;
    const daysUntilTrialEnd = trialEndsAt 
      ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Buscar contagem de produtos
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', membership.tenant_id);

    const plan = subscription.plans;
    const canCreateProducts = plan.max_products === -1 || (productCount || 0) < plan.max_products;

    const response = {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        started_at: subscription.started_at,
        trial_ends_at: subscription.trial_ends_at,
        payment_confirmed: subscription.payment_confirmed,
        payment_date: subscription.payment_date
      },
      plan: {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        price_cents: plan.price_cents,
        max_products: plan.max_products,
        trial_days: plan.trial_days,
        features: plan.features
      },
      trial: {
        active: subscription.status === 'trial',
        expired: trialExpired,
        ends_at: subscription.trial_ends_at,
        days_remaining: daysUntilTrialEnd
      },
      limits: {
        max_products: plan.max_products,
        current_products: productCount || 0,
        can_create_products: canCreateProducts,
        products_remaining: plan.max_products === -1 
          ? 'unlimited' 
          : plan.max_products - (productCount || 0)
      }
    };

    console.log('Subscription buscada:', { tenant_id: membership.tenant_id, plan: plan.name });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no tenant-subscription:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
