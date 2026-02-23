import React from "react";
import { FeaturedProductsConfig } from "@/types/sections";
import { Product } from "@/types/database";
import { StorefrontProductGrid } from "@/components/storefront/StorefrontProductGrid";

interface FeaturedProductsSectionProps {
    config: FeaturedProductsConfig;
    products: Product[];
    onAddToCart: (product: Product) => void;
}

export const FeaturedProductsSection = ({ config, products, onAddToCart }: FeaturedProductsSectionProps) => {
    const { title = "Destaques", maxItems = 8, layout = "grid" } = config;

    const featured = products.filter((p) => p.featured).slice(0, maxItems);
    if (featured.length === 0) return null;

    return (
        <section className="py-12 sm:py-16 px-6">
            <div className="container mx-auto">
                <h3 className="text-2xl sm:text-3xl font-heading font-bold mb-8">{title}</h3>
                <StorefrontProductGrid
                    products={featured}
                    isLoading={false}
                    gridClasses="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
                    onAddToCart={onAddToCart}
                />
            </div>
        </section>
    );
};
