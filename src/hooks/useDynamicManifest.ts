import { useEffect } from "react";

interface DynamicManifestOptions {
  name: string;
  themeColor?: string;
  logoUrl?: string;
  slug: string;
}

export const useDynamicManifest = ({ name, themeColor, logoUrl, slug }: DynamicManifestOptions) => {
  useEffect(() => {
    if (!name || !slug) return;

    const shortName = name.length > 12 ? name.slice(0, 12) : name;

    const icons: any[] = [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ];
    if (logoUrl) {
      icons.unshift({ src: logoUrl, sizes: "any", purpose: "any" });
    }

    const manifest = {
      name,
      short_name: shortName,
      description: `Catálogo online de ${name}`,
      theme_color: themeColor || "#f97316",
      background_color: "#ffffff",
      display: "standalone",
      start_url: `/loja/${slug}`,
      scope: `/loja/${slug}`,
      icons,
      screenshots: [
        {
          src: "/screenshot-produto.jpeg",
          sizes: "390x844",
          type: "image/jpeg",
          form_factor: "narrow",
          label: "Vitrine de produtos",
        },
      ],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
    const blobUrl = URL.createObjectURL(blob);

    let linkEl = document.querySelector("link[rel='manifest']") as HTMLLinkElement | null;
    const previousHref = linkEl?.href || "";

    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.rel = "manifest";
      document.head.appendChild(linkEl);
    }
    linkEl.href = blobUrl;

    // Atualizar theme-color meta tag
    let themeColorMeta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement | null;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement("meta");
      themeColorMeta.name = "theme-color";
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = themeColor || "#f97316";

    return () => {
      URL.revokeObjectURL(blobUrl);
      if (linkEl && previousHref) linkEl.href = previousHref;
    };
  }, [name, themeColor, logoUrl, slug]);
};
