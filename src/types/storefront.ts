
import { Product, Category, Banner, StoreSettings } from "@/types/database";

export interface StorefrontLayoutProps {
    tenant: any;
    storeSettings: StoreSettings | null;
    categories: Category[];
    banners: Banner[];
    products: Product[];
    isLoadingProducts: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    debouncedSearchQuery: string;
    selectedCategoryIds: string[];
    setSelectedCategoryIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    sortOption: string;
    setSortOption: (option: string) => void;
    handleAddToCart: (product: Product) => void;
    globalIcons?: any;
}
