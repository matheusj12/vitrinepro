
import { useState } from "react";
import { Product } from "@/types/database";
import { ShoppingBag, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProductTag {
    id: string;
    productId: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
}

interface TaggedImageProps {
    imageUrl: string;
    tags: ProductTag[];
    products: Product[];
    onAddToCart: (product: Product) => void;
    alt?: string;
}

export const TaggedImage = ({
    imageUrl,
    tags,
    products,
    onAddToCart,
    alt = "Lifestyle image with products",
}: TaggedImageProps) => {
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [showAllTags, setShowAllTags] = useState(true);

    const getProductById = (productId: string) => {
        return products.find((p) => p.id === productId);
    };

    const handleTagClick = (tagId: string) => {
        setActiveTag(activeTag === tagId ? null : tagId);
    };

    const handleImageClick = () => {
        if (activeTag) {
            setActiveTag(null);
        } else {
            setShowAllTags(!showAllTags);
        }
    };

    return (
        <div
            className="relative w-full aspect-square rounded-xl overflow-hidden group cursor-pointer"
            onClick={handleImageClick}
        >
            {/* Main image */}
            <img
                src={imageUrl}
                alt={alt}
                className="w-full h-full object-cover"
            />

            {/* Tag indicators */}
            <AnimatePresence>
                {showAllTags && tags.map((tag) => {
                    const product = getProductById(tag.productId);
                    if (!product) return null;

                    const isActive = activeTag === tag.id;

                    return (
                        <motion.div
                            key={tag.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            style={{
                                position: "absolute",
                                left: `${tag.x}%`,
                                top: `${tag.y}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                            className="z-10"
                        >
                            {/* Tag dot */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleTagClick(tag.id);
                                }}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                    isActive
                                        ? "bg-white scale-110 shadow-xl"
                                        : "bg-white/90 hover:bg-white hover:scale-105 shadow-lg"
                                )}
                            >
                                {isActive ? (
                                    <X className="w-4 h-4 text-black" />
                                ) : (
                                    <Plus className="w-4 h-4 text-black" />
                                )}
                            </button>

                            {/* Product popup */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                        className={cn(
                                            "absolute z-20 w-64 bg-white rounded-xl shadow-2xl overflow-hidden",
                                            tag.y > 50 ? "bottom-full mb-3" : "top-full mt-3",
                                            tag.x > 50 ? "right-0" : "left-0"
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Product image */}
                                        <div className="relative h-32 bg-gray-100">
                                            <img
                                                src={product.images?.[0] || product.image_url || "/images/default-product-512.png"}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Product info */}
                                        <div className="p-3">
                                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                                                {product.name}
                                            </h4>
                                            <div className="flex items-center justify-between">
                                                <span className="text-base font-bold text-gray-900">
                                                    R$ {product.price?.toFixed(2) || "Consulte"}
                                                </span>
                                                <button
                                                    onClick={() => onAddToCart(product)}
                                                    className="flex items-center gap-1.5 bg-black text-white text-xs font-medium px-3 py-2 rounded-full hover:bg-gray-800 transition-colors"
                                                >
                                                    <ShoppingBag className="w-3.5 h-3.5" />
                                                    Adicionar
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Tap to see products hint */}
            {!showAllTags && (
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Toque para ver produtos
                </div>
            )}

            {/* Tags count badge */}
            {tags.length > 0 && (
                <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {tags.length} produto{tags.length > 1 ? "s" : ""}
                </div>
            )}
        </div>
    );
};

// Helper component to display a gallery of tagged images
interface TaggedImageGalleryProps {
    images: Array<{
        url: string;
        tags: ProductTag[];
    }>;
    products: Product[];
    onAddToCart: (product: Product) => void;
}

export const TaggedImageGallery = ({
    images,
    products,
    onAddToCart,
}: TaggedImageGalleryProps) => {
    if (images.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-lg font-bold text-foreground">
                    📸 Looks com nossos produtos
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 px-4">
                {images.map((image, index) => (
                    <TaggedImage
                        key={index}
                        imageUrl={image.url}
                        tags={image.tags}
                        products={products}
                        onAddToCart={onAddToCart}
                    />
                ))}
            </div>
        </div>
    );
};

export default TaggedImage;
