import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Validar token do webhook (configurado no superadmin + painel Asaas)
        const { data: sysSettings } = await supabaseClient
            .from("system_settings")
            .select("payment")
            .limit(1)
            .maybeSingle();

        const webhookToken = (sysSettings?.payment as any)?.asaas_webhook_token;
        if (webhookToken) {
            const incomingToken = req.headers.get("asaas-access-token");
            if (incomingToken !== webhookToken) {
                console.warn("Webhook token inválido");
                return new Response("Unauthorized", { status: 401 });
            }
        }

        const body = await req.json();
        console.log("Asaas Webhook received:", JSON.stringify(body));

        // Asaas webhook structure
        const { event, payment } = body;

        // Processar apenas pagamentos confirmados
        const confirmedEvents = [
            "PAYMENT_CONFIRMED",
            "PAYMENT_RECEIVED",
            "PAYMENT_CREDIT_CARD_CAPTURE_CONFIRMED",
        ];

        if (!confirmedEvents.includes(event)) {
            console.log("Event not a confirmation:", event);
            return new Response("OK", { status: 200 });
        }

        if (!payment) {
            console.log("No payment data in webhook");
            return new Response("OK", { status: 200 });
        }

        // Parse external reference
        let externalRef: Record<string, string>;
        try {
            externalRef = JSON.parse(payment.externalReference);
        } catch (e) {
            console.error("Invalid externalReference:", payment.externalReference);
            return new Response("OK", { status: 200 });
        }

        const { order_id, tenant_id, plan_id } = externalRef;

        if (order_id) {
            // ── Pagamento de pedido de loja ──────────────────────────────
            const { error: updateError } = await supabaseClient
                .from("orders")
                .update({
                    payment_status: "paid",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", order_id);

            if (updateError) {
                console.error("Failed to update order payment status:", updateError);
            } else {
                console.log(`Order ${order_id} payment confirmed`);
            }

            // Log
            await supabaseClient.from("admin_logs").insert({
                action: "order_payment_confirmed",
                details: {
                    gateway: "asaas",
                    payment_id: payment.id,
                    order_id,
                    amount: payment.value,
                    billing_type: payment.billingType,
                },
            });
        } else if (tenant_id && plan_id) {
            // ── Pagamento de assinatura (store owner → plataforma) ───────
            const { error: updateError } = await supabaseClient
                .from("subscriptions")
                .update({
                    status: "active",
                    payment_confirmed: true,
                    payment_date: new Date().toISOString(),
                    plan_id: plan_id,
                    updated_at: new Date().toISOString(),
                })
                .eq("tenant_id", tenant_id);

            if (updateError) {
                console.error("Failed to update subscription:", updateError);
            } else {
                console.log(`Subscription activated for tenant ${tenant_id}`);
            }

            // Atualizar status do tenant
            await supabaseClient
                .from("tenants")
                .update({
                    subscription_status: "active",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", tenant_id);

            // Log
            await supabaseClient.from("admin_logs").insert({
                action: "payment_confirmed",
                tenant_id: tenant_id,
                details: {
                    gateway: "asaas",
                    payment_id: payment.id,
                    plan_id: plan_id,
                    amount: payment.value,
                    billing_type: payment.billingType,
                },
            });
        } else {
            console.log("Unknown externalReference format:", externalRef);
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Webhook error:", error);
        return new Response("Error", { status: 500 });
    }
});
