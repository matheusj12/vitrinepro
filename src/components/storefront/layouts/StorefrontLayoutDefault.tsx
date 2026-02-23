
import { StorefrontLayoutProps } from "@/types/storefront";
import { SectionRenderer } from "@/components/storefront/SectionRenderer";
import { DEFAULT_PAGE_LAYOUT, PageLayout } from "@/types/sections";

export const StorefrontLayoutDefault = (props: StorefrontLayoutProps) => {
    // Read page_sections from store_settings, fallback to default layout
    const pageLayout: PageLayout =
        (props.storeSettings as any)?.page_sections?.sections?.length > 0
            ? (props.storeSettings as any).page_sections
            : DEFAULT_PAGE_LAYOUT;

    return (
        <SectionRenderer
            pageLayout={pageLayout}
            tenant={props.tenant}
            storeSettings={props.storeSettings}
            categories={props.categories}
            banners={props.banners}
            products={props.products}
            isLoadingProducts={props.isLoadingProducts}
            searchQuery={props.searchQuery}
            setSearchQuery={props.setSearchQuery}
            debouncedSearchQuery={props.debouncedSearchQuery}
            selectedCategoryIds={props.selectedCategoryIds}
            setSelectedCategoryIds={props.setSelectedCategoryIds}
            sortOption={props.sortOption}
            setSortOption={props.setSortOption}
            handleAddToCart={props.handleAddToCart}
            globalIcons={props.globalIcons}
        />
    );
};
