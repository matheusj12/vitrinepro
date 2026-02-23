import React, { useState } from "react";
import { FAQConfig } from "@/types/sections";
import { ChevronDown } from "lucide-react";

interface FAQSectionProps {
    config: FAQConfig;
}

export const FAQSection = ({ config }: FAQSectionProps) => {
    const { title, items = [] } = config;
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    if (items.length === 0) return null;

    return (
        <section className="py-14 sm:py-20 px-6">
            <div className="container mx-auto max-w-3xl">
                {title && (
                    <h3 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-10">{title}</h3>
                )}
                <div className="space-y-3">
                    {items.map((item, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <div
                                key={i}
                                className="border border-border/50 rounded-xl overflow-hidden bg-card transition-all"
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : i)}
                                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                                >
                                    <span className="font-semibold text-foreground pr-4">{item.question}</span>
                                    <ChevronDown
                                        className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                        }`}
                                >
                                    <div className="px-5 pb-5 text-muted-foreground leading-relaxed whitespace-pre-line">
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
