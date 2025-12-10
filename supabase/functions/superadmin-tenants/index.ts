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
      console.error('superadmin-tenants: Erro de autenticação', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado' }),
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
      console.warn('superadmin-tenants: Acesso negado para usuário', user.id, 'com role', membership?.role);
      return new Response(
        JSON.stringify({ success: false, error: 'Acesso negado. Apenas super admins.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const tenantIdParam = url.searchParams.get('tenantId');

    // GET - Listar todos os tenants
    if (req.method === 'GET') {
      const { data: tenants, error } = await supabaseAdmin
        .from('tenants')
        .select(`
          *,
          subscriptions (
            id,
            plan_id,
            status,
            trial_ends_at,
            payment_confirmed,
            plans (
              name,
              slug,
              price_cents
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('superadmin-tenants: Erro ao buscar tenants (GET):', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('superadmin-tenants: Tenants listados:', tenants?.length);
      return new Response(
        JSON.stringify({ success: true, data: { tenants } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Deletar tenant (cascade)
    if (req.method === 'DELETE') {
      if (!tenantIdParam) {
        console.warn('superadmin-tenants: tenantId é obrigatório para DELETE');
        return new Response(
          JSON.stringify({ success: false, error: 'tenantId é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar tenant para log
      const { data: tenant, error: fetchTenantError } = await supabaseAdmin
        .from('tenants')
        .select('company_name, slug')
        .eq('id', tenantIdParam)
        .single();

      if (fetchTenantError || !tenant) {
        console.error('superadmin-tenants: Erro ao buscar tenant para DELETE:', fetchTenantError?.message);
        return new Response(
          JSON.stringify({ success: false, error: 'Tenant não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Deletar tenant (cascade vai deletar tudo relacionado)
      const { error: deleteError } = await supabaseAdmin
        .from('tenants')
        .delete()
        .eq('id', tenantIdParam);

      if (deleteError) {
        console.error('superadmin-tenants: Erro ao deletar tenant:', deleteError);
        return new Response(
          JSON.stringify({ success: false, error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Registrar log
      await supabaseAdmin
        .from('admin_logs')
        .insert({
          action: 'tenant_deleted',
          tenant_id: tenantIdParam,
          user_id: user.id,
          meta: { company_name: tenant?.company_name, slug: tenant?.slug }
        });

      console.log('superadmin-tenants: Tenant deletado:', tenantIdParam);

      return new Response(
        JSON.stringify({ success: true, message: 'Tenant deletado com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Atualizar tenant (suspender, reativar, regenerar slug, alterar plano)
    if (req.method === 'PUT') {
      if (!tenantIdParam) {
        console.warn('superadmin-tenants: tenantId é obrigatório para PUT');
        return new Response(
          JSON.stringify({ success: false, error: 'tenantId é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { action, newSlug, planId } = body;

      // Buscar tenant
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .select('*')
        .eq('id', tenantIdParam)
        .single();

      if (tenantError || !tenant) {
        console.error('superadmin-tenants: Erro ao buscar tenant para PUT:', tenantError?.message);
        return new Response(
          JSON.stringify({ success: false, error: 'Tenant não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let updateData: any = {};
      let logAction = '';
      let logMeta: any = {};

      // Ação: suspender
      if (action === 'suspend') {
        updateData = { active: false, subscription_status: 'suspended' };
        logAction = 'tenant_suspended';
        logMeta = { tenant_id: tenantIdParam, company_name: tenant.company_name };
      }

      // Ação: reativar
      if (action === 'reactivate') {
        updateData = { active: true, subscription_status: 'active' };
        logAction = 'tenant_reactivated';
        logMeta = { tenant_id: tenantIdParam, company_name: tenant.company_name };
      }

      // Ação: regenerar slug
      if (action === 'regenerate_slug') {
        if (!newSlug) {
          console.warn('superadmin-tenants: newSlug é obrigatório para regenerate_slug');
          return new Response(
            JSON.stringify({ success: false, error: 'newSlug é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar se slug já existe
        const { data: existingSlug, error: existingSlugError } = await supabaseAdmin
          .from('tenants')
          .select('id')
          .eq('slug', newSlug)
          .neq('id', tenantIdParam)
          .single();

        if (existingSlugError && existingSlugError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('superadmin-tenants: Erro ao verificar slug existente:', existingSlugError);
          return new Response(
            JSON.stringify({ success: false, error: existingSlugError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (existingSlug) {
          console.warn('superadmin-tenants: Slug já em uso:', newSlug);
          return new Response(
            JSON.stringify({ success: false, error: 'Slug já em uso' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        updateData = { slug: newSlug };
        logAction = 'slug_regenerated';
        logMeta = { tenant_id: tenantIdParam, old_slug: tenant.slug, new_slug: newSlug };
      }

      // Ação: alterar plano
      if (action === 'change_plan') {
        if (!planId) {
          console.warn('superadmin-tenants: planId é obrigatório para change_plan');
          return new Response(
            JSON.stringify({ success: false, error: 'planId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Atualizar subscription
        const { error: subError } = await supabaseAdmin
          .from('subscriptions')
          .update({ plan_id: planId, updated_at: new Date().toISOString() })
          .eq('tenant_id', tenantIdParam);

        if (subError) {
          console.error('superadmin-tenants: Erro ao atualizar subscription:', subError);
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao alterar plano' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        logAction = 'plan_changed';
        logMeta = { tenant_id: tenantIdParam, new_plan_id: planId };
      }

      // Aplicar atualização no tenant
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('tenants')
          .update(updateData)
          .eq('id', tenantIdParam);

        if (updateError) {
          console.error('superadmin-tenants: Erro ao atualizar tenant:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Registrar log
      if (logAction) {
        await supabaseAdmin
          .from('admin_logs')
          .insert({
            action: logAction,
            tenant_id: tenantIdParam,
            user_id: user.id,
            meta: logMeta
          });
      }

      console.log('superadmin-tenants: Tenant atualizado:', { action, tenantId: tenantIdParam });

      return new Response(
        JSON.stringify({ success: true, message: 'Tenant atualizado com sucesso' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.warn('superadmin-tenants: Método não permitido:', req.method);
    return new Response(
      JSON.stringify({ success: false, error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('superadmin-tenants: Erro crítico:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});