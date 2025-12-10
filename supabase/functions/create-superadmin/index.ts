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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se superadmin já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const superAdminExists = existingUser?.users.some(u => u.email === 'admin@admin.com.br');

    if (superAdminExists) {
      return new Response(
        JSON.stringify({ message: 'Super admin já existe' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar usuário superadmin
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@admin.com.br',
      password: 'admin',
      email_confirm: true,
      user_metadata: {
        full_name: 'Super Admin',
        email: 'admin@admin.com.br'
      }
    });

    if (createError) {
      console.error('Erro ao criar superadmin:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Superadmin criado:', newUser.user.id);

    // Criar tenant Sistema
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        user_id: newUser.user.id,
        company_name: 'Sistema',
        slug: 'sistema-admin',
        email: 'admin@admin.com.br',
        subscription_status: 'active',
        active: true
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Erro ao criar tenant:', tenantError);
      return new Response(
        JSON.stringify({ error: tenantError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tenant Sistema criado:', tenant.id);

    // Criar membership com role 3 (superadmin)
    const { error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .insert({
        tenant_id: tenant.id,
        user_id: newUser.user.id,
        role: 3
      });

    if (membershipError) {
      console.error('Erro ao criar membership:', membershipError);
      return new Response(
        JSON.stringify({ error: membershipError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Membership superadmin criada');

    // Criar subscription no plano Free (ou outro)
    const { data: freePlan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('slug', 'free')
      .single();

    if (freePlan) {
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          tenant_id: tenant.id,
          plan_id: freePlan.id,
          status: 'active'
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Super admin criado com sucesso',
        user: {
          id: newUser.user.id,
          email: newUser.user.email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no create-superadmin:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
