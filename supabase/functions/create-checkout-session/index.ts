import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
    planId: string;
    gateway: "mercadopago" | "asaas";
    successUrl?: string;
    cancelUrl?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Auth check
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Não autorizado" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
            authHeader.replace("Bearer ", "")
        );

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        // Get tenant
        const { data: membership } = await supabaseClient
            .from("tenant_memberships")
            .select("tenant_id, tenants(company_name, email)")
            .eq("user_id", user.id)
            .single();

        if (!membership) {
            return new Response(JSON.stringify({ error: "Tenant não encontrado" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 404,
            });
        }

        const body: CheckoutRequest = await req.json();
        const { planId, gateway, successUrl, cancelUrl } = body;

        // Get plan details
        const { data: plan, error: planError } = await supabaseClient
            .from("plans")
            .select("*")
            .eq("id", planId)
            .single();

        if (planError || !plan) {
            return new Response(JSON.stringify({ error: "Plano não encontrado" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 404,
            });
        }

        // Get payment settings
        const { data: settings } = await supabaseClient
            .from("system_settings")
            .select("payment")
            .limit(1)
            .maybeSingle();

        const paymentSettings = settings?.payment as any || {};

        let checkoutUrl: string;

        if (gateway === "mercadopago") {
            checkoutUrl = await createMercadoPagoCheckout(
                paymentSettings,
                plan,
                membership,
                user,
                successUrl,
                cancelUrl
            );
        } else if (gateway === "asaas") {
            checkoutUrl = await createAsaasCheckout(
                paymentSettings,
                plan,
                membership,
                user,
                successUrl,
                cancelUrl
            );
        } else {
            return new Response(JSON.stringify({ error: "Gateway inválido" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        return new Response(
            JSON.stringify({ checkoutUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Checkout error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Erro ao criar checkout" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});

async function createMercadoPagoCheckout(
    settings: any,
    plan: any,
    membership: any,
    user: any,
    successUrl?: string,
    cancelUrl?: string
): Promise<string> {
    const accessToken = settings.mercadopago_access_token;
    if (!accessToken) {
        throw new Error("Mercado Pago não configurado");
    }

    const isSandbox = settings.mercadopago_sandbox;
    const baseUrl = isSandbox
        ? "https://api.mercadopago.com"
        : "https://api.mercadopago.com";

    const tenant = membership.tenants as any;
    const priceInReais = plan.price_cents / 100;

    const preference = {
        items: [
            {
                id: plan.id,
                title: `VitrinePro - Plano ${plan.name}`,
                description: plan.description || `Assinatura mensal do plano ${plan.name}`,
                quantity: 1,
                currency_id: "BRL",
                unit_price: priceInReais,
            },
        ],
        payer: {
            email: user.email,
            name: tenant.company_name,
        },
        back_urls: {
            success: successUrl || `${Deno.env.get("FRONTEND_URL") || "http://localhost:8080"}/dashboard?payment=success`,
            failure: cancelUrl || `${Deno.env.get("FRONTEND_URL") || "http://localhost:8080"}/dashboard?payment=failed`,
            pending: `${Deno.env.get("FRONTEND_URL") || "http://localhost:8080"}/dashboard?payment=pending`,
        },
        auto_return: "approved",
        external_reference: JSON.stringify({
            tenant_id: membership.tenant_id,
            plan_id: plan.id,
            user_id: user.id,
        }),
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/webhook-mercadopago`,
    };

    const response = await fetch(`${baseUrl}/checkout/preferences`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(preference),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("MercadoPago error:", errorData);
        throw new Error("Erro ao criar preferência no Mercado Pago");
    }

    const data = await response.json();
    return isSandbox ? data.sandbox_init_point : data.init_point;
}

async function createAsaasCheckout(
    settings: any,
    plan: any,
    membership: any,
    user: any,
    successUrl?: string,
    cancelUrl?: string
): Promise<string> {
    const apiKey = settings.asaas_api_key;
    if (!apiKey) {
        throw new Error("Asaas não configurado");
    }

    const isSandbox = settings.asaas_sandbox;
    const baseUrl = isSandbox
        ? "https://sandbox.asaas.com/api/v3"
        : "https://www.asaas.com/api/v3";

    const tenant = membership.tenants as any;
    const priceInReais = plan.price_cents / 100;

    // First, create or get customer
    const customerResponse = await fetch(`${baseUrl}/customers`, {
        method: "POST",
        headers: {
            "access_token": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: tenant.company_name,
            email: user.email,
            externalReference: membership.tenant_id,
        }),
    });

    let customerId: string;

    if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        customerId = customerData.id;
    } else {
        // Customer might already exist, try to find
        const searchResponse = await fetch(
            `${baseUrl}/customers?email=${encodeURIComponent(user.email)}`,
            {
                headers: { "access_token": apiKey },
            }
        );
        const searchData = await searchResponse.json();
        if (searchData.data && searchData.data.length > 0) {
            customerId = searchData.data[0].id;
        } else {
            throw new Error("Erro ao criar cliente no Asaas");
        }
    }

    // Create payment link
    const paymentLinkResponse = await fetch(`${baseUrl}/paymentLinks`, {
        method: "POST",
        headers: {
            "access_token": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: `VitrinePro - Plano ${plan.name}`,
            description: plan.description || `Assinatura mensal do plano ${plan.name}`,
            billingType: "UNDEFINED", // Allows PIX, Boleto, Card
            chargeType: "DETACHED",
            value: priceInReais,
            dueDateLimitDays: 7,
            subscriptionCycle: "MONTHLY",
            maxInstallmentCount: 1,
            notificationEnabled: true,
            externalReference: JSON.stringify({
                tenant_id: membership.tenant_id,
                plan_id: plan.id,
                user_id: user.id,
            }),
        }),
    });

    if (!paymentLinkResponse.ok) {
        const errorData = await paymentLinkResponse.text();
        console.error("Asaas error:", errorData);
        throw new Error("Erro ao criar link de pagamento no Asaas");
    }

    const paymentLinkData = await paymentLinkResponse.json();
    return paymentLinkData.url;
}
