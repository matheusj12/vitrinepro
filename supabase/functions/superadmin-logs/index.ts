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
    // authHeader é usado corretamente aqui para obter o usuário autenticado
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      console.error('superadmin-logs: Erro de autenticação', authError?.message);
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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const tenantId = url.searchParams.get('tenantId');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Construir query
    let query = supabaseAdmin
      .from('admin_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros
    if (action) {
      query = query.eq('action', action);
    }
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar logs:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enriquecer logs com informações de tenant
    // Corrigido de Promise.ll para Promise.all
    const enrichedLogs = await Promise.all(
      (logs || []).map(async (log) => {
        if (log.tenant_id) {
          const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('company_name, slug')
            .eq('id', log.tenant_id)
            .single();

          // Garante que retorna null se o tenant não for encontrado, sem quebrar
          return {
            ...log,
            tenant: tenant || null
          };
        }
        return log;
      })
    );

    console.log('Logs buscados:', enrichedLogs.length);

    // Sempre retorna JSON válido
    return new Response(
      JSON.stringify({ 
        logs: enrichedLogs,
        total: count || 0,
        limit,
        offset
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no superadmin-logs:', error);
    // Sempre retorna JSON válido em caso de erro
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});