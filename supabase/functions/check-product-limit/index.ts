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

    // Buscar subscription e plano
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('tenant_id', membership.tenant_id)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Subscription não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plan = subscription.plans;

    // Se plano permite produtos ilimitados
    if (plan.max_products === -1) {
      return new Response(
        JSON.stringify({ 
          can_create: true, 
          unlimited: true,
          message: 'Produtos ilimitados' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Contar produtos do tenant
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', membership.tenant_id);

    const currentCount = productCount || 0;
    const canCreate = currentCount < plan.max_products;

    if (!canCreate) {
      // Criar notificação
      await supabase
        .from('notifications')
        .insert({
          tenant_id: membership.tenant_id,
          type: 'product_limit',
          message: `Limite de produtos atingido! Você tem ${currentCount} produtos e seu plano ${plan.name} permite ${plan.max_products}. Faça upgrade para criar mais produtos.`,
          read: false
        });

      console.log('Limite de produtos atingido:', { tenant_id: membership.tenant_id, count: currentCount, limit: plan.max_products });

      return new Response(
        JSON.stringify({ 
          can_create: false,
          error: 'Limite de produtos do plano atingido',
          current: currentCount,
          limit: plan.max_products,
          plan: plan.name,
          message: `Você atingiu o limite de ${plan.max_products} produtos do plano ${plan.name}. Faça upgrade para criar mais produtos.`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verificação de limite:', { tenant_id: membership.tenant_id, can_create: true, current: currentCount, limit: plan.max_products });

    return new Response(
      JSON.stringify({ 
        can_create: true,
        current: currentCount,
        limit: plan.max_products,
        remaining: plan.max_products - currentCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no check-product-limit:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
