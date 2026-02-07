
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDarkColor } from "@/lib/color-utils";

// Interface alinhada com o banco de dados
interface ThemeConfig {
  colors?: Record<string, string>;
  productCard?: {
    radius?: string;
    shadow?: string;
    border?: string;
    hoverScale?: number;
    hoverGlow?: boolean;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  variables?: Record<string, string>; // Legado ou extras
}

interface Theme {
  id: string;
  name: string;
  config: ThemeConfig;
}

export const useTheme = (tenantId?: string) => {
  const { data: theme, isLoading } = useQuery({
    queryKey: ["selected-theme", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      // Buscar tema selecionado do tenant
      const { data: storeSettings, error: storeError } = await supabase
        .from("store_settings")
        .select("theme_id")
        .eq("tenant_id", tenantId)
        .single();

      let themeId = storeSettings?.theme_id;

      // Se não achar em store_settings, tenta fallback em tenants (legado) ou padrão
      if (!themeId) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("selected_theme_id") // Campo legado se existir, ou null
          .eq("id", tenantId)
          .maybeSingle(); // maybeSingle evita erro se não existir

        themeId = (tenant as any)?.selected_theme_id;
      }

      if (!themeId) {
        // Fallback: Buscar tema padrão 'free-classic'
        const { data: defaultTheme } = await supabase
          .from("themes")
          .select("*")
          .eq("slug", "free-classic")
          .maybeSingle();
        return defaultTheme as Theme;
      }

      // Buscar theme data
      const { data: themeData, error } = await supabase
        .from("themes")
        .select("*")
        .eq("id", themeId)
        .single();

      if (error || !themeData) {
        // Fallback final
        const { data: fallback } = await supabase
          .from("themes")
          .select("*")
          .eq("slug", "free-classic")
          .maybeSingle();
        return fallback as Theme;
      }

      return themeData as Theme;
    },
    enabled: !!tenantId,
    staleTime: 0, // Sempre buscar o tema mais recente para refletir mudanças imediatas
  });

  // Engine de Aplicação do Tema
  useEffect(() => {
    if (!theme?.config) return;

    const root = document.documentElement;
    const config = theme.config;

    // 1. Cores
    if (config.colors) {
      Object.entries(config.colors).forEach(([key, value]) => {
        const cssVar = key.startsWith('--') ? key : `--${key}`;
        root.style.setProperty(cssVar, value);
      });

      // Detecta se o background é escuro e aplica a classe 'dark' para correção de contraste
      // Isso força o Tailwind a usar as variantes dark:text-gray-XXX que são mais claras
      const bg = config.colors.background || config.colors['--background'];
      if (bg) {
        const isDark = isDarkColor(bg);
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    }

    // 2. Product Card Styles
    if (config.productCard) {
      if (config.productCard.radius) root.style.setProperty("--radius", config.productCard.radius);
      // Podemos adicionar mais vars se o CSS global suportar, 
      // mas --radius é padrão do Shadcn.
      // Para shadow personalizadas, precisaria de suporte no tailwind config ou style inline no card.
    }

    // 3. Fontes (Simulação simples - num app real carregaria do Google Fonts)
    // Aqui apenas setamos a variável da família
    if (config.fonts) {
      if (config.fonts.heading) root.style.setProperty("--font-heading", config.fonts.heading);
      if (config.fonts.body) root.style.setProperty("--font-sans", config.fonts.body);
    }

    // Cleanup
    return () => {
      // Opcional: Resetar para valores padrão ou deixar sobrescritos
      // Em SPA, geralmente queremos resetar se mudar de página, mas aqui o tema é global.
    };
  }, [theme]);

  return {
    theme,
    isLoading
  };
};
