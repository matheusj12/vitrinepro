import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface EnsureTenantResult {
    tenantId: string | null;
    isCreating: boolean;
    error: string | null;
}

/**
 * Hook para garantir que um usuário tenha um tenant associado.
 * Se o tenant não existir, cria automaticamente.
 */
export const useEnsureTenant = (user: User | null): EnsureTenantResult => {
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setTenantId(null);
            return;
        }

        const ensureTenant = async () => {
            try {
                // Primeiro, verificar se já existe membership
                const { data: membership, error: membershipError } = await supabase
                    .from("tenant_memberships")
                    .select("tenant_id")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (membershipError) {
                    console.error("Error checking membership:", membershipError);
                    // Continuar tentando criar
                }

                if (membership?.tenant_id) {
                    console.log("User already has tenant:", membership.tenant_id);
                    setTenantId(membership.tenant_id);
                    return;
                }

                // Não tem tenant, vamos criar
                console.log("No tenant found, creating new tenant for user:", user.id);
                setIsCreating(true);

                // Gerar dados para o tenant
                const fullName = user.user_metadata?.full_name || "Usuário";
                const companyName = `Loja de ${fullName}`;
                let slug = companyName
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, "")
                    .replace(/\s+/g, "-")
                    .substring(0, 50);

                // Verificar se slug já existe e adicionar sufixo se necessário
                const { data: existingSlug } = await supabase
                    .from("tenants")
                    .select("id")
                    .eq("slug", slug)
                    .maybeSingle();

                if (existingSlug) {
                    slug = `${slug}-${Date.now().toString(36)}`;
                }

                // Criar tenant
                const { data: newTenant, error: tenantError } = await supabase
                    .from("tenants")
                    .insert({
                        user_id: user.id,
                        company_name: companyName,
                        slug: slug,
                        email: user.email,
                        whatsapp_number: null,
                        primary_color: "#F97316",
                        subscription_status: "trial",
                        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        active: true,
                    })
                    .select("id")
                    .single();

                if (tenantError) {
                    console.error("Error creating tenant:", tenantError);
                    setError("Erro ao criar sua loja. Por favor, tente novamente.");
                    setIsCreating(false);
                    return;
                }

                console.log("Tenant created:", newTenant.id);

                // Criar membership
                const { error: membershipInsertError } = await supabase
                    .from("tenant_memberships")
                    .insert({
                        tenant_id: newTenant.id,
                        user_id: user.id,
                        role: 2, // owner
                    });

                if (membershipInsertError) {
                    console.error("Error creating membership:", membershipInsertError);
                    // Tenant foi criado mas membership falhou - vamos tentar de novo
                }

                // Criar store_settings padrão
                await supabase.from("store_settings").insert({
                    tenant_id: newTenant.id,
                    branding: {
                        store_title: companyName,
                        primary_color: "#F97316",
                        logo_url: "",
                        favicon_url: "",
                    },
                    storefront: {
                        product_card_style: "classic",
                        listing_columns: 3,
                        banner_style: "carousel",
                        button_shape: "rounded",
                        button_size: "medium",
                        button_variant: "filled",
                        button_animation: "shadow",
                        show_whatsapp_button: true,
                        navbar_style: "fixed",
                        footer_text: `© ${new Date().getFullYear()} ${companyName}. Todos os direitos reservados.`,
                        footer_background: "#0f172a",
                        footer_text_color: "#f8fafc",
                        social: {},
                    },
                    contact: {
                        email: user.email,
                        whatsapp_number: null,
                    },
                });

                // Criar categorias demo
                const categories = [
                    { name: "Ofertas", slug: "ofertas", description: "Produtos em promoção" },
                    { name: "Novidades", slug: "novidades", description: "Produtos novos" },
                    { name: "Populares", slug: "populares", description: "Produtos mais vendidos" },
                ];

                const { data: createdCategories } = await supabase
                    .from("categories")
                    .insert(
                        categories.map((cat) => ({
                            tenant_id: newTenant.id,
                            ...cat,
                            active: true,
                        }))
                    )
                    .select("id, slug");

                // Criar produtos demo
                if (createdCategories && createdCategories.length > 0) {
                    const demoProducts = [
                        {
                            tenant_id: newTenant.id,
                            category_id: createdCategories[0]?.id,
                            name: "Produto Exemplo 1",
                            slug: "produto-exemplo-1",
                            sku: "PROD001",
                            description: "Descrição do produto 1",
                            price: 99.9,
                            min_quantity: 1,
                            image_url:
                                "https://images.unsplash.com/photo-1505740420928-5e560c06f2e0?w=400",
                            featured: true,
                            active: true,
                        },
                        {
                            tenant_id: newTenant.id,
                            category_id: createdCategories[1]?.id,
                            name: "Produto Exemplo 2",
                            slug: "produto-exemplo-2",
                            sku: "PROD002",
                            description: "Descrição do produto 2",
                            price: 149.9,
                            min_quantity: 1,
                            image_url:
                                "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400",
                            featured: false,
                            active: true,
                        },
                        {
                            tenant_id: newTenant.id,
                            category_id: createdCategories[2]?.id,
                            name: "Produto Exemplo 3",
                            slug: "produto-exemplo-3",
                            sku: "PROD003",
                            description: "Descrição do produto 3",
                            price: 199.9,
                            min_quantity: 1,
                            image_url:
                                "https://images.unsplash.com/photo-1520390138845-fd2d229dd553?w=400",
                            featured: true,
                            active: true,
                        },
                    ];

                    await supabase.from("products").insert(demoProducts);
                }

                // Criar banner demo
                await supabase.from("banners").insert({
                    tenant_id: newTenant.id,
                    title: "Bem-vindo!",
                    subtitle: "Sua loja está pronta",
                    image_url:
                        "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1973&auto=format&fit=crop",
                    link: `/loja/${slug}`,
                    active: true,
                    order_position: 0,
                });

                setTenantId(newTenant.id);
                setIsCreating(false);
            } catch (err) {
                console.error("Error in ensureTenant:", err);
                setError("Erro inesperado. Por favor, tente novamente.");
                setIsCreating(false);
            }
        };

        ensureTenant();
    }, [user]);

    return { tenantId, isCreating, error };
};
