import React from "react";
import { Product } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StorefrontMediaCarousel from "@/components/storefront/StorefrontMediaCarousel";

const DEFAULT_PRODUCT_IMAGE = "/images/default-product-512.png";

interface StorefrontProductGridProps {
  products: Product[];
  isLoading: boolean;
  gridClasses: string;
  onAddToCart: (product: Product) => void;
}

export const StorefrontProductGrid = ({
  products,
  isLoading,
  gridClasses,
  onAddToCart,
}: StorefrontProductGridProps) => {
  if (isLoading) {
    return (
      <p className="col-span-full text-center text-muted-foreground py-8">
        Carregando produtos...
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <p className="col-span-full text-center text-muted-foreground py-8">
        Nenhum produto encontrado para os critérios selecionados.
      </p>
    );
  }

  return (
    <div className={gridClasses}>
      {products.map((product) => {
        const imgs = Array.isArray(product.images) ? product.images : [];
        const mediaImages = imgs.length > 0 ? imgs : (product.image_url ? [product.image_url] : []);
        const safeImages = mediaImages.length > 0 ? mediaImages : [DEFAULT_PRODUCT_IMAGE];

        return (
          <div
            key={product.id}
            className="group relative bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-square overflow-hidden bg-muted/20">
              <StorefrontMediaCarousel
                images={safeImages}
                videoUrl={product.video_url || undefined}
                heightClass="h-full w-full object-cover"
              />
              {/* Quick Add Overlay (Desktop) */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none lg:pointer-events-auto">
                <Button
                  onClick={() => onAddToCart(product)}
                  className="rounded-full shadow-lg font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white text-black hover:bg-white/90 hover:scale-105"
                  size="sm"
                >
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div className="space-y-1">
                <h3 className="font-heading font-semibold text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="flex items-end justify-between pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">A partir de {product.min_quantity} un</p>
                  <p className="text-lg font-bold text-primary font-heading">
                    {product.price ? `R$ ${product.price.toFixed(2)}` : "Consulte"}
                  </p>
                </div>

                {/* Mobile Add Button (Visible only on mobile/touch where hover doesn't work well) */}
                <Button
                  onClick={() => onAddToCart(product)}
                  size="icon"
                  className="rounded-full h-8 w-8 lg:hidden shrink-0 shadow-sm"
                >
                  <span className="sr-only">Adicionar</span>
                  <span className="text-lg leading-none mb-0.5">+</span>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};