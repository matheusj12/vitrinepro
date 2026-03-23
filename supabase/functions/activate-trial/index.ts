import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Não autorizado" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        // Auth client para verificar usuário
        const authClient = createClient(supabaseUrl, supabaseAnon, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: authError } = await authClient.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        // Service client para operações privilegiadas
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { planId } = await req.json();
        if (!planId) {
            return new Response(JSON.stringify({ error: "planId é obrigatório" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // Buscar tenant do usuário
        const { data: membership } = await supabase
            .from("tenant_memberships")
            .select("tenant_id, role")
            .eq("user_id", user.id)
            .single();

        if (!membership) {
            return new Response(JSON.stringify({ error: "Tenant não encontrado" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 404,
            });
        }

        if (membership.role < 2) {
            return new Response(JSON.stringify({ error: "Apenas owners podem ativar trial" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
            });
        }

        // Buscar plano
        const { data: plan } = await supabase
            .from("plans")
            .select("*")
            .eq("id", planId)
            .eq("active", true)
            .single();

        if (!plan) {
            return new Response(JSON.stringify({ error: "Plano não encontrado" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 404,
            });
        }

        if (plan.price_cents === 0) {
            return new Response(JSON.stringify({ error: "Plano gratuito não precisa de trial" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        if (plan.trial_days <= 0) {
            return new Response(JSON.stringify({ error: "Este plano não possui trial" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // Verificar se já usou trial (qualquer subscription com trial_ends_at preenchido)
        const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("id, trial_ends_at, status")
            .eq("tenant_id", membership.tenant_id)
            .maybeSingle();

        if (existingSub?.trial_ends_at !== null && existingSub?.trial_ends_at !== undefined) {
            return new Response(JSON.stringify({ error: "Você já utilizou seu período de trial" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // Calcular data de fim do trial
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + plan.trial_days);

        // Upsert subscription com status trial
        const now = new Date().toISOString();
        const subData = {
            tenant_id: membership.tenant_id,
            plan_id: planId,
            status: "trial",
            started_at: now,
            trial_ends_at: trialEndsAt.toISOString(),
            payment_confirmed: false,
            updated_at: now,
        };

        let subError: any;
        if (existingSub) {
            const { error } = await supabase
                .from("subscriptions")
                .update({ ...subData })
                .eq("id", existingSub.id);
            subError = error;
        } else {
            const { error } = await supabase
                .from("subscriptions")
                .insert({ ...subData });
            subError = error;
        }

        if (subError) {
            console.error("Erro ao ativar trial:", subError);
            return new Response(JSON.stringify({ error: subError.message }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            });
        }

        // Notificação
        await supabase.from("notifications").insert({
            tenant_id: membership.tenant_id,
            type: "trial_started",
            message: `Trial do plano ${plan.name} ativado! Você tem ${plan.trial_days} dias grátis.`,
            read: false,
        }).catch(() => {}); // silencioso se falhar

        return new Response(
            JSON.stringify({
                success: true,
                message: `Trial de ${plan.trial_days} dias ativado com sucesso!`,
                trial_ends_at: trialEndsAt.toISOString(),
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("activate-trial error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Erro interno" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
