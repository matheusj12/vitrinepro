/**
 * Comprime e redimensiona uma imagem usando Canvas API (sem dependências externas).
 * Converte para WebP com qualidade 85% e reduz para max 1200px no lado maior.
 */
export const compressImage = (
  file: File,
  maxDimension = 1200,
  quality = 0.85
): Promise<File> => {
  return new Promise((resolve) => {
    // Se já for pequena, não comprime (< 200KB)
    if (file.size < 200 * 1024) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { naturalWidth: w, naturalHeight: h } = img;
      const ratio = Math.min(maxDimension / Math.max(w, h), 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          // Nomeia como .webp — mais leve que JPEG para a maioria das fotos
          const name = file.name.replace(/\.[^.]+$/, ".webp");
          resolve(new File([blob], name, { type: "image/webp" }));
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
};

/**
 * Gera URL otimizada via Supabase Image Transformation (plano Pro).
 * Se o plano não suportar, retorna a URL original sem parâmetros.
 */
export const getOptimizedImageUrl = (
  url: string | null | undefined,
  width: number,
  quality = 75
): string => {
  if (!url) return "/images/default-product-512.png";
  // Só aplica para URLs do Supabase Storage
  if (!url.includes("supabase.co/storage")) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("width", String(width));
    u.searchParams.set("quality", String(quality));
    return u.toString();
  } catch {
    return url;
  }
};
