import React from "react";
import { Product } from "@/types/database";
import { Button } from "@/components/ui/button";
import StorefrontMediaCarousel from "@/components/storefront/StorefrontMediaCarousel";
import { ShoppingBag, Plus } from "lucide-react";
import { motion } from "framer-motion";

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
      <div className={gridClasses}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse space-y-3">
            <div className="bg-muted rounded-2xl aspect-square w-full" />
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-medium text-muted-foreground">
          Nenhum produto encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {products.map((product, index) => {
        const imgs = Array.isArray(product.images) ? product.images : [];
        const mediaImages = imgs.length > 0 ? imgs : (product.image_url ? [product.image_url] : []);
        const safeImages = mediaImages.length > 0 ? mediaImages : [DEFAULT_PRODUCT_IMAGE];

        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border border-border/40 hover:border-primary/20"
          >
            {/* Image Container */}
            <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden bg-secondary/10">
              <StorefrontMediaCarousel
                images={safeImages}
                videoUrl={product.video_url || undefined}
                heightClass="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Desktop Quick Add Button */}
              <div className="absolute bottom-4 left-0 right-0 px-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 hidden lg:block">
                <Button
                  onClick={() => onAddToCart(product)}
                  className="w-full bg-white/90 backdrop-blur-sm text-black hover:bg-white shadow-lg font-medium rounded-xl h-10 border border-black/5"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Adicionar
                </Button>
              </div>

              {/* Tags/Badges could go here */}
              {product.featured && (
                <div className="absolute top-2 left-2">
                  <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    Destaque
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <div className="mb-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {product.category_id ? 'Produto' : 'Geral'}
                </p>
              </div>

              <h3 className="font-heading font-semibold text-base leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>

              <div className="mt-auto flex items-end justify-between pt-2">
                <div className="flex flex-col">
                  {product.min_quantity > 1 && (
                    <span className="text-[10px] text-muted-foreground mb-0.5">
                      Mínimo: {product.min_quantity} un
                    </span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground">
                      {product.price ? `R$ ${product.price.toFixed(2)}` : "Consulte"}
                    </span>
                  </div>
                </div>

                {/* Mobile Add Button */}
                <Button
                  onClick={() => onAddToCart(product)}
                  size="icon"
                  className="rounded-full h-9 w-9 lg:hidden shrink-0 shadow-md bg-primary text-primary-foreground hover:scale-105 transition-transform"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};