
import { StorefrontLayoutProps } from "@/types/storefront";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { StorefrontBanner } from "@/components/storefront/StorefrontBanner";
import { StorefrontFilters } from "@/components/storefront/StorefrontFilters";
import { StorefrontProductGrid } from "@/components/storefront/StorefrontProductGrid";
import { SocialProofWidget } from "@/components/storefront/SocialProofWidget";
import { FloatingWhatsAppButton } from "@/components/storefront/FloatingWhatsAppButton";
import { StorefrontBottomNav } from "@/components/storefront/StorefrontBottomNav";
import { StorefrontCategoryScroll } from "@/components/storefront/StorefrontCategoryScroll";
import { ProductStories } from "@/components/storefront/ProductStories";
import { SocialProofToast } from "@/components/storefront/SocialProofToast";
import { ProductReels } from "@/components/storefront/ProductReels";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

export const StorefrontLayoutDefault = ({
    tenant,
    storeSettings,
    categories,
    banners,
    products,
    isLoadingProducts,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    selectedCategoryIds,
    setSelectedCategoryIds,
    sortOption,
    setSortOption,
    handleAddToCart,
    globalIcons
}: StorefrontLayoutProps) => {

    const { items } = useCart();
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    // Infinite scroll for products (Instagram-style)
    const {
        visibleProducts,
        hasMore,
        isLoading: isLoadingMore,
        sentinelRef,
    } = useInfiniteScroll({
        products,
        initialLimit: 12,
        incrementBy: 8,
    });

    // Product names for social proof notifications
    const productNames = products.map((p) => p.name);

    // Links do cliente
    const contact = (storeSettings?.contact as any) || {};
    const instagramUrl = contact.instagram_url?.trim() || undefined;
    const facebookUrl = contact.facebook_url?.trim() || undefined;
    const tiktokUrl = contact.tiktok_url?.trim() || undefined;
    const youtubeUrl = contact.youtube_url?.trim() || undefined;
    const whatsappBusinessUrl = contact.whatsapp_business_url?.trim() || undefined;
    const pinterestUrl = contact.pinterest_url?.trim() || undefined;
    const twitterUrl = contact.twitter_url?.trim() || undefined;
    const linkedinUrl = contact.linkedin_url?.trim() || undefined;

    // Ícones globais
    const instagramIcon = (globalIcons as any)?.instagram;
    const facebookIcon = (globalIcons as any)?.facebook;
    const tiktokIcon = (globalIcons as any)?.tiktok;
    const youtubeIcon = (globalIcons as any)?.youtube;
    const whatsappIcon = (globalIcons as any)?.whatsapp;
    const pinterestIcon = (globalIcons as any)?.pinterest;
    const twitterIcon = (globalIcons as any)?.twitter;
    const linkedinIcon = (globalIcons as any)?.linkedin;

    const floatingIconUrl = (storeSettings as any)?.floating_button_icon_url as string | undefined;
    const logoUrl = (storeSettings as any)?.branding?.logo_url;

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <PublicHeader
                storeName={tenant?.company_name || "Loja"}
                logoUrl={logoUrl}
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
                slug={tenant?.slug!}
            />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-12">
                <StorefrontBanner banners={banners} />

                {/* Instagram-style Product Stories (Featured products) */}
                {products.filter(p => p.featured).length > 0 && (
                    <div className="mt-6 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <ProductStories
                            products={products}
                            onAddToCart={handleAddToCart}
                        />
                    </div>
                )}

                {/* Product Reels (Products with videos) */}
                {products.filter(p => p.video_url).length > 0 && (
                    <div className="mt-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 mb-3 px-4">
                            <span className="text-lg">🎬</span>
                            <h3 className="text-lg font-bold text-foreground">Reels</h3>
                        </div>
                        <ProductReels
                            products={products}
                            onAddToCart={handleAddToCart}
                        />
                    </div>
                )}

                {/* Mobile Category Scroll (Visible only on mobile) */}
                <div className="md:hidden mt-6 mb-8">
                    <StorefrontCategoryScroll
                        categories={categories}
                        selectedCategoryIds={selectedCategoryIds}
                        onSelectCategory={(id) => {
                            if (id === 'all') setSelectedCategoryIds([]);
                            else setSelectedCategoryIds([id]);
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-8 lg:gap-12 mt-4 sm:mt-12 transition-all">
                    <div className="hidden md:block">
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
                    </div>

                    <div className="min-w-0">
                        {/* Desktop Category Pills (Hidden on mobile to avoid duplication with Scroll) */}
                        <div className="hidden md:block">
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
                        </div>

                        <div>
                            <div className="flex items-end justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-heading font-bold text-foreground">
                                        {debouncedSearchQuery ? `Resultados para "${debouncedSearchQuery}"` : "Produtos em Destaque"}
                                    </h2>
                                    <p className="text-muted-foreground mt-1">
                                        {products.length} produtos encontrados
                                    </p>
                                </div>
                                {/* Mobile Sort Option could go here */}
                            </div>

                            <StorefrontProductGrid
                                products={visibleProducts}
                                isLoading={isLoadingProducts}
                                gridClasses="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8"
                                onAddToCart={handleAddToCart}
                            />

                            {/* Infinite scroll sentinel */}
                            {hasMore && (
                                <div
                                    ref={sentinelRef}
                                    className="flex justify-center py-8"
                                >
                                    {isLoadingMore && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm">Carregando mais...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Padrão */}
            <StorefrontFooter tenant={tenant} storeSettings={storeSettings} />

            {(storeSettings as any)?.contact?.whatsapp_number &&
                (storeSettings as any)?.storefront?.show_whatsapp_button !== false && (
                    <FloatingWhatsAppButton
                        whatsappNumber={(storeSettings as any).contact.whatsapp_number}
                        tenantName={tenant?.company_name}
                        iconUrl={floatingIconUrl}
                    />
                )}

            {/* Advanced Social Proof Toast Notifications */}
            <SocialProofToast
                productNames={productNames}
                viewersCount={Math.floor(Math.random() * 15) + 5}
                enabled={true}
            />

            <StorefrontBottomNav slug={tenant?.slug!} cartCount={totalItems} />
        </div>
    );
};

// Componentes auxiliares (Footer e StickyBar) copiados para simplificar importação
const StorefrontFooter = ({ tenant, storeSettings }: { tenant: any, storeSettings: any }) => (
    <footer className="border-t border-border mt-20 mb-16 md:mb-0">
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
);
