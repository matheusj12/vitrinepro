import React, { useState, useEffect } from "react";
import { Banner } from "@/types/database";

const DEFAULT_BANNER_IMAGE = "/images/default-banner-2560x1440.png";

interface StorefrontBannerProps {
  banners: Banner[];
}

export const StorefrontBanner = ({ banners }: StorefrontBannerProps) => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="mb-6 sm:mb-8 relative">
      <div className="relative rounded-lg overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`transition-opacity duration-500 ${
              index === currentBannerIndex ? "opacity-100" : "opacity-0 absolute inset-0"
            }`}
          >
            <img
              src={banner.image_url || DEFAULT_BANNER_IMAGE}
              alt={banner.title || ""}
              className="w-full h-40 sm:h-52 lg:h-64 object-cover"
            />
            {(banner.title || banner.subtitle) && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-3 sm:p-4">
                {banner.title && (
                  <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 text-center">
                    {banner.title}
                  </h2>
                )}
                {banner.subtitle && (
                  <p className="text-sm sm:text-lg lg:text-xl text-center">{banner.subtitle}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBannerIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentBannerIndex ? "bg-white w-8" : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ver banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};