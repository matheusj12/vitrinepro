import React from "react";
import { ImageTextConfig } from "@/types/sections";

interface ImageTextSectionProps {
    config: ImageTextConfig;
}

export const ImageTextSection = ({ config }: ImageTextSectionProps) => {
    const { title, text, imageUrl, layout = "image-left", bgColor } = config;

    const isImageLeft = layout === "image-left";

    return (
        <section className="py-12 sm:py-20 px-6" style={{ backgroundColor: bgColor }}>
            <div
                className={`container mx-auto flex flex-col md:flex-row items-center gap-10 lg:gap-16 ${isImageLeft ? "" : "md:flex-row-reverse"
                    }`}
            >
                {imageUrl && (
                    <div className="flex-1 w-full">
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full rounded-2xl shadow-lg object-cover max-h-[450px]"
                        />
                    </div>
                )}
                <div className={`flex-1 space-y-4 ${imageUrl ? "" : "max-w-2xl mx-auto text-center"}`}>
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                        {title}
                    </h2>
                    <div className="text-muted-foreground leading-relaxed text-base sm:text-lg whitespace-pre-line">
                        {text}
                    </div>
                </div>
            </div>
        </section>
    );
};
