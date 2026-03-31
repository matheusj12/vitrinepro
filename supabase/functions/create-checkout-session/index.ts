import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
    planId: string;
    gateway: "mercadopago" | "asaas";
    cpfCnpj?: string;
    billingType?: "PIX" | "CREDIT_CARD";
    couponCode?: string;
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
        const { planId, gateway, cpfCnpj, billingType, couponCode, successUrl, cancelUrl } = body;

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
            // Validar cupom se informado
            let couponData: { discount_type: string; discount_value: number; pix_only: boolean; id: string } | null = null;
            if (couponCode) {
                const { data: coupon } = await supabaseClient
                    .from("subscription_coupons" as any)
                    .select("id, discount_type, discount_value, pix_only, expires_at, max_uses, current_uses")
                    .eq("code", couponCode.toUpperCase())
                    .eq("active", true)
                    .maybeSingle() as { data: any };
                if (coupon) {
                    const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                    const exhausted = coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses;
                    const pixMismatch = coupon.pix_only && billingType !== "PIX";
                    if (!expired && !exhausted && !pixMismatch) {
                        couponData = coupon;
                    }
                }
            }

            checkoutUrl = await createAsaasCheckout(
                paymentSettings,
                plan,
                membership,
                user,
                successUrl,
                cancelUrl,
                cpfCnpj,
                billingType,
                couponData
            );

            // Incrementar uso do cupom após criar a assinatura
            if (couponData) {
                await supabaseClient
                    .from("subscription_coupons" as any)
                    .update({ current_uses: (couponData as any).current_uses + 1 } as any)
                    .eq("id", couponData.id);
            }
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
    cancelUrl?: string,
    cpfCnpj?: string,
    billingType?: string,
    coupon?: { discount_type: string; discount_value: number } | null
): Promise<string> {
    // API key vem de Supabase Secret (mais seguro que banco de dados)
    const apiKey = Deno.env.get("ASAAS_API_KEY") || settings.asaas_api_key;
    if (!apiKey) {
        throw new Error("Asaas não configurado. Adicione ASAAS_API_KEY nos Supabase Secrets.");
    }

    // Env var tem prioridade sobre o banco
    const sandboxEnv = Deno.env.get("ASAAS_SANDBOX");
    const isSandbox = sandboxEnv !== undefined ? sandboxEnv === "true" : settings.asaas_sandbox;
    const baseUrl = isSandbox
        ? "https://sandbox.asaas.com/api/v3"
        : "https://www.asaas.com/api/v3";

    const tenant = membership.tenants as any;
    const priceInReais = plan.price_cents / 100;

    // Aplicar desconto do cupom
    let finalPrice = priceInReais;
    if (coupon) {
        if (coupon.discount_type === "percent") {
            finalPrice = Math.round(priceInReais * (1 - coupon.discount_value / 100) * 100) / 100;
        } else {
            finalPrice = Math.max(1, priceInReais - coupon.discount_value);
        }
    }

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
            cpfCnpj: cpfCnpj,
            externalReference: membership.tenant_id,
        }),
    });

    let customerId: string;

    if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        customerId = customerData.id;
    } else {
        const customerErrorText = await customerResponse.text();
        console.error("Asaas customer creation failed:", customerResponse.status, customerErrorText);

        // Cliente pode já existir, tentar buscar por email
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
            // Retornar erro detalhado do Asaas
            let asaasDetail = "";
            try {
                const parsed = JSON.parse(customerErrorText);
                if (parsed.errors?.length > 0) {
                    asaasDetail = ": " + parsed.errors.map((e: any) => e.description || e.message).join("; ");
                } else if (parsed.message) {
                    asaasDetail = ": " + parsed.message;
                }
            } catch {}
            throw new Error(`Erro ao criar cliente no Asaas${asaasDetail} (status ${customerResponse.status})`);
        }
    }

    // Calcular próxima data de vencimento (hoje + 1 dia para dar tempo do cliente pagar)
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const nextDueDateStr = nextDueDate.toISOString().split("T")[0];

    // Criar assinatura recorrente mensal no Asaas
    const subscriptionResponse = await fetch(`${baseUrl}/subscriptions`, {
        method: "POST",
        headers: {
            "access_token": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            customer: customerId,
            billingType: billingType || "CREDIT_CARD",
            value: finalPrice,
            nextDueDate: nextDueDateStr,
            cycle: "MONTHLY",
            description: `VitrinePro - Plano ${plan.name}`,
            // Chaves curtas para respeitar limite de 100 chars do Asaas
            externalReference: JSON.stringify({ t: membership.tenant_id, p: plan.id }),
        }),
    });

    if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.text();
        console.error("Asaas subscription error:", errorData);
        let asaasMessage = "Erro ao criar assinatura no Asaas";
        try {
            const parsed = JSON.parse(errorData);
            if (parsed.errors?.length > 0) {
                asaasMessage = parsed.errors.map((e: any) => e.description || e.message).join("; ");
            } else if (parsed.message) {
                asaasMessage = parsed.message;
            }
        } catch {}
        throw new Error(asaasMessage);
    }

    const subscriptionData = await subscriptionResponse.json();

    // Buscar a primeira cobrança gerada pela assinatura para obter a URL de pagamento
    const paymentsResponse = await fetch(
        `${baseUrl}/subscriptions/${subscriptionData.id}/payments`,
        { headers: { "access_token": apiKey } }
    );

    if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsData.data?.length > 0) {
            const firstPayment = paymentsData.data[0];
            if (firstPayment.invoiceUrl) return firstPayment.invoiceUrl;
            if (firstPayment.bankSlipUrl) return firstPayment.bankSlipUrl;
        }
    }

    // Fallback: usar invoiceUrl da própria assinatura
    if (subscriptionData.invoiceUrl) return subscriptionData.invoiceUrl;

    throw new Error("Asaas não retornou URL de pagamento. Verifique o dashboard do Asaas.");
}
