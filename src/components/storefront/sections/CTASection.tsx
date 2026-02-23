import React from "react";
import { CTAConfig } from "@/types/sections";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
    config: CTAConfig;
}

export const CTASection = ({ config }: CTASectionProps) => {
    const {
        title = "Título",
        subtitle,
        buttonText = "Saiba Mais",
        buttonLink = "#",
        imageUrl,
        layout = "image-right",
        bgColor,
        textColor,
    } = config;

    const isFullBg = layout === "full-bg";
    const isCentered = layout === "centered";
    const isImageLeft = layout === "image-left";

    if (isFullBg) {
        return (
            <section
                className="relative py-20 px-6 overflow-hidden"
                style={{
                    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: bgColor || "hsl(var(--primary))",
                }}
            >
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative container mx-auto text-center max-w-2xl">
                    <h2
                        className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4"
                        style={{ color: textColor || "#ffffff" }}
                    >
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-lg sm:text-xl mb-8 opacity-90" style={{ color: textColor || "#ffffff" }}>
                            {subtitle}
                        </p>
                    )}
                    <Button
                        size="lg"
                        className="rounded-full px-8 text-base font-bold shadow-xl"
                        onClick={() => {
                            if (buttonLink) window.open(buttonLink, buttonLink.startsWith("http") ? "_blank" : "_self");
                        }}
                    >
                        {buttonText} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </section>
        );
    }

    if (isCentered) {
        return (
            <section className="py-16 px-6" style={{ backgroundColor: bgColor }}>
                <div className="container mx-auto text-center max-w-2xl">
                    {imageUrl && (
                        <img src={imageUrl} alt="" className="w-full max-w-md mx-auto rounded-2xl mb-8 shadow-lg" />
                    )}
                    <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4" style={{ color: textColor }}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-lg text-muted-foreground mb-8" style={{ color: textColor ? `${textColor}cc` : undefined }}>
                            {subtitle}
                        </p>
                    )}
                    <Button
                        size="lg"
                        className="rounded-full px-8 font-bold shadow-lg"
                        onClick={() => {
                            if (buttonLink) window.open(buttonLink, buttonLink.startsWith("http") ? "_blank" : "_self");
                        }}
                    >
                        {buttonText} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </section>
        );
    }

    // image-left or image-right
    return (
        <section className="py-12 sm:py-16 px-6" style={{ backgroundColor: bgColor }}>
            <div
                className={`container mx-auto flex flex-col md:flex-row items-center gap-8 lg:gap-16 ${isImageLeft ? "" : "md:flex-row-reverse"
                    }`}
            >
                {imageUrl && (
                    <div className="flex-1 w-full">
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full rounded-2xl shadow-xl object-cover max-h-[400px]"
                        />
                    </div>
                )}
                <div className={`flex-1 ${imageUrl ? "" : "max-w-2xl mx-auto text-center"}`}>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-4" style={{ color: textColor }}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed" style={{ color: textColor ? `${textColor}cc` : undefined }}>
                            {subtitle}
                        </p>
                    )}
                    <Button
                        size="lg"
                        className="rounded-full px-8 font-bold shadow-lg shadow-primary/20"
                        onClick={() => {
                            if (buttonLink) window.open(buttonLink, buttonLink.startsWith("http") ? "_blank" : "_self");
                        }}
                    >
                        {buttonText} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        </section>
    );
};
