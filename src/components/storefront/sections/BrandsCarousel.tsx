import React, { useEffect, useRef, useState } from "react";
import { BrandsCarouselConfig } from "@/types/sections";

interface BrandsCarouselProps {
    config: BrandsCarouselConfig;
}

export const BrandsCarousel = ({ config }: BrandsCarouselProps) => {
    const { title, logos = [], speed = "normal" } = config;
    const scrollRef = useRef<HTMLDivElement>(null);

    const speedMap = { slow: 0.5, normal: 1, fast: 2 };
    const animSpeed = speedMap[speed] || 1;

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
                    className="flex items-center gap-10 sm:gap-16 overflow-hidden"
                    style={{ scrollBehavior: "auto" }}
                >
                    {displayLogos.map((logo, i) => (
                        <div
                            key={`${logo.url}-${i}`}
                            className="flex-shrink-0 h-12 sm:h-16 flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                        >
                            <img
                                src={logo.url}
                                alt={logo.name || `Marca ${i + 1}`}
                                className="h-full w-auto max-w-[140px] object-contain"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
