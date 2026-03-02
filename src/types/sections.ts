// ============================================================
// Page Builder — Section Types
// ============================================================

/** All available section types */
export type SectionType =
    | 'header'
    | 'hero_banner'
    | 'product_stories'
    | 'product_reels'
    | 'categories_scroll'
    | 'product_grid'
    | 'featured_products'
    | 'cta'
    | 'image_text'
    | 'brands_carousel'
    | 'testimonials'
    | 'stats_counter'
    | 'video_embed'
    | 'faq'
    | 'newsletter'
    | 'contact_map'
    | 'spacer'
    | 'footer'
    | 'bottom_nav';

/** A single section in the page layout */
export interface PageSection {
    id: string;
    type: SectionType;
    /** If true, section cannot be removed or hidden (header, product_grid, footer) */
    locked?: boolean;
    /** Whether the section is visible */
    visible: boolean;
    /** Section-specific configuration */
    config: SectionConfig;
}

/** Union of all section configs */
export type SectionConfig =
    | HeaderSectionConfig
    | HeroBannerConfig
    | ProductGridConfig
    | FeaturedProductsConfig
    | CTAConfig
    | ImageTextConfig
    | BrandsCarouselConfig
    | TestimonialsConfig
    | StatsCounterConfig
    | VideoEmbedConfig
    | FAQConfig
    | NewsletterConfig
    | ContactMapConfig
    | SpacerConfig
    | Record<string, any>; // fallback

// ---- Individual Section Configs ----

export interface HeaderSectionConfig {
    style?: 'solid' | 'transparent' | 'gradient';
    showSocials?: boolean;
    showSearch?: boolean;
}

export interface HeroBannerConfig {
    height?: 'small' | 'medium' | 'large' | 'full';
    overlayOpacity?: number;
    showCTA?: boolean;
    ctaText?: string;
    ctaLink?: string;
}

export interface ProductGridConfig {
    columns?: number;
    cardRadius?: string;
    cardShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hoverScale?: boolean;
    hoverGlow?: boolean;
    gap?: 'compact' | 'normal' | 'spacious';
}

export interface FeaturedProductsConfig {
    title?: string;
    maxItems?: number;
    layout?: 'grid' | 'carousel';
}

export interface CTAConfig {
    title: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    imageUrl?: string;
    layout?: 'image-left' | 'image-right' | 'centered' | 'full-bg';
    bgColor?: string;
    textColor?: string;
}

export interface ImageTextConfig {
    title: string;
    text: string;
    imageUrl?: string;
    layout?: 'image-left' | 'image-right';
    bgColor?: string;
}

export interface BrandsCarouselConfig {
    title?: string;
    logos: Array<{ url: string; name?: string }>;
    speed?: 'slow' | 'normal' | 'fast';
    logoSize?: 'small' | 'medium' | 'large';
}

export interface TestimonialsConfig {
    title?: string;
    items: Array<{
        name: string;
        text: string;
        rating?: number;
        avatarUrl?: string;
        role?: string;
    }>;
    layout?: 'cards' | 'carousel';
}

export interface StatsCounterConfig {
    items: Array<{
        value: string;
        label: string;
        prefix?: string;
        suffix?: string;
    }>;
    bgColor?: string;
}

export interface VideoEmbedConfig {
    title?: string;
    videoUrl: string;
    provider?: 'youtube' | 'vimeo' | 'custom';
    autoplay?: boolean;
}

export interface FAQConfig {
    title?: string;
    items: Array<{
        question: string;
        answer: string;
    }>;
}

export interface NewsletterConfig {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    bgColor?: string;
}

export interface ContactMapConfig {
    title?: string;
    phones?: string[];
    whatsapp?: string;
    email?: string;
    address?: string;
    mapsEmbedUrl?: string;
    showMap?: boolean;
}

export interface SpacerConfig {
    height?: 'small' | 'medium' | 'large';
    showDivider?: boolean;
}

/** Full page layout stored in store_settings.page_sections */
export interface PageLayout {
    sections: PageSection[];
}

// ---- Section Catalog (for the builder UI) ----

export interface SectionCatalogItem {
    type: SectionType;
    label: string;
    description: string;
    icon: string; // lucide icon name
    locked?: boolean;
    defaultConfig: SectionConfig;
}

