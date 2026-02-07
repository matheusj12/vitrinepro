
import { useState, useEffect, useRef, useCallback } from "react";
import { Product } from "@/types/database";
import { X, ChevronLeft, ChevronRight, ShoppingBag, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProductStoriesProps {
    products: Product[];
    onAddToCart: (product: Product) => void;
    onViewProduct?: (product: Product) => void;
}

const DEFAULT_IMAGE = "/images/default-product-512.png";

export const ProductStories = ({
    products,
    onAddToCart,
    onViewProduct,
}: ProductStoriesProps) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);

    const STORY_DURATION = 5000; // 5 seconds per story
    const featuredProducts = products.filter((p) => p.featured).slice(0, 10);

    const startTimer = useCallback(() => {
        if (activeIndex === null) return;

        // Clear existing timers
        if (timerRef.current) clearTimeout(timerRef.current);
        if (progressInterval.current) clearInterval(progressInterval.current);

        // Progress bar animation
        const startTime = Date.now();
        progressInterval.current = setInterval(() => {
            if (!isPaused) {
                const elapsed = Date.now() - startTime;
                const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
                setProgress(newProgress);
            }
        }, 50);

        // Auto-advance timer
        timerRef.current = setTimeout(() => {
            if (!isPaused && activeIndex !== null) {
                if (activeIndex < featuredProducts.length - 1) {
                    setActiveIndex(activeIndex + 1);
                    setProgress(0);
                } else {
                    closeStory();
                }
            }
        }, STORY_DURATION);
    }, [activeIndex, isPaused, featuredProducts.length]);

    useEffect(() => {
        if (activeIndex !== null && !isPaused) {
            startTimer();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [activeIndex, isPaused, startTimer]);

    const openStory = (index: number) => {
        setActiveIndex(index);
        setProgress(0);
        document.body.style.overflow = "hidden";
    };

    const closeStory = () => {
        setActiveIndex(null);
        setProgress(0);
        setIsPaused(false);
        document.body.style.overflow = "";
        if (timerRef.current) clearTimeout(timerRef.current);
        if (progressInterval.current) clearInterval(progressInterval.current);
    };

    const goToPrevious = () => {
        if (activeIndex !== null && activeIndex > 0) {
            setActiveIndex(activeIndex - 1);
            setProgress(0);
        }
    };

    const goToNext = () => {
        if (activeIndex !== null && activeIndex < featuredProducts.length - 1) {
            setActiveIndex(activeIndex + 1);
            setProgress(0);
        } else {
            closeStory();
        }
    };

    const handleTouchStart = () => setIsPaused(true);
    const handleTouchEnd = () => setIsPaused(false);

    if (featuredProducts.length === 0) return null;

    const activeProduct = activeIndex !== null ? featuredProducts[activeIndex] : null;
    const activeImage = activeProduct?.images?.[0] || activeProduct?.image_url || DEFAULT_IMAGE;

    return (
        <>
            {/* Stories Circles */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide py-4 px-4 -mx-4">
                {featuredProducts.map((product, index) => {
                    const img = product.images?.[0] || product.image_url || DEFAULT_IMAGE;
                    return (
                        <button
                            key={product.id}
                            onClick={() => openStory(index)}
                            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                        >
                            {/* Animated gradient ring */}
                            <div className="relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 rounded-full animate-spin-slow opacity-90" />
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-background">
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                                        <img
                                            src={img}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground truncate max-w-[70px] group-hover:text-foreground transition-colors">
                                {product.name.split(" ").slice(0, 2).join(" ")}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Fullscreen Story Overlay */}
            <AnimatePresence>
                {activeIndex !== null && activeProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleTouchStart}
                        onMouseUp={handleTouchEnd}
                    >
                        {/* Progress bars */}
                        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                            {featuredProducts.map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                                >
                                    <div
                                        className="h-full bg-white transition-all duration-100 ease-linear"
                                        style={{
                                            width:
                                                i < activeIndex
                                                    ? "100%"
                                                    : i === activeIndex
                                                        ? `${progress}%`
                                                        : "0%",
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Close button */}
                        <button
                            onClick={closeStory}
                            className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Navigation areas */}
                        <button
                            onClick={goToPrevious}
                            className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                            aria-label="Previous story"
                        />
                        <button
                            onClick={goToNext}
                            className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
                            aria-label="Next story"
                        />

                        {/* Story content */}
                        <motion.div
                            key={activeIndex}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full h-full max-w-lg mx-auto"
                        >
                            <img
                                src={activeImage}
                                alt={activeProduct.name}
                                className="w-full h-full object-contain"
                            />

                            {/* Product info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                                <h3 className="text-white text-xl font-bold mb-1">
                                    {activeProduct.name}
                                </h3>
                                <p className="text-white/80 text-sm line-clamp-2 mb-4">
                                    {activeProduct.description || "Produto em destaque"}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="text-white text-2xl font-bold">
                                        R$ {activeProduct.price?.toFixed(2) || "Consulte"}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddToCart(activeProduct);
                                        }}
                                        className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        Adicionar
                                    </button>
                                </div>
                            </div>

                            {/* Swipe up indicator */}
                            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/60 animate-bounce">
                                <ChevronLeft className="w-5 h-5 rotate-90" />
                                <span className="text-xs">Deslize para ver</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ProductStories;
