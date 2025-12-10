import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  variables?: Record<string, string>;
}

export const useTheme = (tenantId?: string) => {
  const { data: theme, isLoading } = useQuery({
    queryKey: ["selected-theme", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      // Buscar tema selecionado do tenant
      const { data: tenant } = await supabase
        .from("tenants")
        .select("selected_theme_id")
        .eq("id", tenantId)
        .single();

      // Se tenant não tiver tema, buscar Free Classic como padrão
      const themeId = tenant?.selected_theme_id || null;
      
      if (!themeId) {
        // Buscar tema padrão Free Classic
        const { data: defaultTheme, error: defaultError } = await supabase
          .from("themes")
          .select("*")
          .eq("slug", "free-classic")
          .single();

        if (defaultError) {
          console.error("Erro ao buscar tema padrão:", defaultError);
          return null;
        }
        return defaultTheme as Theme;
      }

      // Buscar dados do tema selecionado
      const { data: themeData, error } = await supabase
        .from("themes")
        .select("*")
        .eq("id", themeId)
        .single();

      if (error) {
        console.error("Erro ao buscar tema:", error);
        // Fallback para Free Classic
        const { data: fallbackTheme } = await supabase
          .from("themes")
          .select("*")
          .eq("slug", "free-classic")
          .single();
        return fallbackTheme as Theme;
      }
      
      return themeData as Theme;
    },
    enabled: !!tenantId,
  });

  // Aplicar CSS variables quando tema carregar
  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;

    // Aplicar cores do tema sobrescrevendo as CSS variables do design system
    if (theme.colors) {
      const colors = theme.colors as Record<string, string>;
      
      // Aplicar cada variável CSS diretamente
      Object.entries(colors).forEach(([key, value]) => {
        // Se a chave já começa com --, usar diretamente
        // Caso contrário, adicionar o prefixo --
        const cssVar = key.startsWith('--') ? key : `--${key}`;
        root.style.setProperty(cssVar, value);
      });
    }

    // Aplicar variáveis adicionais se existirem
    if (theme.variables) {
      Object.entries(theme.variables).forEach(([key, value]) => {
        const cssVar = key.startsWith('--') ? key : `--${key}`;
        root.style.setProperty(cssVar, value);
      });
    }

    // Cleanup ao desmontar
    return () => {
      if (theme.colors) {
        Object.keys(theme.colors).forEach((key) => {
          const cssVar = key.startsWith('--') ? key : `--${key}`;
          root.style.removeProperty(cssVar);
        });
      }
      if (theme.variables) {
        Object.keys(theme.variables).forEach((key) => {
          const cssVar = key.startsWith('--') ? key : `--${key}`;
          root.style.removeProperty(cssVar);
        });
      }
    };
  }, [theme]);

  return {
    theme,
    isLoading,
    applyTheme: (colors: Record<string, string>, variables?: Record<string, string>) => {
      const root = document.documentElement;
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      }
    },
    clearTheme: (colors: Record<string, string>, variables?: Record<string, string>) => {
      const root = document.documentElement;
      Object.keys(colors).forEach((key) => {
        root.style.removeProperty(key);
      });
      if (variables) {
        Object.keys(variables).forEach((key) => {
          root.style.removeProperty(key);
        });
      }
    },
  };
};
