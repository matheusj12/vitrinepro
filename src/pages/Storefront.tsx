import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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

  // Links do cliente (com trim para evitar espaços vazios ativando ícones)
  const contact = (storeSettings?.contact as any) || {};
  const instagramUrl = contact.instagram_url?.trim() || undefined;
  const facebookUrl = contact.facebook_url?.trim() || undefined;
  const tiktokUrl = contact.tiktok_url?.trim() || undefined;
  const youtubeUrl = contact.youtube_url?.trim() || undefined;
  const whatsappBusinessUrl = contact.whatsapp_business_url?.trim() || undefined;
  const pinterestUrl = contact.pinterest_url?.trim() || undefined;
  const twitterUrl = contact.twitter_url?.trim() || undefined;
  const linkedinUrl = contact.linkedin_url?.trim() || undefined;

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

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <StorefrontBanner banners={banners} />

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-8 lg:gap-12 mt-12 transition-all">
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

          <div className="min-w-0">
            {categories.length > 0 && !debouncedSearchQuery && (
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-bold">Navegar por Categorias</h2>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setSelectedCategoryIds([])}
                    className={`h-10 px-6 rounded-full text-sm font-medium transition-all duration-300 border ${selectedCategoryIds.length === 0
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                      : 'bg-background hover:bg-secondary border-border hover:border-primary/30'
                      }`}
                  >
                    Todas
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        if (selectedCategoryIds.includes(category.id)) {
                          setSelectedCategoryIds(prev => prev.filter(id => id !== category.id));
                        } else {
                          setSelectedCategoryIds(prev => [...prev, category.id]);
                        }
                      }}
                      className={`h-10 px-6 rounded-full text-sm font-medium transition-all duration-300 border ${selectedCategoryIds.includes(category.id)
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                        : 'bg-background hover:bg-secondary border-border hover:border-primary/30'
                        }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">
                    {debouncedSearchQuery ? `Resultados para "${debouncedSearchQuery}"` : "Produtos em Destaque"}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {displayedProducts.length} produtos encontrados
                  </p>
                </div>
              </div>

              <StorefrontProductGrid
                products={displayedProducts}
                isLoading={isLoadingProducts}
                gridClasses="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
                onAddToCart={handleAddToCart}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé discreto e minimalista — apenas na vitrine pública */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-600/20 flex items-center justify-center">
              <span className="font-bold text-primary text-xl">
                {tenant?.company_name?.charAt(0) || 'L'}
              </span>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <p className="text-sm">
                {tenant?.company_name} - Todos os direitos reservados.
              </p>

              <div className="flex items-center justify-center gap-6 pt-2">
                {/* Links sociais poderiam vir aqui */}
              </div>
            </div>

            <div className="pt-8 border-t w-full max-w-xs mx-auto">
              <p className="text-xs text-muted-foreground mb-3">Powered by</p>
              <a
                href="https://www.gotisolucoes.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background hover:bg-accent transition-colors text-xs font-medium"
              >
                Goti Soluções 🚀
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

      {/* Sticky Cart Bar (Mobile/Desktop) */}
      <StickyCartBar slug={slug} />
    </div >
  );
};

const StickyCartBar = ({ slug }: { slug: string }) => {
  const { items, getTotalPrice } = useCart();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = getTotalPrice();

  // Só mostra se tiver itens
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-40 md:hidden">
      <div className="bg-foreground text-background rounded-2xl shadow-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-background/80">{totalItems} iten{totalItems !== 1 && 's'}</span>
          <span className="font-bold text-lg">R$ {totalPrice.toFixed(2)}</span>
        </div>
        <Link to={`/loja/${slug}/carrinho`}>
          <Button size="sm" className="bg-background text-foreground hover:bg-background/90 font-bold px-6 rounded-xl">
            Ver Carrinho
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Storefront;