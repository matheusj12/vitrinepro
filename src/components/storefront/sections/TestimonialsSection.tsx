import React from "react";
import { TestimonialsConfig } from "@/types/sections";
import { Star } from "lucide-react";

interface TestimonialsSectionProps {
    config: TestimonialsConfig;
}

export const TestimonialsSection = ({ config }: TestimonialsSectionProps) => {
    const { title, items = [], layout = "cards" } = config;

    if (items.length === 0) return null;

    return (
        <section className="py-14 sm:py-20 px-6">
            <div className="container mx-auto">
                {title && (
                    <h3 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-10">{title}</h3>
                )}
                <div
                    className={
                        layout === "carousel"
                            ? "flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
                            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    }
                >
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className={`bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300 ${layout === "carousel" ? "min-w-[300px] sm:min-w-[360px] snap-center flex-shrink-0" : ""
                                }`}
                        >
                            {/* Stars */}
                            {item.rating && (
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <Star
                                            key={j}
                                            className={`h-4 w-4 ${j < item.rating! ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Quote */}
                            <p className="text-foreground/80 leading-relaxed mb-6 text-sm sm:text-base italic">
                                "{item.text}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                {item.avatarUrl ? (
                                    <img
                                        src={item.avatarUrl}
                                        alt={item.name}
                                        className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                                        {item.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-sm text-foreground">{item.name}</p>
                                    {item.role && <p className="text-xs text-muted-foreground">{item.role}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
