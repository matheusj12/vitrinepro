import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const randomPassword = () =>
  Array.from(crypto.getRandomValues(new Uint32Array(4)))
    .map((value) => value.toString(36))
    .join("")
    .slice(-12);

const assertEnv = () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
  }
};

const formatUsers = (
  authUsers,
  memberships,
  tenants,
  subscriptions,
  plans,
) => {
  const tenantMap = new Map((tenants ?? []).map((tenant) => [tenant.id, tenant]));
  const subscriptionMap = new Map((subscriptions ?? []).map((sub) => [sub.tenant_id, sub]));
  const planMap = new Map((plans ?? []).map((plan) => [plan.id, plan]));

  return authUsers.map((authUser) => {
    const userMemberships = (memberships ?? []).filter((m) => m.user_id === authUser.id);

    const tenantsInfo = userMemberships
      .map((membership) => {
        const tenant = tenantMap.get(membership.tenant_id);
        if (!tenant) return null;
        return {
          id: tenant.id,
          name: tenant.company_name,
          slug: tenant.slug,
          role: membership.role,
        };
      })
      .filter(Boolean);

    const primaryTenant = tenantsInfo[0];
    let status = authUser.email_confirmed_at ? "active" : "inactive";
    let trialEndsAt = null;
    let userPlan = null;

    if (primaryTenant) {
      const subscription = subscriptionMap.get(primaryTenant.id);
      if (subscription) {
        const planData = planMap.get(subscription.plan_id);
        if (planData) {
          userPlan = {
            id: planData.id,
            name: planData.name,
            price: (planData.price_cents ?? 0) / 100,
            max_products: planData.max_products,
          };
        }
        if (subscription.trial_ends_at) {
          trialEndsAt = subscription.trial_ends_at;
        }
        if (subscription.status === "active" || subscription.status === "trial") {
          status = "active";
        } else if (subscription.status === "past_due" || subscription.status === "canceled") {
          status = "inactive";
        }
      }
    }

    if (authUser.banned_until && new Date(authUser.banned_until) > new Date()) {
      status = "suspended";
    }

    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.email,
      tenants: tenantsInfo,
      plan: userPlan,
      trial_ends_at: trialEndsAt,
      status,
    };
  });
};

