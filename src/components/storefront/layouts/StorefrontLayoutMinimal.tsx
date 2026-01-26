
import { StorefrontLayoutProps } from "@/types/storefront";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { StorefrontBanner } from "@/components/storefront/StorefrontBanner";
import { StorefrontProductGrid } from "@/components/storefront/StorefrontProductGrid";
import { SocialProofWidget } from "@/components/storefront/SocialProofWidget";
import { FloatingWhatsAppButton } from "@/components/storefront/FloatingWhatsAppButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const StorefrontLayoutMinimal = ({
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

    // Links e ícones
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

    const logoUrl = (storeSettings as any)?.branding?.logo_url;
    const floatingIconUrl = (storeSettings as any)?.floating_button_icon_url as string | undefined;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center">
            {/* Header Minimalista Centralizado */}
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

            <main className="w-full max-w-5xl px-4 sm:px-6 py-8">
                {/* Banner sem margens laterais no mobile */}
                <div className="rounded-2xl overflow-hidden shadow-sm mb-10">
                    <StorefrontBanner banners={banners} />
                </div>

                {/* Barra de Busca Minimalista e Centralizada */}
                <div className="flex flex-col items-center mb-10 gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-10 rounded-full bg-secondary/50 border-none h-12 text-center focus:text-left transition-all"
                            placeholder="Buscar produtos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Categorias como Tags (Pills) */}
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => setSelectedCategoryIds([])}
                            className={`h-8 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${selectedCategoryIds.length === 0
                                ? 'bg-foreground text-background'
                                : 'bg-transparent border border-border hover:border-foreground'
                                }`}
                        >
                            Tudo
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    if (selectedCategoryIds.includes(cat.id)) {
                                        setSelectedCategoryIds(prev => prev.filter(id => id !== cat.id));
                                    } else {
                                        setSelectedCategoryIds(prev => [cat.id]);
                                    }
                                }}
                                className={`h-8 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${selectedCategoryIds.includes(cat.id)
                                    ? 'bg-foreground text-background'
                                    : 'bg-transparent border border-border hover:border-foreground'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Limpo (Sem Sidebar) */}
                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                            {products.length} itens
                        </span>
                        {/* Sort simples */}
                        <select
                            className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer hover:text-primary"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="">Mais Recentes</option>
                            <option value="price_asc">Preço Menor</option>
                            <option value="price_desc">Preço Maior</option>
                        </select>
                    </div>

                    <StorefrontProductGrid
                        products={products}
                        isLoading={isLoadingProducts}
                        // Grid de 3 colunas max para dar destaque
                        gridClasses="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
                        onAddToCart={handleAddToCart}
                    />
                </div>
            </main>

            <StorefrontFooter tenant={tenant} />
            <FloatingWhatsAppButton whatsappNumber={(storeSettings as any)?.contact?.whatsapp_number} tenantName={tenant?.company_name} iconUrl={floatingIconUrl} />
            <SocialProofWidget tenantId={tenant?.id || ""} enabled={true} />
            <StickyCartBar slug={tenant?.slug!} />
        </div>
    );
};

// Footer simplificado
const StorefrontFooter = ({ tenant }: { tenant: any }) => (
    <footer className="w-full border-t border-border mt-auto py-12 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
            <h3 className="font-bold text-xl mb-2">{tenant?.company_name}</h3>
            <p className="text-sm text-muted-foreground mb-8">Obrigado pela preferência.</p>
            <div className="text-xs text-muted-foreground opacity-50">
                Powered by Goti Soluções
            </div>
        </div>
    </footer>
);

const StickyCartBar = ({ slug }: { slug: string }) => {
    const { items, getTotalPrice } = useCart();
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = getTotalPrice();
    if (totalItems === 0) return null;
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <Link to={`/loja/${slug}/carrinho`}>
                <Button className="rounded-full shadow-2xl px-6 h-12 bg-foreground text-background font-bold text-base hover:scale-105 transition-transform">
                    Ver Carrinho ({totalItems}) • R$ {totalPrice.toFixed(2)}
                </Button>
            </Link>
        </div>
    );
};
