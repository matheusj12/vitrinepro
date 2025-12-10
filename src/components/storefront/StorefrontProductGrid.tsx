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
        // fallback: se não houver images, usar image_url como primeira imagem
        const mediaImages = imgs.length > 0 ? imgs : (product.image_url ? [product.image_url] : []);
        const safeImages = mediaImages.length > 0 ? mediaImages : [DEFAULT_PRODUCT_IMAGE];

        return (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <StorefrontMediaCarousel
                images={safeImages}
                videoUrl={product.video_url || undefined}
                heightClass="h-36 sm:h-44 lg:h-48"
              />
              <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 line-clamp-2">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                  {product.description}
                </p>
              )}
              <p className="text-base sm:text-lg font-bold mb-2">
                {product.price ? `R$ ${product.price.toFixed(2)}` : "Consulte"}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Qtd mínima: {product.min_quantity}
              </p>
              <Button onClick={() => onAddToCart(product)} className="w-full text-xs sm:text-sm" size="sm">
                Adicionar
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};