
import { useState, useEffect, useRef, useCallback } from "react";
import { Product } from "@/types/database";

interface UseInfiniteScrollProps {
    products: Product[];
    initialLimit?: number;
    incrementBy?: number;
}

interface UseInfiniteScrollReturn {
    visibleProducts: Product[];
    loadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    sentinelRef: (node: HTMLDivElement | null) => void;
}

export const useInfiniteScroll = ({
    products,
    initialLimit = 12,
    incrementBy = 8,
}: UseInfiniteScrollProps): UseInfiniteScrollReturn => {
    const [limit, setLimit] = useState(initialLimit);
    const [isLoading, setIsLoading] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelNodeRef = useRef<HTMLDivElement | null>(null);

    const visibleProducts = products.slice(0, limit);
    const hasMore = limit < products.length;

    const loadMore = useCallback(() => {
        if (!hasMore || isLoading) return;

        setIsLoading(true);

        // Simulate network delay for smooth UX
        setTimeout(() => {
            setLimit((prev) => Math.min(prev + incrementBy, products.length));
            setIsLoading(false);
        }, 300);
    }, [hasMore, isLoading, incrementBy, products.length]);

    // IntersectionObserver callback
    const sentinelRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading) return;

            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore) {
                        loadMore();
                    }
                },
                {
                    threshold: 0.1,
                    rootMargin: "200px", // Start loading before reaching the end
                }
            );

            if (node) {
                observerRef.current.observe(node);
                sentinelNodeRef.current = node;
            }
        },
        [isLoading, hasMore, loadMore]
    );

    // Cleanup observer on unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Reset limit when products change
    useEffect(() => {
        setLimit(initialLimit);
    }, [products.length, initialLimit]);

    return {
        visibleProducts,
        loadMore,
        hasMore,
        isLoading,
        sentinelRef,
    };
};

export default useInfiniteScroll;