/** Generates a unique section ID */
export const generateSectionId = (): string => {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

/** Default page layout when none is configured */
export const DEFAULT_PAGE_LAYOUT: PageLayout = {
    sections: [
        { id: 'header', type: 'header', locked: true, visible: true, config: { style: 'solid', showSocials: true } },
        { id: 'hero_banner', type: 'hero_banner', visible: true, config: {} },
        { id: 'product_stories', type: 'product_stories', visible: true, config: {} },
        { id: 'product_reels', type: 'product_reels', visible: true, config: {} },
        { id: 'categories_scroll', type: 'categories_scroll', visible: true, config: {} },
        { id: 'product_grid', type: 'product_grid', locked: true, visible: true, config: { columns: 4, gap: 'normal' } },
        { id: 'footer', type: 'footer', locked: true, visible: true, config: {} },
        { id: 'bottom_nav', type: 'bottom_nav', locked: true, visible: true, config: {} },
    ],
};

/** Section catalog for the builder "Add Section" panel */
export const SECTION_CATALOG: SectionCatalogItem[] = [
    {
        type: 'cta',
        label: 'Call to Action',
        description: 'Bloco com imagem, texto e botão de ação',
        icon: 'MousePointerClick',
        defaultConfig: { title: 'Título do CTA', subtitle: 'Subtítulo', buttonText: 'Saiba Mais', layout: 'image-right' } as CTAConfig,
    },
    {
        type: 'brands_carousel',
        label: 'Carrossel de Marcas',
        description: 'Logos de marcas parceiras em carrossel',
        icon: 'Award',
        defaultConfig: { title: 'Nossas Marcas', logos: [], speed: 'normal' } as BrandsCarouselConfig,
    },
    {
        type: 'testimonials',
        label: 'Depoimentos',
        description: 'Avaliações e depoimentos de clientes',
        icon: 'MessageSquareQuote',
        defaultConfig: { title: 'O que nossos clientes dizem', items: [], layout: 'cards' } as TestimonialsConfig,
    },
    {
        type: 'newsletter',
        label: 'Newsletter',
        description: 'Captura de e-mail para promoções',
        icon: 'Mail',
        defaultConfig: { title: 'Cadastre-se em nossa newsletter', buttonText: 'Cadastrar' } as NewsletterConfig,
    },
    {
        type: 'image_text',
        label: 'Imagem + Texto',
        description: 'Bloco editorial com imagem e texto lado a lado',
        icon: 'LayoutPanelLeft',
        defaultConfig: { title: 'Sobre nós', text: 'Escreva sobre seu negócio...', layout: 'image-left' } as ImageTextConfig,
    },
    {
        type: 'featured_products',
        label: 'Produtos em Destaque',
        description: 'Grid de produtos marcados como destaque',
        icon: 'Star',
        defaultConfig: { title: 'Destaques', maxItems: 8, layout: 'grid' } as FeaturedProductsConfig,
    },
    {
        type: 'video_embed',
        label: 'Vídeo',
        description: 'Incorporar vídeo do YouTube ou Vimeo',
        icon: 'Play',
        defaultConfig: { title: '', videoUrl: '', provider: 'youtube' } as VideoEmbedConfig,
    },
    {
        type: 'faq',
        label: 'Perguntas Frequentes',
        description: 'FAQ em formato accordion',
        icon: 'HelpCircle',
        defaultConfig: { title: 'Perguntas Frequentes', items: [] } as FAQConfig,
    },
    {
        type: 'stats_counter',
        label: 'Contador de Estatísticas',
        description: 'Números animados (ex: +500 clientes)',
        icon: 'TrendingUp',
        defaultConfig: { items: [{ value: '500', label: 'Clientes', prefix: '+' }] } as StatsCounterConfig,
    },
    {
        type: 'contact_map',
        label: 'Contato / Mapa',
        description: 'Informações de contato e Google Maps',
        icon: 'MapPin',
        defaultConfig: { title: 'Fale Conosco', showMap: true } as ContactMapConfig,
    },
    {
        type: 'spacer',
        label: 'Espaçador',
        description: 'Espaço ou divisor entre seções',
        icon: 'SeparatorHorizontal',
        defaultConfig: { height: 'medium', showDivider: false } as SpacerConfig,
    },
    {
        type: 'hero_banner',
        label: 'Banner Hero',
        description: 'Carrossel de banners com overlay',
        icon: 'Image',
        defaultConfig: { height: 'medium' } as HeroBannerConfig,
    },
    {
        type: 'categories_scroll',
        label: 'Categorias',
        description: 'Scroll horizontal de categorias',
        icon: 'Tags',
        defaultConfig: {},
    },
    {
        type: 'product_stories',
        label: 'Product Stories',
        description: 'Stories de produtos estilo Instagram',
        icon: 'CircleDot',
        defaultConfig: {},
    },
    {
        type: 'product_reels',
        label: 'Product Reels',
        description: 'Vídeos curtos de produtos estilo Reels',
        icon: 'Film',
        defaultConfig: {},
    },
];
