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
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await req.json();
        const { order_id, slug, payment_method = "PIX" } = body;

        if (!order_id || !slug) {
            return new Response(
                JSON.stringify({ error: "order_id e slug são obrigatórios" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // Buscar o pedido
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, total, customer_name, customer_email, customer_whatsapp, tenant_id")
            .eq("id", order_id)
            .single();

        if (orderError || !order) {
            return new Response(
                JSON.stringify({ error: "Pedido não encontrado" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
            );
        }

        // Verificar que o pedido pertence ao tenant correto
        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select("id, slug, company_name")
            .eq("id", order.tenant_id)
            .single();

        if (tenantError || !tenant || tenant.slug !== slug) {
            return new Response(
                JSON.stringify({ error: "Pedido não pertence a esta loja" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
            );
        }

        // Obter configurações Asaas da plataforma (superadmin)
        const { data: sysSettings } = await supabase
            .from("system_settings")
            .select("payment")
            .limit(1)
            .maybeSingle();

        const paymentSettings = (sysSettings?.payment as any) || {};
        const apiKey = paymentSettings.asaas_api_key;

        if (!apiKey || !paymentSettings.asaas_enabled) {
            return new Response(
                JSON.stringify({ error: "Pagamento via Asaas não está configurado" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 }
            );
        }

        const isSandbox = paymentSettings.asaas_sandbox;
        const baseUrl = isSandbox
            ? "https://sandbox.asaas.com/api/v3"
            : "https://www.asaas.com/api/v3";

        // Criar ou encontrar cliente no Asaas
        let customerId: string;

        const customerPayload: Record<string, string> = {
            name: order.customer_name || "Cliente",
            externalReference: `order-customer-${order_id}`,
        };
        if (order.customer_email) customerPayload.email = order.customer_email;
        if (order.customer_whatsapp) {
            customerPayload.mobilePhone = order.customer_whatsapp.replace(/\D/g, "");
        }

        const customerRes = await fetch(`${baseUrl}/customers`, {
            method: "POST",
            headers: { "access_token": apiKey, "Content-Type": "application/json" },
            body: JSON.stringify(customerPayload),
        });

        if (customerRes.ok) {
            const cd = await customerRes.json();
            customerId = cd.id;
        } else {
            // Tentar encontrar pelo e-mail
            if (order.customer_email) {
                const searchRes = await fetch(
                    `${baseUrl}/customers?email=${encodeURIComponent(order.customer_email)}`,
                    { headers: { "access_token": apiKey } }
                );
                const sd = await searchRes.json();
                if (sd.data?.length > 0) {
                    customerId = sd.data[0].id;
                } else {
                    throw new Error("Erro ao criar cliente no Asaas");
                }
            } else {
                throw new Error("Erro ao criar cliente no Asaas");
            }
        }

        // Calcular data de vencimento
        // PIX: usa a data de HOJE (Asaas controla a expiração interna do QR code)
        // Boleto: vence em 3 dias corridos
        const now = new Date();
        const dueDate = new Date(now);
        if (payment_method !== "PIX") {
            dueDate.setDate(dueDate.getDate() + 3);
        }
        // Ajustar para fuso horário de Brasília (UTC-3) para que a data seja a correta no Brasil
        const brOffset = -3 * 60; // -180 minutos
        const localDue = new Date(dueDate.getTime() + brOffset * 60000);
        const dueDateStr = localDue.toISOString().split("T")[0]; // YYYY-MM-DD

        // Criar cobrança no Asaas
        const chargePayload = {
            customer: customerId,
            billingType: payment_method === "BOLETO_BANCARIO" ? "BOLETO" : "PIX",
            value: order.total,
            dueDate: dueDateStr,
            description: `Pedido #${order_id.substring(0, 8).toUpperCase()} - ${tenant.company_name}`,
            externalReference: JSON.stringify({ order_id }),
        };

        const chargeRes = await fetch(`${baseUrl}/payments`, {
            method: "POST",
            headers: { "access_token": apiKey, "Content-Type": "application/json" },
            body: JSON.stringify(chargePayload),
        });

        if (!chargeRes.ok) {
            const errText = await chargeRes.text();
            console.error("Asaas charge error:", errText);
            throw new Error("Erro ao criar cobrança no Asaas");
        }

        const charge = await chargeRes.json();

        // Para PIX: buscar QR code
        let pix_qr_code: string | undefined;
        let pix_qr_code_url: string | undefined;

        if (payment_method === "PIX") {
            const pixRes = await fetch(`${baseUrl}/payments/${charge.id}/pixQrCode`, {
                headers: { "access_token": apiKey },
            });
            if (pixRes.ok) {
                const pixData = await pixRes.json();
                pix_qr_code = pixData.payload;
                if (pixData.encodedImage) {
                    pix_qr_code_url = `data:image/png;base64,${pixData.encodedImage}`;
                }
            }
        }

        // Para Boleto: buscar linha digitável
        let boleto_code: string | undefined;
        if (payment_method === "BOLETO_BANCARIO" && charge.bankSlipUrl) {
            const barcodeRes = await fetch(`${baseUrl}/payments/${charge.id}/identificationField`, {
                headers: { "access_token": apiKey },
            });
            if (barcodeRes.ok) {
                const barcodeData = await barcodeRes.json();
                boleto_code = barcodeData.identificationField;
            }
        }

        // Atualizar pedido com dados do pagamento Asaas
        await supabase
            .from("orders")
            .update({
                asaas_payment_id: charge.id,
                asaas_pix_qr_code: pix_qr_code,
                asaas_pix_qr_code_url: pix_qr_code_url,
                asaas_boleto_url: charge.bankSlipUrl || undefined,
                asaas_boleto_code: boleto_code,
                asaas_invoice_url: charge.invoiceUrl || undefined,
                payment_due_date: dueDate.toISOString(),
            })
            .eq("id", order_id);

        return new Response(
            JSON.stringify({
                asaas_payment_id: charge.id,
                pix_qr_code,
                pix_qr_code_url,
                boleto_url: charge.bankSlipUrl,
                boleto_code,
                invoice_url: charge.invoiceUrl,
                due_date: dueDate.toISOString(),
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("create-store-order-payment error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Erro interno ao processar pagamento" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