const ensureSuperAdmin = async (client, userId) => {
  const { data, error } = await client
    .from("tenant_memberships")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data || data.role !== 3) {
    throw new Error("Acesso negado. Apenas super admins.");
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    assertEnv();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Não autenticado" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', '')); // Use service_role client to get user from token

    if (authError || !user) {
      return jsonResponse({ success: false, error: "Não autenticado" }, 401);
    }

    await ensureSuperAdmin(supabase, user.id);

    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const perPageParam = searchParams.get("perPage");
      const perPage = perPageParam ? Math.min(Math.max(parseInt(perPageParam, 10) || 50, 1), 1000) : undefined;

      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers(
        perPage ? { perPage } : undefined,
      );

      if (listError) throw listError;

      const [membershipsRes, tenantsRes, subscriptionsRes, plansRes] = await Promise.all([
        supabase.from("tenant_memberships").select("user_id, tenant_id, role"),
        supabase.from("tenants").select("id, company_name, slug"),
        supabase.from("subscriptions").select("tenant_id, plan_id, trial_ends_at, status"),
        supabase.from("plans").select("id, name, price_cents, max_products"),
      ]);

      if (membershipsRes.error || tenantsRes.error || subscriptionsRes.error || plansRes.error) {
        throw membershipsRes.error || tenantsRes.error || subscriptionsRes.error || plansRes.error;
      }

      const users = formatUsers(
        authUsers?.users ?? [],
        membershipsRes.data,
        tenantsRes.data,
        subscriptionsRes.data,
        plansRes.data,
      );

      return jsonResponse({ success: true, data: { users } });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { userId, action } = body;

      if (!userId || !action) {
        return jsonResponse({ success: false, error: "userId e action são obrigatórios" }, 400);
      }

      const timestamp = new Date().toISOString();

      if (action === "changePlan") {
        const { tenant_id, plan_id } = body;
        if (!tenant_id || !plan_id) {
          return jsonResponse({ success: false, error: "tenant_id e plan_id são obrigatórios" }, 400);
        }

        const { data: planData, error: planError } = await supabase
          .from("plans")
          .select("id, trial_days")
          .eq("id", plan_id)
          .single();

        if (planError || !planData) {
          return jsonResponse({ success: false, error: "Plano não encontrado" }, 404);
        }

        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id, status")
          .eq("tenant_id", tenant_id)
          .maybeSingle();

        let trialEndsAt = null;
        if (planData.trial_days > 0) {
          const now = new Date();
          now.setDate(now.getDate() + planData.trial_days);
          trialEndsAt = now.toISOString();
        }

        if (existingSub) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ 
              plan_id: plan_id, 
              updated_at: timestamp,
              trial_ends_at: trialEndsAt,
              status: trialEndsAt ? 'trial' : 'active',
              payment_confirmed: !!trialEndsAt ? false : true, // If trial, not confirmed yet
              payment_date: !!trialEndsAt ? null : timestamp,
            })
            .eq("tenant_id", tenant_id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("subscriptions")
            .insert({
              tenant_id: tenant_id,
              plan_id: plan_id,
              status: trialEndsAt ? 'trial' : 'active',
              started_at: timestamp,
              trial_ends_at: trialEndsAt,
              payment_confirmed: !!trialEndsAt ? false : true,
              payment_date: !!trialEndsAt ? null : timestamp,
            });
          if (error) throw error;
        }

        await supabase
          .from('admin_logs')
          .insert({
            action: 'user_plan_changed',
            user_id: user.id,
            meta: { target_user_id: userId, tenant_id: tenant_id, new_plan_id: plan_id }
          });

        return jsonResponse({ success: true, message: "Plano atualizado com sucesso" });
      }

      if (action === "addDays") {
        const { tenant_id, days } = body;
        if (!tenant_id || !days || Number(days) <= 0) {
          return jsonResponse({ success: false, error: "tenant_id e days (>0) são obrigatórios" }, 400);
        }

        const { data: subscription, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("trial_ends_at")
          .eq("tenant_id", tenant_id)
          .single();

        if (subscriptionError || !subscription) {
          return jsonResponse({ success: false, error: "Subscription não encontrada" }, 404);
        }

        const baseDate = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : new Date();
        baseDate.setDate(baseDate.getDate() + Number(days));
        const newTrialEnds = baseDate.toISOString();

        const [{ error: updateSubError }, { error: updateTenantError }] = await Promise.all([
          supabase
            .from("subscriptions")
            .update({
              trial_ends_at: newTrialEnds,
              status: "active",
              payment_confirmed: true,
              payment_date: timestamp,
              updated_at: timestamp,
            })
            .eq("tenant_id", tenant_id),
          supabase
            .from("tenants")
            .update({
              trial_ends_at: newTrialEnds,
              subscription_status: "active",
              active: true,
              updated_at: timestamp,
            })
            .eq("id", tenant_id),
        ]);

        if (updateSubError || updateTenantError) {
          throw updateSubError || updateTenantError;
        }

        await supabase
          .from('admin_logs')
          .insert({
            action: 'user_trial_extended',
            user_id: user.id,
            meta: { target_user_id: userId, tenant_id: tenant_id, days_added: days, new_trial_ends: newTrialEnds }
          });

        return jsonResponse({ success: true, message: `${days} dias adicionados` });
      }

      if (action === "toggleSuspend") {
        const { tenant_id, targetStatus } = body; // targetStatus: true para suspender, false para reativar
        if (!tenant_id || typeof targetStatus !== "boolean") {
          return jsonResponse({ success: false, error: "tenant_id e targetStatus (boolean) são obrigatórios" }, 400);
        }

        const banDuration = targetStatus ? "8760h" : "none"; // 1 ano para suspender, 'none' para reativar

        const [{ error: banError }, { error: tenantError }, { error: subError }] = await Promise.all([
          supabase.auth.admin.updateUserById(userId, { ban_duration: banDuration }),
          supabase
            .from("tenants")
            .update({ active: !targetStatus, subscription_status: targetStatus ? "suspended" : "active", updated_at: timestamp })
            .eq("id", tenant_id),
          supabase
            .from("subscriptions")
            .update({ status: targetStatus ? "past_due" : "active", updated_at: timestamp })
            .eq("tenant_id", tenant_id),
        ]);

        if (banError || tenantError || subError) {
          throw banError || tenantError || subError;
        }

        await supabase
          .from('admin_logs')
          .insert({
            action: targetStatus ? 'user_suspended' : 'user_reactivated',
            user_id: user.id,
            meta: { target_user_id: userId, tenant_id: tenant_id, status: targetStatus ? 'suspended' : 'active' }
          });

        return jsonResponse({
          success: true,
          message: targetStatus ? "Usuário e tenant suspensos" : "Usuário e tenant reativados",
        });
      }

      if (action === "resetPassword") {
        const newPassword = randomPassword();
        const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) throw error;

        await supabase
          .from('admin_logs')
          .insert({
            action: 'user_password_reset',
            user_id: user.id,
            meta: { target_user_id: userId }
          });

        return jsonResponse({
          success: true,
          message: "Senha resetada",
          new_password: newPassword,
        });
      }

      return jsonResponse({ success: false, error: "Ação inválida" }, 400);
    }

    return jsonResponse({ success: false, error: "Método não permitido" }, 405);
  } catch (error) {
    console.error("Erro em superadmin-users:", error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      500,
    );
  }
});