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

    // Verificar se é super admin (role = 3)
    const { data: membership, error: membershipError } = await supabase
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

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ error: 'subscriptionId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, tenants(*)')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Subscription não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        payment_confirmed: true,
        payment_date: new Date().toISOString(),
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Erro ao confirmar pagamento:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reativar tenant
    await supabase
      .from('tenants')
      .update({ 
        active: true, 
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.tenant_id);

    // Criar notificação
    await supabase
      .from('notifications')
      .insert({
        tenant_id: subscription.tenant_id,
        type: 'payment_confirmed',
        message: 'Pagamento confirmado! Sua loja está ativa novamente.',
        read: false
      });

    // Log
    await supabase
      .from('admin_logs')
      .insert({
        action: 'payment_confirmed',
        tenant_id: subscription.tenant_id,
        user_id: user.id,
        meta: { subscription_id: subscriptionId }
      });

    console.log('Pagamento confirmado:', subscriptionId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Pagamento confirmado com sucesso',
        tenant: {
          id: subscription.tenant_id,
          company_name: subscription.tenants?.company_name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no subscription-confirm-payment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
