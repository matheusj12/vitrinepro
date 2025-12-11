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
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        const body = await req.json();
        console.log("MercadoPago Webhook received:", JSON.stringify(body));

        // Mercado Pago sends different notification types
        const { action, data, type } = body;

        if (type === "payment" || action === "payment.updated" || action === "payment.created") {
            const paymentId = data?.id;

            if (!paymentId) {
                console.log("No payment ID in webhook");
                return new Response("OK", { status: 200 });
            }

            // Get payment settings
            const { data: settings } = await supabaseClient
                .from("system_settings")
                .select("payment")
                .limit(1)
                .maybeSingle();

            const paymentSettings = settings?.payment as any || {};
            const accessToken = paymentSettings.mercadopago_access_token;

            if (!accessToken) {
                console.error("No MercadoPago access token configured");
                return new Response("OK", { status: 200 });
            }

            // Fetch payment details from MercadoPago
            const paymentResponse = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (!paymentResponse.ok) {
                console.error("Failed to fetch payment from MercadoPago");
                return new Response("OK", { status: 200 });
            }

            const payment = await paymentResponse.json();
            console.log("Payment status:", payment.status);

            // Only process approved payments
            if (payment.status !== "approved") {
                console.log("Payment not approved yet:", payment.status);
                return new Response("OK", { status: 200 });
            }

            // Parse external reference
            let externalRef;
            try {
                externalRef = JSON.parse(payment.external_reference);
            } catch (e) {
                console.error("Invalid external_reference:", payment.external_reference);
                return new Response("OK", { status: 200 });
            }

            const { tenant_id, plan_id } = externalRef;

            // Update subscription
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

            // Update tenant status
            await supabaseClient
                .from("tenants")
                .update({
                    subscription_status: "active",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", tenant_id);

            // Log the payment
            await supabaseClient.from("admin_logs").insert({
                action: "payment_confirmed",
                tenant_id: tenant_id,
                details: {
                    gateway: "mercadopago",
                    payment_id: paymentId,
                    plan_id: plan_id,
                    amount: payment.transaction_amount,
                },
            });
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Webhook error:", error);
        return new Response("Error", { status: 500 });
    }
});
