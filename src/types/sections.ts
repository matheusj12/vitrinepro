// ============================================================
// Page Builder — Section Types
// ============================================================
// Skill aplicada: typescript-advanced-types
// Padrões: Discriminated Unions, Type Guards, Mapped Types, Utility Types
// ============================================================

// ---- Tipos literais de seção ----

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

/** Seções que não têm configuração própria (config vazio) */
export type EmptySectionType =
    | 'product_stories'
    | 'product_reels'
    | 'categories_scroll'
    | 'footer'
    | 'bottom_nav';

/** Seções que não podem ser removidas ou ocultadas */
export type LockedSectionType = 'header' | 'product_grid' | 'footer' | 'bottom_nav';

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

export interface BrandLogo {
    url: string;
    name?: string;
}

export interface BrandsCarouselConfig {
    title?: string;
    logos: BrandLogo[];
    speed?: 'slow' | 'normal' | 'fast';
    logoSize?: 'small' | 'medium' | 'large';
}

export interface TestimonialItem {
    name: string;
    text: string;
    rating?: number;
    avatarUrl?: string;
    role?: string;
}

export interface TestimonialsConfig {
    title?: string;
    items: TestimonialItem[];
    layout?: 'cards' | 'carousel';
}

export interface StatsItem {
    value: string;
    label: string;
    prefix?: string;
    suffix?: string;
}

export interface StatsCounterConfig {
    items: StatsItem[];
    bgColor?: string;
}

export interface VideoEmbedConfig {
    title?: string;
    videoUrl: string;
    provider?: 'youtube' | 'vimeo' | 'custom';
    autoplay?: boolean;
}

export interface FAQItem {
    question: string;
    answer: string;
}

