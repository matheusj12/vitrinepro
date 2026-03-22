/**
 * SectionRenderer — Dynamic section rendering engine
 * 
 * Reads the page_sections layout config and renders the appropriate
 * storefront components in the configured order.
 */

import React, { useState, useEffect, useMemo } from "react";
import { PageSection, PageLayout, DEFAULT_PAGE_LAYOUT } from "@/types/sections";
import { Product, Category, Banner } from "@/types/database";

// Section components
import { CTASection } from "@/components/storefront/sections/CTASection";
import { BrandsCarousel } from "@/components/storefront/sections/BrandsCarousel";
import { TestimonialsSection } from "@/components/storefront/sections/TestimonialsSection";
import { NewsletterSection } from "@/components/storefront/sections/NewsletterSection";
import { ImageTextSection } from "@/components/storefront/sections/ImageTextSection";
import { FAQSection } from "@/components/storefront/sections/FAQSection";
import { StatsCounterSection } from "@/components/storefront/sections/StatsCounterSection";
import { VideoEmbedSection } from "@/components/storefront/sections/VideoEmbedSection";
import { ContactMapSection } from "@/components/storefront/sections/ContactMapSection";
import { SpacerSection } from "@/components/storefront/sections/SpacerSection";
import { FeaturedProductsSection } from "@/components/storefront/sections/FeaturedProductsSection";

// Existing storefront components
import { StorefrontBanner } from "@/components/storefront/StorefrontBanner";
import { StorefrontProductGrid } from "@/components/storefront/StorefrontProductGrid";
import { StorefrontCategoryScroll } from "@/components/storefront/StorefrontCategoryScroll";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { StorefrontFilters } from "@/components/storefront/StorefrontFilters";
import { StorefrontBottomNav } from "@/components/storefront/StorefrontBottomNav";
import { ProductStories } from "@/components/storefront/ProductStories";
import { ProductReels } from "@/components/storefront/ProductReels";
import { SocialProofToast } from "@/components/storefront/SocialProofToast";
import { FloatingWhatsAppButton } from "@/components/storefront/FloatingWhatsAppButton";
import { useCart } from "@/hooks/useCart";

export interface SectionRendererProps {
    pageLayout: PageLayout;
    // Storefront data
    tenant: any;
    storeSettings: any;
    categories: Category[];
    banners: Banner[];
    products: Product[];
    isLoadingProducts: boolean;
    // Interaction handlers
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    debouncedSearchQuery: string;
    selectedCategoryIds: string[];
    setSelectedCategoryIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    sortOption: string;
    setSortOption: (o: string) => void;
    handleAddToCart: (product: Product) => void;
    globalIcons?: any;
}

