import React, { useEffect, useRef, useState } from "react";
import { BrandsCarouselConfig } from "@/types/sections";

interface BrandsCarouselProps {
    config: BrandsCarouselConfig;
}

export const BrandsCarousel = ({ config }: BrandsCarouselProps) => {
    const { title, logos = [], speed = "normal", logoSize = "medium" } = config;
    const scrollRef = useRef<HTMLDivElement>(null);

    const speedMap = { slow: 0.5, normal: 1, fast: 2 };
    const animSpeed = speedMap[speed] || 1;

    // Inline styles for logo sizing (Tailwind purges dynamic classes)
    const sizeStyles = {
        small: { height: 40, maxWidth: 100, gap: 32 },
        medium: { height: 64, maxWidth: 140, gap: 48 },
        large: { height: 96, maxWidth: 200, gap: 64 },
    };
    const sz = sizeStyles[logoSize] || sizeStyles.medium;

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || logos.length < 4) return;

        let animFrame: number;
        let pos = 0;

        const animate = () => {
            pos += animSpeed;
            if (pos >= el.scrollWidth / 2) pos = 0;
            el.scrollLeft = pos;
            animFrame = requestAnimationFrame(animate);
        };
        animFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrame);
    }, [logos.length, animSpeed]);

    if (logos.length === 0) return null;

    // Duplicate logos for infinite scroll illusion
    const displayLogos = logos.length >= 4 ? [...logos, ...logos] : logos;

    return (
        <section className="py-10 sm:py-14 overflow-hidden bg-muted/30">
            <div className="container mx-auto px-6">
                {title && (
                    <h3 className="text-center text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-8">
                        {title}
                    </h3>
                )}
                <div
                    ref={scrollRef}
                    className="flex items-center overflow-hidden"
                    style={{ scrollBehavior: "auto", gap: `${sz.gap}px` }}
                >
                    {displayLogos.map((logo, i) => (
                        <div
                            key={`${logo.url}-${i}`}
                            className="flex-shrink-0 flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                            style={{ height: `${sz.height}px` }}
                        >
                            <img
                                src={logo.url}
                                alt={logo.name || `Marca ${i + 1}`}
                                className="h-full w-auto object-contain"
                                style={{ maxWidth: `${sz.maxWidth}px` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
