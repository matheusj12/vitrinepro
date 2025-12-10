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
      console.error('superadmin-plans: Erro de autenticação', authError?.message);
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
      console.warn('superadmin-plans: Acesso negado para usuário', user.id, 'com role', membership?.role);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas super admins.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const planIdParam = url.searchParams.get('planId');

    // GET - Listar todos os planos
    if (req.method === 'GET') {
      const { data: plans, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .order('price_cents', { ascending: true });

      if (error) {
        console.error('superadmin-plans: Erro ao buscar planos:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('superadmin-plans: Planos listados:', plans?.length);
      return new Response(
        JSON.stringify({ plans }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Criar novo plano
    if (req.method === 'POST') {
      const body = await req.json();
      const { name, slug, description, price_cents, max_products, trial_days, features, active } = body;

      if (!name || !slug || price_cents === undefined || max_products === undefined) {
        return new Response(
          JSON.stringify({ error: 'Campos obrigatórios: name, slug, price_cents, max_products' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newPlan, error } = await supabaseAdmin
        .from('plans')
        .insert({
          name,
          slug,
          description: description || null,
          price_cents,
          max_products,
          trial_days: trial_days || 0,
          features: features || [],
          active: active !== undefined ? active : true
        })
        .select()
        .single();

      if (error) {
        console.error('superadmin-plans: Erro ao criar plano:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log
      await supabaseAdmin
        .from('admin_logs')
        .insert({
          action: 'plan_created',
          user_id: user.id,
          meta: { plan_id: newPlan.id, plan_name: name }
        });

      console.log('superadmin-plans: Plano criado:', newPlan.id);
      return new Response(
        JSON.stringify({ success: true, plan: newPlan }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Atualizar plano
    if (req.method === 'PUT') {
      if (!planIdParam) {
        return new Response(
          JSON.stringify({ error: 'planId é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const updates: any = {};

      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.price_cents !== undefined) updates.price_cents = body.price_cents;
      if (body.max_products !== undefined) updates.max_products = body.max_products;
      if (body.trial_days !== undefined) updates.trial_days = body.trial_days;
      if (body.features !== undefined) updates.features = body.features;
      if (body.active !== undefined) updates.active = body.active;

      if (Object.keys(updates).length === 0) {
        return new Response(
          JSON.stringify({ error: 'Nenhum campo para atualizar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      updates.updated_at = new Date().toISOString();

      const { data: updatedPlan, error } = await supabaseAdmin
        .from('plans')
        .update(updates)
        .eq('id', planIdParam)
        .select()
        .single();

      if (error) {
        console.error('superadmin-plans: Erro ao atualizar plano:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log
      await supabaseAdmin
        .from('admin_logs')
        .insert({
          action: 'plan_updated',
          user_id: user.id,
          meta: { plan_id: planIdParam, updates }
        });

      console.log('superadmin-plans: Plano atualizado:', planIdParam);
      return new Response(
        JSON.stringify({ success: true, plan: updatedPlan }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Deletar plano
    if (req.method === 'DELETE') {
      if (!planIdParam) {
        return new Response(
          JSON.stringify({ error: 'planId é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se há subscriptions usando este plano
      const { count } = await supabaseAdmin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', planIdParam);

      if (count && count > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Não é possível deletar plano com subscriptions ativas',
            activeSubscriptions: count
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseAdmin
        .from('plans')
        .delete()
        .eq('id', planIdParam);

      if (error) {
        console.error('superadmin-plans: Erro ao deletar plano:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log
      await supabaseAdmin
        .from('admin_logs')
        .insert({
          action: 'plan_deleted',
          user_id: user.id,
          meta: { plan_id: planIdParam }
        });

      console.log('superadmin-plans: Plano deletado:', planIdParam);
      return new Response(
        JSON.stringify({ success: true, message: 'Plano deletado com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('superadmin-plans: Erro no superadmin-plans:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});