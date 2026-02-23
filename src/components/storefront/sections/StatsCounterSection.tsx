import React, { useEffect, useRef, useState } from "react";
import { StatsCounterConfig } from "@/types/sections";

interface StatsCounterSectionProps {
    config: StatsCounterConfig;
}

const AnimatedNumber = ({ value, prefix = "", suffix = "" }: { value: string; prefix?: string; suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const numericValue = parseInt(value.replace(/\D/g, ""), 10) || 0;

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    let start = 0;
                    const duration = 2000;
                    const startTime = performance.now();

                    const animate = (currentTime: number) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        // Ease out
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setDisplayValue(Math.floor(eased * numericValue));
                        if (progress < 1) requestAnimationFrame(animate);
                    };

                    requestAnimationFrame(animate);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [numericValue]);

    return (
        <div ref={ref} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary tabular-nums">
            {prefix}{displayValue.toLocaleString("pt-BR")}{suffix}
        </div>
    );
};

export const StatsCounterSection = ({ config }: StatsCounterSectionProps) => {
    const { items = [], bgColor } = config;

    if (items.length === 0) return null;

    return (
        <section className="py-14 sm:py-20 px-6" style={{ backgroundColor: bgColor || "hsl(var(--muted))" }}>
            <div className="container mx-auto">
                <div className={`grid gap-8 text-center ${items.length === 1 ? "grid-cols-1" :
                        items.length === 2 ? "grid-cols-2" :
                            items.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
                                "grid-cols-2 lg:grid-cols-4"
                    }`}>
                    {items.map((item, i) => (
                        <div key={i} className="space-y-2">
                            <AnimatedNumber value={item.value} prefix={item.prefix} suffix={item.suffix} />
                            <p className="text-sm sm:text-base font-medium text-muted-foreground uppercase tracking-wider">
                                {item.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
