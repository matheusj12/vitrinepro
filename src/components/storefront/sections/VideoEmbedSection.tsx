import React from "react";
import { VideoEmbedConfig } from "@/types/sections";

interface VideoEmbedSectionProps {
    config: VideoEmbedConfig;
}

const getEmbedUrl = (videoUrl: string, provider?: string, autoplay?: boolean): string | null => {
    if (!videoUrl) return null;

    // YouTube
    const ytMatch = videoUrl.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/
    );
    if (ytMatch) {
        return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0${autoplay ? "&autoplay=1&mute=1" : ""}`;
    }

    // Vimeo
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?${autoplay ? "autoplay=1&muted=1" : ""}`;
    }

    // Already an embed URL
    if (videoUrl.includes("embed") || videoUrl.includes("player")) {
        return videoUrl;
    }

    return null;
};

export const VideoEmbedSection = ({ config }: VideoEmbedSectionProps) => {
    const { title, videoUrl, provider, autoplay = false } = config;

    const embedUrl = getEmbedUrl(videoUrl, provider, autoplay);

    if (!embedUrl) return null;

    return (
        <section className="py-12 sm:py-16 px-6">
            <div className="container mx-auto max-w-4xl">
                {title && (
                    <h3 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-8">{title}</h3>
                )}
                <div className="relative w-full rounded-2xl overflow-hidden shadow-xl aspect-video bg-black">
                    <iframe
                        src={embedUrl}
                        title={title || "Vídeo"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                </div>
            </div>
        </section>
    );
};