export interface FAQConfig {
    title?: string;
    items: FAQItem[];
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

/** Configuração vazia para seções sem opções */
export type EmptySectionConfig = Record<string, never>;

// ---- Discriminated Union: SectionType → Config ----
// Mapeia cada SectionType ao seu config específico — sem `Record<string, any>`

export type SectionConfigMap = {
    header: HeaderSectionConfig;
    hero_banner: HeroBannerConfig;
    product_stories: EmptySectionConfig;
    product_reels: EmptySectionConfig;
    categories_scroll: EmptySectionConfig;
    product_grid: ProductGridConfig;
    featured_products: FeaturedProductsConfig;
    cta: CTAConfig;
    image_text: ImageTextConfig;
    brands_carousel: BrandsCarouselConfig;
    testimonials: TestimonialsConfig;
    stats_counter: StatsCounterConfig;
    video_embed: VideoEmbedConfig;
    faq: FAQConfig;
    newsletter: NewsletterConfig;
    contact_map: ContactMapConfig;
    spacer: SpacerConfig;
    footer: EmptySectionConfig;
    bottom_nav: EmptySectionConfig;
};

/** Config de uma seção específica — totalmente tipado */
export type SectionConfig<T extends SectionType = SectionType> = SectionConfigMap[T];

// ---- Discriminated Union: PageSection ----

/**
 * Typed page section: a union onde cada membro tem `type` literal
 * e `config` inferido automaticamente para aquele tipo.
 */
export type PageSection = {
    [T in SectionType]: {
        id: string;
        type: T;
        /** Se true, seção não pode ser removida ou ocultada */
        locked?: T extends LockedSectionType ? true : boolean;
        visible: boolean;
        config: SectionConfigMap[T];
    };
}[SectionType];

/** Full page layout stored in store_settings.page_sections */
export interface PageLayout {
    sections: PageSection[];
}

// ---- Type Guards ----

/** Verifica se uma seção é do tipo especificado (com narrowing automático) */
export function isSectionType<T extends SectionType>(
    section: PageSection,
    type: T,
): section is Extract<PageSection, { type: T }> {
    return section.type === type;
}

/** Verifica se uma seção está bloqueada */
export function isLockedSection(
    section: PageSection,
): section is Extract<PageSection, { type: LockedSectionType }> {
    const locked: readonly SectionType[] = ['header', 'product_grid', 'footer', 'bottom_nav'];
    return locked.includes(section.type);
}

/** Extrai o config tipado de uma seção */
export function getSectionConfig<T extends SectionType>(
    section: Extract<PageSection, { type: T }>,
): SectionConfigMap[T] {
    return section.config as SectionConfigMap[T];
}

// ---- Utility Types ----

/** Seção com update parcial do config (para formulários de edição) */
export type PageSectionUpdate<T extends SectionType = SectionType> = {
    type: T;
    visible?: boolean;
    config?: Partial<SectionConfigMap[T]>;
};

/** Seção sem `id` (para criar novas seções) */
export type NewPageSection<T extends SectionType = SectionType> = Omit<
    Extract<PageSection, { type: T }>,
    'id'
>;

// ---- Section Catalog ----

export interface SectionCatalogItem<T extends SectionType = SectionType> {
    type: T;
    label: string;
    description: string;
    /** Nome do ícone Lucide */
    icon: string;
    locked?: boolean;
    defaultConfig: SectionConfigMap[T];
}

// ---- Helpers ----

/** Gera um ID único para uma seção */
export const generateSectionId = (): string =>
    Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

/** Default page layout quando nenhum está configurado */
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

/** Catálogo de seções disponíveis para o Page Builder */
export const SECTION_CATALOG: SectionCatalogItem[] = [
    {
        type: 'cta',
        label: 'Call to Action',
        description: 'Bloco com imagem, texto e botão de ação',
        icon: 'MousePointerClick',
        defaultConfig: { title: 'Título do CTA', subtitle: 'Subtítulo', buttonText: 'Saiba Mais', layout: 'image-right' },
    },
    {
        type: 'brands_carousel',
        label: 'Carrossel de Marcas',
        description: 'Logos de marcas parceiras em carrossel',
        icon: 'Award',
        defaultConfig: { title: 'Nossas Marcas', logos: [], speed: 'normal' },
    },
    {
        type: 'testimonials',
        label: 'Depoimentos',
        description: 'Avaliações e depoimentos de clientes',
        icon: 'MessageSquareQuote',
        defaultConfig: { title: 'O que nossos clientes dizem', items: [], layout: 'cards' },
    },
    {
        type: 'newsletter',
        label: 'Newsletter',
        description: 'Captura de e-mail para promoções',
        icon: 'Mail',
        defaultConfig: { title: 'Cadastre-se em nossa newsletter', buttonText: 'Cadastrar' },
    },
    {
        type: 'image_text',
        label: 'Imagem + Texto',
        description: 'Bloco editorial com imagem e texto lado a lado',
        icon: 'LayoutPanelLeft',
        defaultConfig: { title: 'Sobre nós', text: 'Escreva sobre seu negócio...', layout: 'image-left' },
    },
    {
        type: 'featured_products',
        label: 'Produtos em Destaque',
        description: 'Grid de produtos marcados como destaque',
        icon: 'Star',
        defaultConfig: { title: 'Destaques', maxItems: 8, layout: 'grid' },
    },
    {
        type: 'video_embed',
        label: 'Vídeo',
        description: 'Incorporar vídeo do YouTube ou Vimeo',
        icon: 'Play',
        defaultConfig: { title: '', videoUrl: '', provider: 'youtube' },
    },
    {
        type: 'faq',
        label: 'Perguntas Frequentes',
        description: 'FAQ em formato accordion',
        icon: 'HelpCircle',
        defaultConfig: { title: 'Perguntas Frequentes', items: [] },
    },
    {
        type: 'stats_counter',
        label: 'Contador de Estatísticas',
        description: 'Números animados (ex: +500 clientes)',
        icon: 'TrendingUp',
        defaultConfig: { items: [{ value: '500', label: 'Clientes', prefix: '+' }] },
    },
    {
        type: 'contact_map',
        label: 'Contato / Mapa',
        description: 'Informações de contato e Google Maps',
        icon: 'MapPin',
        defaultConfig: { title: 'Fale Conosco', showMap: true },
    },
    {
        type: 'spacer',
        label: 'Espaçador',
        description: 'Espaço ou divisor entre seções',
        icon: 'SeparatorHorizontal',
        defaultConfig: { height: 'medium', showDivider: false },
    },
    {
        type: 'hero_banner',
        label: 'Banner Hero',
        description: 'Carrossel de banners com overlay',
        icon: 'Image',
        defaultConfig: { height: 'medium' },
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