export const SectionRenderer = ({
    pageLayout,
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
    globalIcons,
}: SectionRendererProps) => {
    const { items } = useCart();
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    const ITEMS_PER_PAGE = 15;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const paginatedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset para página 1 quando filtros/busca mudam
    useEffect(() => { setCurrentPage(1); }, [products.length, selectedCategoryIds, debouncedSearchQuery]);

    // Contact and icon data
    const contact = (storeSettings?.contact as any) || {};
    const logoUrl = (storeSettings as any)?.branding?.logo_url;
    const aboutText = (storeSettings as any)?.branding?.about_text as string | undefined;
    const floatingIconUrl = (storeSettings as any)?.floating_button_icon_url as string | undefined;
    const productNames = useMemo(() => products.map((p) => p.name), [products]);

    const sections = pageLayout?.sections || DEFAULT_PAGE_LAYOUT.sections;

    const renderSection = (section: PageSection) => {
        if (!section.visible) return null;

        switch (section.type) {
            case "header":
                return (
                    <PublicHeader
                        key={section.id}
                        storeName={tenant?.company_name || "Loja"}
                        logoUrl={logoUrl}
                        whatsappNumber={contact.whatsapp_number}
                        instagramUrl={contact.instagram_url?.trim() || undefined}
                        facebookUrl={contact.facebook_url?.trim() || undefined}
                        tiktokUrl={contact.tiktok_url?.trim() || undefined}
                        youtubeUrl={contact.youtube_url?.trim() || undefined}
                        whatsappBusinessUrl={contact.whatsapp_business_url?.trim() || undefined}
                        pinterestUrl={contact.pinterest_url?.trim() || undefined}
                        twitterUrl={contact.twitter_url?.trim() || undefined}
                        linkedinUrl={contact.linkedin_url?.trim() || undefined}
                        instagramIcon={(globalIcons as any)?.instagram}
                        facebookIcon={(globalIcons as any)?.facebook}
                        tiktokIcon={(globalIcons as any)?.tiktok}
                        youtubeIcon={(globalIcons as any)?.youtube}
                        whatsappIcon={(globalIcons as any)?.whatsapp}
                        pinterestIcon={(globalIcons as any)?.pinterest}
                        twitterIcon={(globalIcons as any)?.twitter}
                        linkedinIcon={(globalIcons as any)?.linkedin}
                        categories={categories || []}
                        slug={tenant?.slug!}
                    />
                );

            case "hero_banner":
                return (
                    <div key={section.id} className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                        <StorefrontBanner banners={banners} />
                    </div>
                );

            case "product_stories":
                const featuredForStories = products.filter((p) => p.featured);
                if (featuredForStories.length === 0) return null;
                return (
                    <div key={section.id} className="container mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <ProductStories products={products} onAddToCart={handleAddToCart} />
                    </div>
                );

            case "product_reels":
                const reelProducts = products.filter((p) => p.video_url);
                if (reelProducts.length === 0) return null;
                return (
                    <div key={section.id} className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 mb-3 px-4">
                            <span className="text-lg">🎬</span>
                            <h3 className="text-lg font-bold text-foreground">Reels</h3>
                        </div>
                        <ProductReels products={products} onAddToCart={handleAddToCart} />
                    </div>
                );

            case "categories_scroll":
                return (
                    <div key={section.id} className="container mx-auto px-4 sm:px-6 lg:px-8">
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
                    </div>
                );

            case "product_grid":
                return (
                    <div key={section.id} className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-12">
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
                                {/* Desktop Category Pills */}
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
                                                                setSelectedCategoryIds((prev: string[]) => prev.filter((id: string) => id !== category.id));
                                                            } else {
                                                                setSelectedCategoryIds((prev: string[]) => [...prev, category.id]);
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
                                            <p className="text-muted-foreground mt-1">{products.length} produtos encontrados</p>
                                        </div>
                                    </div>
                                    <StorefrontProductGrid
                                        products={paginatedProducts}
                                        isLoading={isLoadingProducts}
                                        gridClasses="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8"
                                        onAddToCart={handleAddToCart}
                                    />
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                                            <button
                                                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 rounded-full border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary"
                                            >
                                                ← Anterior
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                    className={`w-10 h-10 rounded-full border text-sm font-medium transition-all ${page === currentPage ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25' : 'hover:bg-secondary border-border'}`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 rounded-full border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary"
                                            >
                                                Próxima →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "footer":
                return (
                    <footer key={section.id} className="border-t border-border mt-20 mb-16 md:mb-0">
                        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-6">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-600/20 flex items-center justify-center">
                                    <span className="font-bold text-primary text-xl">
                                        {tenant?.company_name?.charAt(0) || 'L'}
                                    </span>
                                </div>

                                {/* Sobre a Loja */}
                                {aboutText && aboutText.trim() && (
                                    <div className="max-w-2xl mx-auto space-y-3">
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">Sobre a Loja</h3>
                                        <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                            {aboutText}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4 max-w-md mx-auto">
                                    <p className="text-sm">{tenant?.company_name} - Todos os direitos reservados.</p>
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

            case "bottom_nav":
                return <StorefrontBottomNav key={section.id} slug={tenant?.slug!} cartCount={totalItems} />;

            // ---- Optional sections ----
            case "cta":
                return <CTASection key={section.id} config={section.config as any} />;

            case "brands_carousel":
                return <BrandsCarousel key={section.id} config={section.config as any} />;

            case "testimonials":
                return <TestimonialsSection key={section.id} config={section.config as any} />;

            case "newsletter":
                return <NewsletterSection key={section.id} config={section.config as any} />;

            case "image_text":
                return <ImageTextSection key={section.id} config={section.config as any} />;

            case "faq":
                return <FAQSection key={section.id} config={section.config as any} />;

            case "stats_counter":
                return <StatsCounterSection key={section.id} config={section.config as any} />;

            case "video_embed":
                return <VideoEmbedSection key={section.id} config={section.config as any} />;

            case "contact_map":
                return <ContactMapSection key={section.id} config={section.config as any} />;

            case "spacer":
                return <SpacerSection key={section.id} config={section.config as any} />;

            case "featured_products":
                return (
                    <FeaturedProductsSection
                        key={section.id}
                        config={section.config as any}
                        products={products}
                        onAddToCart={handleAddToCart}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0 overflow-x-hidden">
            {sections.map(renderSection)}

            {/* Non-section overlays (always present) */}
            {contact.whatsapp_number &&
                (storeSettings as any)?.storefront?.show_whatsapp_button !== false && (
                    <FloatingWhatsAppButton
                        whatsappNumber={contact.whatsapp_number}
                        tenantName={tenant?.company_name}
                        iconUrl={floatingIconUrl}
                    />
                )}

            <SocialProofToast
                productNames={productNames}
                viewersCount={Math.floor(Math.random() * 15) + 5}
                enabled={true}
            />
        </div>
    );
};
