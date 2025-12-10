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
      return new Response(
        JSON.stringify({ error: 'Tenant não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é owner (role = 2)
    if (membership.role < 2) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas owners podem trocar de plano.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { planId } = await req.json();

    if (!planId) {
      return new Response(
        JSON.stringify({ error: 'planId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se plano existe e está ativo
    const { data: newPlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('active', true)
      .single();

    if (planError || !newPlan) {
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado ou inativo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar subscription atual
    const { data: currentSub, error: subError } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('tenant_id', membership.tenant_id)
      .single();

    if (subError) {
      return new Response(
        JSON.stringify({ error: 'Subscription não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se está tentando trocar para o mesmo plano
    if (currentSub.plan_id === planId) {
      return new Response(
        JSON.stringify({ error: 'Você já está neste plano' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar limite de produtos se for downgrade
    if (newPlan.max_products !== -1) {
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', membership.tenant_id);

      if (productCount && productCount > newPlan.max_products) {
        return new Response(
          JSON.stringify({ 
            error: `Você tem ${productCount} produtos, mas o plano ${newPlan.name} permite apenas ${newPlan.max_products}. Remova alguns produtos antes de fazer o downgrade.`,
            currentProducts: productCount,
            planLimit: newPlan.max_products
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calcular novo trial_ends_at se aplicável
    let trialEndsAt = null;
    if (newPlan.trial_days > 0 && currentSub.status === 'trial') {
      const now = new Date();
      now.setDate(now.getDate() + newPlan.trial_days);
      trialEndsAt = now.toISOString();
    }

    // Atualizar subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_id: planId,
        trial_ends_at: trialEndsAt,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', membership.tenant_id);

    if (updateError) {
      console.error('Erro ao trocar plano:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar notificação
    await supabase
      .from('notifications')
      .insert({
        tenant_id: membership.tenant_id,
        type: 'plan_changed',
        message: `Plano alterado para ${newPlan.name} com sucesso!`,
        read: false
      });

    console.log('Plano alterado:', { tenant_id: membership.tenant_id, old_plan: currentSub.plans?.name, new_plan: newPlan.name });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Plano alterado para ${newPlan.name} com sucesso!`,
        plan: {
          id: newPlan.id,
          name: newPlan.name,
          price_cents: newPlan.price_cents,
          max_products: newPlan.max_products
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no tenant-change-plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
