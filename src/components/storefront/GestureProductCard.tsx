
import { useState, useRef, useCallback } from "react";
import { Product } from "@/types/database";
import { Heart, ShoppingBag, Plus } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import StorefrontMediaCarousel from "./StorefrontMediaCarousel";

interface GestureProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    onToggleFavorite?: (product: Product) => void;
    isFavorite?: boolean;
}

const DEFAULT_IMAGE = "/images/default-product-512.png";

export const GestureProductCard = ({
    product,
    onAddToCart,
    onToggleFavorite,
    isFavorite = false,
}: GestureProductCardProps) => {
    const [showHeart, setShowHeart] = useState(false);
    const [isSliding, setIsSliding] = useState(false);
    const [slideOffset, setSlideOffset] = useState(0);
    const lastTapRef = useRef<number>(0);
    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const imgs = Array.isArray(product.images) ? product.images : [];
    const mediaImages = imgs.length > 0 ? imgs : (product.image_url ? [product.image_url] : [DEFAULT_IMAGE]);

    // Double tap detection
    const handleTap = useCallback(() => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            // Double tap detected!
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
            }

            // Trigger favorite animation
            setShowHeart(true);
            setTimeout(() => setShowHeart(false), 1000);

            // Call favorite handler
            if (onToggleFavorite) {
                onToggleFavorite(product);
            }
        } else {
            // Single tap - wait to see if it becomes double tap
            tapTimeoutRef.current = setTimeout(() => {
                // Single tap action (could navigate to product)
            }, DOUBLE_TAP_DELAY);
        }

        lastTapRef.current = now;
    }, [product, onToggleFavorite]);

    // Swipe handler
    const handleDrag = (event: any, info: PanInfo) => {
        const offset = info.offset.x;
        if (offset < 0) {
            setSlideOffset(Math.max(offset, -100));
            setIsSliding(true);
        }
    };

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.x < -60) {
            // Swiped enough - add to cart
            onAddToCart(product);
            // Snap back with animation
            setSlideOffset(0);
        } else {
            setSlideOffset(0);
        }
        setTimeout(() => setIsSliding(false), 300);
    };

    return (
        <motion.div
            className="relative overflow-hidden rounded-2xl bg-card border border-border/40 shadow-sm"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{ x: slideOffset }}
            animate={{ x: isSliding ? slideOffset : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Swipe reveal action */}
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-primary flex items-center justify-center z-0">
                <div className="flex flex-col items-center text-primary-foreground">
                    <ShoppingBag className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Adicionar</span>
                </div>
            </div>

            {/* Card content */}
            <div
                className="relative bg-card z-10"
                style={{ transform: `translateX(${slideOffset}px)` }}
            >
                {/* Image container */}
                <div
                    className="relative aspect-square overflow-hidden bg-secondary/10"
                    onClick={handleTap}
                >
                    <StorefrontMediaCarousel
                        images={mediaImages}
                        videoUrl={product.video_url || undefined}
                        heightClass="h-full w-full object-cover"
                    />

                    {/* Double-tap heart animation */}
                    <AnimatePresence>
                        {showHeart && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                exit={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-lg" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Favorite indicator */}
                    {isFavorite && (
                        <div className="absolute top-2 right-2">
                            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        </div>
                    )}

                    {/* Featured badge */}
                    {product.featured && (
                        <div className="absolute top-2 left-2">
                            <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                Destaque
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2">
                        {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-foreground">
                            {product.price ? `R$ ${product.price.toFixed(2)}` : "Consulte"}
                        </span>
                        <button
                            onClick={() => onAddToCart(product)}
                            className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Swipe hint on first load */}
            <div className="absolute bottom-16 right-2 text-[10px] text-muted-foreground opacity-50">
                ← Arraste para adicionar
            </div>
        </motion.div>
    );
};

export default GestureProductCard;
