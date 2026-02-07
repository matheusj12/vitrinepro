
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Undo2, AlertCircle, Eye, Monitor, Smartphone, Palette, LayoutTemplate } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

// Visualização aprimorada do tema
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
  const bgMuted = getColor("muted", "#f3f4f6");

  return (
    <div className="group relative w-full aspect-[4/3] overflow-hidden rounded-t-xl border-b bg-muted/20">
      {/* Mock Browser/App Interface */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundColor: bg }}
      >
        {/* Header Mock */}
        <div className="h-12 border-b flex items-center justify-between px-4" style={{ borderColor: getColor("border", "#e5e7eb") }}>
          <div className="w-20 h-3 rounded-full opacity-80" style={{ backgroundColor: fg }}></div>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full opacity-20" style={{ backgroundColor: fg }}></div>
            <div className="w-6 h-6 rounded-full opacity-20" style={{ backgroundColor: fg }}></div>
          </div>
        </div>

        {/* Hero Section Mock */}
        <div className="p-4 space-y-4">
          <div className="w-full aspect-[21/9] rounded-lg opacity-90 shadow-sm" style={{ backgroundColor: primary }}></div>

          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 space-y-2">
                <div className="w-full aspect-square rounded-md bg-black/5"></div>
                <div className="w-3/4 h-2 rounded bg-black/10"></div>
                <div className="w-1/2 h-2 rounded bg-black/10"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isActive && (
        <div className="absolute top-3 right-3 z-10 animate-in fade-in zoom-in duration-300">
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Check className="h-3 w-3 mr-1" />
            Tema Ativo
          </Badge>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
    </div>
  );
};

const ThemesManager = ({ tenantId }: ThemesManagerProps) => {
  const queryClient = useQueryClient();
  const [canRevert, setCanRevert] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);

  const { data: themesResponse, error: themesError, isLoading: themesLoading } = useQuery({
    queryKey: ["themes-list"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("themes-list");
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
    refetchInterval: 2000
  });

  useEffect(() => {
    setCanRevert(!!currentTenant?.previous_theme_id);
  }, [currentTenant]);

  const applyMutation = useMutation({
    mutationFn: async ({ themeId }: { themeId: string }) => {
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
      toast.success("Tema aplicado com sucesso! Sua vitrine foi atualizada.");
      queryClient.invalidateQueries({ queryKey: ["tenant-theme"] });
      queryClient.invalidateQueries({ queryKey: ["selected-theme"] });
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
      toast.success("Tema revertido para a versão anterior.");
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
    toast.promise(revertMutation.mutateAsync(), {
      loading: 'Revertendo tema...',
      success: 'Tema revertido com sucesso!',
      error: 'Erro ao reverter tema'
    });
  };

  const currentThemeId = currentTenant?.selected_theme_id;

  if (themesError || tenantError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Não foi possível carregar a galeria de temas. Por favor, recarregue a página.</AlertDescription>
      </Alert>
    );
  }

  const themes = (themesResponse as any) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 sm:p-6">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b">
        <div className="space-y-1">
          <h2 className="text-3xl font-heading font-bold tracking-tight">Galeria de Temas</h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Escolha o visual perfeito para sua marca. Todos os temas são otimizados para conversão e mobile-first.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {canRevert && (
            <Button
              variant="secondary"
              onClick={handleRevert}
              disabled={revertMutation.isPending}
              className="flex-1 md:flex-none"
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Desfazer Mudança
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2 flex-1 md:flex-none border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
            onClick={() => window.open(`/loja/${window.location.pathname.split('/')[2] || ''}`, '_blank')}
          >
            <Eye className="w-4 h-4" />
            Ver Minha Loja
          </Button>
        </div>
      </div>

      {/* Themes Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {themesLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden border-0 shadow-sm">
              <Skeleton className="w-full aspect-[4/3]" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </Card>
          ))
        ) : (
          themes.map((theme: Theme) => {
            const isSelected = currentThemeId === theme.id;
            const colors = theme.config?.colors || {};
            const palette = [colors.background, colors.primary, colors.accent].filter(Boolean);

            return (
              <Card
                key={theme.id}
                className={`group overflow-hidden transition-all duration-500 border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
              >
                <ThemePreview theme={theme} isActive={isSelected} />

                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
                        {theme.name}
                        {theme.is_premium && (
                          <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">Premium</Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[2.5em]">
                        {theme.description || "Um tema moderno focado em experiência do usuário e conversão."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paleta:</span>
                    <div className="flex -space-x-1.5 hover:space-x-1 transition-all">
                      {palette.map((c, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border border-white shadow-sm ring-1 ring-black/5"
                          style={{ backgroundColor: !c?.startsWith('#') && !c?.startsWith('hsl') ? `hsl(${c})` : c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className={`flex-1 font-bold h-11 transition-all ${isSelected
                          ? 'bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20'
                        }`}
                      onClick={() => handleApply(theme)}
                      disabled={isSelected || applyMutation.isPending}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Tema Atual
                        </>
                      ) : (
                        <>
                          <LayoutTemplate className="h-4 w-4 mr-2" />
                          Aplicar Tema
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex gap-3 text-blue-700 dark:text-blue-400 text-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>
          <strong>Dica Pro:</strong> Todos os temas são responsivos. Verifique sua loja no celular para ver a versão mobile otimizada.
        </p>
      </div>
    </div>
  );
};

export default ThemesManager;
