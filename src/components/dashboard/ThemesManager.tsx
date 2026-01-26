
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Undo2, AlertCircle, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface ThemeConfig {
  colors?: Record<string, string>;
  productCard?: {
    radius?: string;
    shadow?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
}

interface Theme {
  id: string;
  tenant_id: string | null;
  name: string;
  description: string | null;
  config: ThemeConfig;
  is_premium: boolean;
  is_active: boolean;
  thumbnail_url: string | null;
  is_allowed: boolean;
}

interface ThemesManagerProps {
  tenantId: string;
}

// Componente visual para pré-visualizar o tema com CSS real
const ThemePreview = ({ theme, isActive }: { theme: Theme; isActive: boolean }) => {
  const colors = theme.config?.colors || {};
  const radius = theme.config?.productCard?.radius || "0.5rem";

  const getColor = (name: string, fallback: string) => {
    let val = colors[name];
    if (!val) return fallback;
    if (!val.startsWith("#") && !val.startsWith("hsl") && !val.startsWith("rgb")) {
      return `hsl(${val})`;
    }
    return val;
  };

  const bg = getColor("background", "#ffffff");
  const fg = getColor("foreground", "#000000");
  const primary = getColor("primary", "#000000");
  const primaryFg = getColor("primary-foreground", "#ffffff");
  const cardBg = getColor("card", "#ffffff");
  const border = getColor("border", "#e5e7eb");

  return (
    <div
      className="relative w-full h-40 overflow-hidden border-b"
      style={{ backgroundColor: bg }}
    >
      <div className="absolute inset-0 flex flex-col p-4 gap-3 opacity-90 transition-transform group-hover:scale-105 duration-500">
        <div className="flex items-center justify-between">
          <div className="w-16 h-4 rounded" style={{ backgroundColor: fg, opacity: 0.8 }}></div>
          <div className="flex gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: border }}></div>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primary }}></div>
          </div>
        </div>

        <div
          className="w-full h-12 rounded flex items-center justify-center"
          style={{
            backgroundColor: primary,
            color: primaryFg,
            borderRadius: radius,
            boxShadow: theme.config?.productCard?.shadow || 'none'
          }}
        >
          <span className="text-[10px] font-bold opacity-80" style={{ fontFamily: theme.config?.fonts?.heading }}>
            {theme.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {[1, 2].map(i => (
            <div
              key={i}
              className="p-2 border"
              style={{
                backgroundColor: cardBg,
                borderColor: border,
                borderRadius: radius
              }}
            >
              <div className="w-full h-6 bg-black/5 rounded mb-2"></div>
              <div className="w-10 h-2 bg-black/10 rounded mb-1"></div>
              <div className="w-6 h-2" style={{ backgroundColor: primary }}></div>
            </div>
          ))}
        </div>
      </div>

      {isActive && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg">
            <Check className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        </div>
      )}
    </div>
  );
};

const ThemesManager = ({ tenantId }: ThemesManagerProps) => {
  const queryClient = useQueryClient();
  const [canRevert, setCanRevert] = useState(false);

  const { data: themesResponse, error: themesError, isLoading: themesLoading } = useQuery({
    queryKey: ["themes-list"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("themes-list");
      // Se falhar a function, tenta buscar direto do banco (fallback)
      if (error) {
        console.warn("Function falhou, buscando direto do banco", error);
        const { data: dbThemes, error: dbError } = await supabase.from("themes").select("*").eq("active", true);
        if (dbError) throw dbError;
        return dbThemes;
      }
      return data?.data || [];
    },
  });

  const { data: currentTenant, error: tenantError } = useQuery({
    queryKey: ["tenant-theme", tenantId],
    queryFn: async () => {
      // Prioriza store_settings
      const { data, error } = await supabase
        .from("store_settings")
        .select("theme_id")
        .eq("tenant_id", tenantId)
        .single();

      const { data: legacyTenant } = await supabase
        .from("tenants")
        .select("selected_theme_id, previous_theme_id")
        .eq("id", tenantId)
        .single();

      if (error && !legacyTenant) return null;

      return {
        selected_theme_id: data?.theme_id || legacyTenant?.selected_theme_id,
        previous_theme_id: legacyTenant?.previous_theme_id
      };
    },
    // Atualizar frequente para detectar mudanças
    refetchInterval: 2000
  });

  useEffect(() => {
    setCanRevert(!!currentTenant?.previous_theme_id);
  }, [currentTenant]);

  // CORREÇÃO: Atualização direta no banco de dados (ignorando Edge Function quebrada)
  const applyMutation = useMutation({
    mutationFn: async ({ themeId }: { themeId: string }) => {
      console.log("Aplicando tema:", themeId);

      // 1. Atualizar store_settings
      const { error: sError } = await supabase
        .from("store_settings")
        .update({ theme_id: themeId })
        .eq("tenant_id", tenantId);

      if (sError) throw sError;

      // 2. Atualizar tenants (legado)
      await supabase
        .from("tenants")
        .update({ selected_theme_id: themeId })
        .eq("id", tenantId);

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Tema aplicado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tenant-theme"] });
      queryClient.invalidateQueries({ queryKey: ["selected-theme"] });
      // Reload sutil se necessário, mas o invalidate deve bastar
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar tema: " + error.message);
    },
  });

  const revertMutation = useMutation({
    mutationFn: async () => {
      if (!currentTenant?.previous_theme_id) return;
      const previousId = currentTenant.previous_theme_id;

      await supabase.from("store_settings").update({ theme_id: previousId }).eq("tenant_id", tenantId);
      await supabase.from("tenants").update({ selected_theme_id: previousId }).eq("id", tenantId);
    },
    onSuccess: () => {
      toast.success("Tema revertido!");
      queryClient.invalidateQueries({ queryKey: ["tenant-theme"] });
      queryClient.invalidateQueries({ queryKey: ["selected-theme"] });
      setCanRevert(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao reverter tema");
    },
  });

  const handleApply = (theme: Theme) => {
    applyMutation.mutate({ themeId: theme.id });
  };

  const handleRevert = () => {
    if (confirm("Reverter para o tema anterior?")) {
      revertMutation.mutate();
    }
  };

  const currentThemeId = currentTenant?.selected_theme_id;

  if (themesError || tenantError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar temas. Recarregue a página.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Galeria de Temas</h2>
          <p className="text-muted-foreground mt-1">
            Personalize a identidade visual da sua loja com um clique.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open(`/loja/${window.location.pathname.split('/')[2] || ''}`, '_blank')}
          >
            <Eye className="w-4 h-4" />
            Ver Loja
          </Button>
          {canRevert && (
            <Button
              variant="secondary"
              onClick={handleRevert}
              disabled={revertMutation.isPending}
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Desfazer
            </Button>
          )}
        </div>
      </div>

      <div>
        {themesLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {((themesResponse as any) || []).map((theme: Theme) => {
              const isSelected = currentThemeId === theme.id;
              const colors = theme.config?.colors || {};
              const palette = [colors.background, colors.primary, colors.accent].filter(Boolean);

              return (
                <Card
                  key={theme.id}
                  className={`group overflow-hidden transition-all duration-300 border-2 ${isSelected
                      ? "border-primary shadow-xl ring-2 ring-primary/20 scale-[1.02]"
                      : "border-transparent hover:border-border hover:shadow-lg"
                    }`}
                >
                  <ThemePreview theme={theme} isActive={isSelected} />

                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg">{theme.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">
                          {theme.description || "Um tema moderno e profissional para sua loja."}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 mb-5 mt-3">
                      {palette.map((c, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: !c?.startsWith('#') && !c?.startsWith('hsl') ? `hsl(${c})` : c }}
                        />
                      ))}
                    </div>

                    <Button
                      className={`w-full font-medium transition-all ${isSelected ? 'bg-primary/90' : ''}`}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleApply(theme)}
                      disabled={isSelected || applyMutation.isPending}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Tema Ativo
                        </>
                      ) : (
                        "Ativar Tema"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-700 text-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>
          Dica: Ao trocar de tema, a vitrine será atualizada imediatamente. Se não ver a mudança, atualize a página da loja.
        </p>
      </div>
    </div>
  );
};

export default ThemesManager;
