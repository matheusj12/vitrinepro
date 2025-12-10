import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantBySlug } from "@/hooks/useTenant";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "@/hooks/useTheme";
import { Product, Category, Banner, Theme, StoreSettings } from "@/types/database";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FloatingWhatsAppButton } from "@/components/storefront/FloatingWhatsAppButton";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { StorefrontBanner } from "@/components/storefront/StorefrontBanner";
import { StorefrontFilters } from "@/components/storefront/StorefrontFilters";
import { StorefrontProductGrid } from "@/components/storefront/StorefrontProductGrid";
import { SocialProofWidget } from "@/components/storefront/SocialProofWidget";

const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: tenant, isLoading: tenantLoading } = useTenantBySlug(slug);
  const { addItem } = useCart();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("");

  useTheme(tenant?.id);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data, error } = await supabase
        .from("store_settings")
        .select(`
          *,
          themes (*)
        `)
        .eq("tenant_id", tenant.id)
        .single();
      if (error) throw error;
      return data as StoreSettings & { themes: Theme };
    },
    enabled: !!tenant?.id,
  });

  // Favicon dinâmico (logo quando existir, fallback mantém padrão)
  useEffect(() => {
    const logoUrl = (storeSettings as any)?.branding?.logo_url as string | undefined;
    let linkEl = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.rel = "icon";
      document.head.appendChild(linkEl);
    }
    const previousHref = linkEl.href;
    linkEl.href = logoUrl || "/favicon.ico";
    return () => {
      if (previousHref) {
        linkEl!.href = previousHref;
      }
    };
  }, [storeSettings]);

  // Open Graph dinâmico
  useEffect(() => {
    if (!tenant) return;

    const storeName = tenant.company_name || "Loja";
    const logoUrl = (storeSettings as any)?.branding?.logo_url as string | undefined;
    const aboutText = (storeSettings as any)?.branding?.about_text as string | undefined;
    const description =
      (aboutText && aboutText.trim().length > 0)
        ? aboutText
        : `Veja os produtos da loja ${storeName}`;
    const fullUrl = `${window.location.origin}/loja/${slug}`;

    const upsertProperty = (prop: string, content?: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[property='${prop}']`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", prop);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const upsertName = (name: string, content?: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Definir OG
    upsertProperty("og:title", storeName);
    upsertProperty("og:description", description);
    upsertProperty("og:image", logoUrl || "");
    upsertProperty("og:url", fullUrl);
    upsertProperty("og:type", "website");

    // Também atualizar a descrição padrão da página
    upsertName("description", description);

    // Remover possíveis referências antigas da Lovable (defensivo)
    const metas = Array.from(document.querySelectorAll("meta"));
    metas.forEach((m) => {
      const c = m.getAttribute("content") || "";
      if (c.includes("lovable.dev/opengraph-image") || c.includes("Lovable Generated Project")) {
        m.parentElement?.removeChild(m);
      }
    });
  }, [tenant, storeSettings, slug]);

  // Ícones globais do Super Admin
  const { data: globalIcons } = useQuery({
    queryKey: ["system-settings-icons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("social")
        .limit(1)
        .maybeSingle();
      if (error) return {};
      return ((data?.social as any)?.icons || {}) as Record<string, string>;
    },
  });

  const theme = storeSettings?.themes;

  const { data: sortedCategoryProducts = [], isLoading: sortedCategoryProductsLoading } = useQuery({
    queryKey: ["storefront-products-sorted", tenant?.id, selectedCategoryIds, sortOption],
    queryFn: async () => {
      if (!tenant?.id || debouncedSearchQuery) return [];

      if (sortOption === 'best_sellers') {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const url = new URL(`${supabaseUrl}/functions/v1/storefront-top-products`);
        url.searchParams.append('slug', slug!);
        url.searchParams.append('limit', '20');

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch top products");
        }
        const data = await response.json();
        if (selectedCategoryIds.length > 0) {
          return data.products.filter((p: Product) => p.category_id && selectedCategoryIds.includes(p.category_id));
        }
        return data.products as Product[];

      } else {
        let query = supabase
          .from("products")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("active", true);

        if (selectedCategoryIds.length > 0) {
          query = query.in("category_id", selectedCategoryIds);
        }

        if (sortOption === 'price_asc') {
          query = query.order('price', { ascending: true, nullsFirst: false });
        } else if (sortOption === 'price_desc') {
          query = query.order('price', { ascending: false, nullsFirst: false });
        } else {
          query = query.order("created_at", { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Product[];
      }
    },
    enabled: !!tenant?.id && !debouncedSearchQuery,
  });

  const { data: searchResults = { products: [], pagination: { total: 0 } }, isLoading: searchLoading } = useQuery({
    queryKey: ["storefront-search", tenant?.id, debouncedSearchQuery],
    queryFn: async () => {
      if (!tenant?.id || !debouncedSearchQuery) return { products: [], pagination: { total: 0 } };

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = new URL(`${supabaseUrl}/functions/v1/storefront-search`);
      url.searchParams.append('slug', slug!);
      url.searchParams.append('q', debouncedSearchQuery);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching search results:", errorData);
        throw new Error(errorData.error || "Failed to fetch search results");
      }
      return response.json();
    },
    enabled: !!tenant?.id && !!debouncedSearchQuery,
  });

  let displayedProducts = debouncedSearchQuery ? searchResults.products : sortedCategoryProducts;
  let isLoadingProducts = debouncedSearchQuery ? searchLoading : sortedCategoryProductsLoading;

  if (debouncedSearchQuery && sortOption !== 'best_sellers') {
    if (sortOption === 'price_asc') {
      displayedProducts = [...displayedProducts].sort((a: Product, b: Product) => (a.price || 0) - (b.price || 0));
    } else if (sortOption === 'price_desc') {
      displayedProducts = [...displayedProducts].sort((a: Product, b: Product) => (b.price || 0) - (a.price || 0));
    }
  }

  const { data: categories = [] } = useQuery({
    queryKey: ["storefront-categories", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("active", true);
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!tenant?.id,
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["storefront-banners", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("active", true)
        .order("order_position", { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) {
        return [
          {
            id: "default",
            tenant_id: tenant.id,
            image_url: "/images/default-banner-2560x1440.png",
            title: null,
            subtitle: null,
            link: null,
            active: true,
            order_position: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ] as Banner[];
      }
      return data as Banner[];
    },
    enabled: !!tenant?.id,
  });

  useEffect(() => {
    if (!tenant?.id) return;
    supabase.functions
      .invoke("analytics-log-event", {
        body: {
          tenantId: tenant.id,
          eventType: "page_view",
          meta: { slug, timestamp: new Date().toISOString() },
        },
      })
      .catch(() => { });
  }, [tenant?.id, slug]);

  const handleAddToCart = (product: Product) => {
    addItem(product, product.min_quantity);
    toast.success(`${product.name} adicionado ao carrinho!`);
    if (tenant?.id) {
      supabase.functions
        .invoke("analytics-log-event", {
          body: {
            tenantId: tenant.id,
            eventType: "product_view",
            productId: product.id,
            meta: { product_name: product.name, product_sku: product.sku },
          },
        })
        .catch(() => { });
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loja não encontrada</p>
      </div>
    );
  }

  const gridColumns = theme?.config?.grid?.columns || {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  };
  const productGridClasses = `grid grid-cols-${gridColumns.mobile} sm:grid-cols-${gridColumns.tablet} lg:grid-cols-${gridColumns.desktop} gap-4 sm:gap-6`;

  // Links do cliente
  const contact = (storeSettings?.contact as any) || {};
  const instagramUrl = contact.instagram_url as string | undefined;
  const facebookUrl = contact.facebook_url as string | undefined;
  const tiktokUrl = contact.tiktok_url as string | undefined;
  const youtubeUrl = contact.youtube_url as string | undefined;
  const whatsappBusinessUrl = contact.whatsapp_business_url as string | undefined;
  const pinterestUrl = contact.pinterest_url as string | undefined;
  const twitterUrl = contact.twitter_url as string | undefined;
  const linkedinUrl = contact.linkedin_url as string | undefined;

  // Ícones globais (super admin)
  const instagramIcon = (globalIcons as any)?.instagram;
  const facebookIcon = (globalIcons as any)?.facebook;
  const tiktokIcon = (globalIcons as any)?.tiktok;
  const youtubeIcon = (globalIcons as any)?.youtube;
  const whatsappIcon = (globalIcons as any)?.whatsapp;
  const pinterestIcon = (globalIcons as any)?.pinterest;
  const twitterIcon = (globalIcons as any)?.twitter;
  const linkedinIcon = (globalIcons as any)?.linkedin;

  const floatingIconUrl = (storeSettings as any)?.floating_button_icon_url as string | undefined;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader
        storeName={tenant?.company_name || "Loja"}
        logoUrl={(storeSettings as any)?.branding?.logo_url}
        whatsappNumber={(storeSettings as any)?.contact?.whatsapp_number}
        instagramUrl={instagramUrl}
        facebookUrl={facebookUrl}
        tiktokUrl={tiktokUrl}
        youtubeUrl={youtubeUrl}
        whatsappBusinessUrl={whatsappBusinessUrl}
        pinterestUrl={pinterestUrl}
        twitterUrl={twitterUrl}
        linkedinUrl={linkedinUrl}
        instagramIcon={instagramIcon}
        facebookIcon={facebookIcon}
        tiktokIcon={tiktokIcon}
        youtubeIcon={youtubeIcon}
        whatsappIcon={whatsappIcon}
        pinterestIcon={pinterestIcon}
        twitterIcon={twitterIcon}
        linkedinIcon={linkedinIcon}
        categories={categories || []}
        slug={slug!}
      />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <StorefrontBanner banners={banners} />

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
          <StorefrontFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategoryIds={selectedCategoryIds}
            setSelectedCategoryIds={setSelectedCategoryIds}
            sortOption={sortOption}
            setSortOption={setSortOption}
            categories={categories}
            debouncedSearchQuery={debouncedSearchQuery}
          />

          <div>
            {categories.length > 0 && !debouncedSearchQuery ? (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">Categorias</h2>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <Button key={category.id} variant="outline" size="sm" className="text-xs sm:text-sm">
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-center">Produtos</h2>
              <StorefrontProductGrid
                products={displayedProducts}
                isLoading={isLoadingProducts}
                gridClasses={productGridClasses}
                onAddToCart={handleAddToCart}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé discreto e minimalista — apenas na vitrine pública */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-3 sm:px-4 py-6 text-center text-muted-foreground">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm">Powered by Goti Soluções</p>
            <p className="text-xs sm:text-sm">© 2026 — Todos os direitos reservados</p>
            <p className="text-xs sm:text-sm">
              Quer seu catálogo para WhatsApp? Entre em contato: 62984-810290
            </p>
            <div className="pt-2">
              <a
                href="https://www.gotisolucoes.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Criar meu catálogo agora"
              >
                Criar meu catálogo agora →
              </a>
            </div>
          </div>
        </div>
      </footer>

      {(storeSettings as any)?.contact?.whatsapp_number &&
        (storeSettings as any)?.storefront?.show_whatsapp_button !== false && (
          <FloatingWhatsAppButton
            whatsappNumber={(storeSettings as any).contact.whatsapp_number}
            tenantName={tenant?.company_name}
            iconUrl={floatingIconUrl}
          />
        )}

      {/* Social Proof Widget */}
      <SocialProofWidget tenantId={tenant?.id || ""} enabled={true} />
    </div>
  );
};

export default Storefront;