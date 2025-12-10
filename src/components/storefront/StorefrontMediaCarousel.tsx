import React, { useRef, useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface StorefrontMediaCarouselProps {
  images: string[];
  videoUrl?: string | null;
  heightClass?: string; // ex: 'h-36 sm:h-44 lg:h-48'
}

export const StorefrontMediaCarousel: React.FC<StorefrontMediaCarouselProps> = ({
  images,
  videoUrl,
  heightClass = "h-36 sm:h-44 lg:h-48",
}) => {
  const slides: Array<{ type: "video" | "image"; src: string }> = [];

  if (videoUrl) {
    slides.push({ type: "video", src: videoUrl });
  }
  if (Array.isArray(images) && images.length > 0) {
    images.forEach((src) => slides.push({ type: "image", src }));
  }

  // Fallback: se nada foi passado, renderizar um placeholder vazio
  if (slides.length === 0) {
    return (
      <div className={`w-full ${heightClass} bg-muted rounded mb-3 sm:mb-4`} />
    );
  }

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1 });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(slides.length > 1);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  // Controle do vídeo (play ao clicar no overlay)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative">
      <div className="overflow-hidden rounded" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, idx) => (
            <div className="min-w-0 flex-[0_0_100%]" key={`${slide.type}-${idx}`}>
              <div className={`w-full ${heightClass} bg-muted`}>
                {slide.type === "image" ? (
                  <img
                    src={slide.src}
                    alt={`mídia ${idx + 1}`}
                    className={`w-full ${heightClass} object-cover`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/default-product-512.png";
                    }}
                  />
                ) : (
                  <div className={`relative w-full ${heightClass} bg-black`}>
                    <video
                      ref={videoRef}
                      src={slide.src}
                      className={`w-full ${heightClass} object-cover`}
                      preload="metadata"
                      playsInline
                      controls={isPlaying}
                      controlsList="nodownload"
                    />
                    {!isPlaying && (
                      <button
                        type="button"
                        onClick={handlePlay}
                        className="absolute inset-0 flex items-center justify-center"
                        aria-label="Reproduzir vídeo"
                      >
                        <span className="bg-white/80 text-black rounded-full p-3 shadow-md hover:scale-105 transition">
                          <Play className="h-6 w-6" />
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setas laterais (desktop) */}
      {slides.length > 1 && (
        <>
          <div className="hidden md:block">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="absolute top-1/2 -translate-y-1/2 left-2 rounded-full"
              aria-label="Anterior"
            >
              ‹
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="absolute top-1/2 -translate-y-1/2 right-2 rounded-full"
              aria-label="Próximo"
            >
              ›
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StorefrontMediaCarousel;