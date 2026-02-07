
import { useState, useRef } from "react";
import { Product } from "@/types/database";
import { Play, Pause, Volume2, VolumeX, ShoppingBag, Heart, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProductReelsProps {
    products: Product[];
    onAddToCart: (product: Product) => void;
    onToggleFavorite?: (product: Product) => void;
    onShare?: (product: Product) => void;
}

export const ProductReels = ({
    products,
    onAddToCart,
    onToggleFavorite,
    onShare,
}: ProductReelsProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [showHeart, setShowHeart] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter products with videos
    const reelsProducts = products.filter((p) => p.video_url);

    if (reelsProducts.length === 0) return null;

    const currentProduct = reelsProducts[currentIndex];

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollPosition = container.scrollTop;
        const itemHeight = container.clientHeight;
        const newIndex = Math.round(scrollPosition / itemHeight);

        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reelsProducts.length) {
            setCurrentIndex(newIndex);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleDoubleTap = () => {
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
        if (onToggleFavorite) {
            onToggleFavorite(currentProduct);
        }
    };

    return (
        <div className="relative">
            {/* Horizontal scroll preview */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide py-4 px-4 -mx-4">
                {reelsProducts.map((product, index) => (
                    <button
                        key={product.id}
                        onClick={() => {
                            setCurrentIndex(index);
                            // Could open fullscreen modal here
                        }}
                        className="relative flex-shrink-0 w-28 aspect-[9/16] rounded-xl overflow-hidden group"
                    >
                        {/* Video thumbnail */}
                        <video
                            src={product.video_url || undefined}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            loop
                            autoPlay={false}
                            poster={product.images?.[0] || product.image_url || undefined}
                        />

                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="w-5 h-5 text-black ml-0.5" />
                            </div>
                        </div>

                        {/* Product name */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-xs font-medium truncate">
                                {product.name}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Full-screen Reels Modal could be added here */}
        </div>
    );
};

// Vertical full-screen reel player (optional, can be triggered from above)
export const FullScreenReel = ({
    product,
    onClose,
    onAddToCart,
    onToggleFavorite,
    onShare,
}: {
    product: Product;
    onClose: () => void;
    onAddToCart: (product: Product) => void;
    onToggleFavorite?: (product: Product) => void;
    onShare?: (product: Product) => void;
}) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleDoubleTap = () => {
        setShowHeart(true);
        setIsFavorite(true);
        setTimeout(() => setShowHeart(false), 1000);
        if (onToggleFavorite) {
            onToggleFavorite(product);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
            onClick={togglePlay}
            onDoubleClick={handleDoubleTap}
        >
            {/* Video */}
            <video
                ref={videoRef}
                src={product.video_url || undefined}
                className="w-full h-full object-contain"
                autoPlay
                loop
                muted={isMuted}
                playsInline
            />

            {/* Double-tap heart */}
            <AnimatePresence>
                {showHeart && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-xl" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Play/Pause indicator */}
            <AnimatePresence>
                {!isPlaying && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
                            <Play className="w-10 h-10 text-white ml-1" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right side actions */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsFavorite(!isFavorite);
                        if (onToggleFavorite) onToggleFavorite(product);
                    }}
                    className="flex flex-col items-center"
                >
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <Heart className={cn("w-6 h-6", isFavorite ? "text-red-500 fill-red-500" : "text-white")} />
                    </div>
                    <span className="text-white text-xs mt-1">Curtir</span>
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onShare) onShare(product);
                    }}
                    className="flex flex-col items-center"
                >
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-xs mt-1">Enviar</span>
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                        if (videoRef.current) {
                            videoRef.current.muted = !isMuted;
                        }
                    }}
                    className="flex flex-col items-center"
                >
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        {isMuted ? (
                            <VolumeX className="w-6 h-6 text-white" />
                        ) : (
                            <Volume2 className="w-6 h-6 text-white" />
                        )}
                    </div>
                    <span className="text-white text-xs mt-1">{isMuted ? "Som" : "Mudo"}</span>
                </button>
            </div>

            {/* Bottom product info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white text-lg font-bold mb-1">{product.name}</h3>
                <p className="text-white/80 text-sm line-clamp-2 mb-3">
                    {product.description}
                </p>
                <div className="flex items-center gap-3">
                    <span className="text-white text-xl font-bold">
                        R$ {product.price?.toFixed(2) || "Consulte"}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                        }}
                        className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Comprar agora
                    </button>
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
            >
                ×
            </button>
        </motion.div>
    );
};

export default ProductReels;
