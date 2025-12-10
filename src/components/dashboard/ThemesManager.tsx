import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Undo2, Palette, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Theme {
  id: string;
  tenant_id: string | null;
  name: string;
  description: string | null;
  colors: Record<string, string>;
  variables?: Record<string, string>;
  is_premium: boolean;
  is_active: boolean;
  thumbnail_url: string | null;
  is_allowed: boolean;
}

const DEFAULT_THEME_THUMBNAIL = "/images/themes/default-thumb.png";
const DEFAULT_COLORS = {
  "--primary": "#ff6a00",
  "--bg": "#ffffff",
  "--text": "#222222",
};

interface ThemesManagerProps {
  tenantId: string;
}

const ThemesManager = ({ tenantId }: ThemesManagerProps) => {
  const queryClient = useQueryClient();
  const [canRevert, setCanRevert] = useState(false);

  // Buscar temas disponíveis
  const { data: themesResponse, error: themesError, isLoading: themesLoading } = useQuery({
    queryKey: ["themes-list"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("themes-list");
        if (error) throw error;
        return data?.data || [];
      } catch (err) {
        console.error("Erro ao carregar temas:", err);
        return [];
      }
    },
  });

  // Buscar tema atual do tenant
  const { data: currentTenant, error: tenantError } = useQuery({
    queryKey: ["tenant-theme", tenantId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("tenants")
          .select("selected_theme_id, previous_theme_id")
          .eq("id", tenantId)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Erro ao carregar tema do tenant:", err);
        return null;
      }
    },
  });

  useEffect(() => {
    setCanRevert(!!currentTenant?.previous_theme_id);
  }, [currentTenant]);

  // Mutation para aplicar tema
  const applyMutation = useMutation({
    mutationFn: async ({ themeId }: { themeId: string }) => {
      try {
        const { data, error } = await supabase.functions.invoke("themes-apply", {
          body: { themeId, preview: false },
        });
        
        if (error) {
          console.error("Erro no edge function themes-apply:", error);
          throw new Error(error.message || "Erro ao aplicar tema");
        }
        
        if (!data || !data.success) {
          console.error("Resposta inválida do backend:", data);
          throw new Error(data?.error || "Erro ao aplicar tema");
        }
        
        return data;
      } catch (err: any) {
        console.error("Exceção ao aplicar tema:", err);
        throw err;
      }
    },
    onSuccess: () => {
      toast.success("Tema aplicado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tenant-theme"] });
      queryClient.invalidateQueries({ queryKey: ["selected-theme"] });
      queryClient.invalidateQueries({ queryKey: ["themes-list"] });
    },
    onError: (error: any) => {
      console.error("Erro na mutation:", error);
      const errorMessage = error?.message || "Erro ao aplicar tema. Tente novamente.";
      toast.error(errorMessage);
    },
  });

  // Mutation para reverter tema
  const revertMutation = useMutation({
    mutationFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("themes-revert", {
          method: "POST",
        });
        if (error) {
          console.error("Erro ao reverter tema:", error);
          throw error;
        }
        return data;
      } catch (err) {
        console.error("Exceção ao reverter tema:", err);
        throw err;
      }
    },
    onSuccess: () => {
      toast.success("Tema revertido!");
      queryClient.invalidateQueries({ queryKey: ["tenant-theme"] });
      queryClient.invalidateQueries({ queryKey: ["selected-theme"] });
      setCanRevert(false);
    },
    onError: (error: any) => {
      console.error("Erro na reversão:", error);
      toast.error(error?.message || "Erro ao reverter tema");
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

  // Normalizar temas com valores seguros
  const themes = (Array.isArray(themesResponse) ? themesResponse : []).map((theme: any) => ({
    ...theme,
    colors: theme.colors || DEFAULT_COLORS,
    thumbnail_url: theme.thumbnail_url || DEFAULT_THEME_THUMBNAIL,
    is_allowed: true, // Todos gratuitos por enquanto
  }));
  
  const currentThemeId = currentTenant?.selected_theme_id;

  // Mostrar erro se houver
  if (themesError || tenantError) {
    console.error("Erro ao carregar dados:", { themesError, tenantError });
  }

  return (
    <div className="space-y-6">
      {(themesError || tenantError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar temas. Por favor, tente recarregar a página.
            {themesError && <div className="text-xs mt-1">Temas: {String(themesError)}</div>}
            {tenantError && <div className="text-xs mt-1">Tenant: {String(tenantError)}</div>}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Aparência da Vitrine</h2>
          <p className="text-sm text-muted-foreground">
            Escolha o tema visual da sua loja online
          </p>
        </div>
        {canRevert && (
          <Button 
            variant="outline" 
            onClick={handleRevert}
            disabled={revertMutation.isPending}
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Desfazer Última Mudança
          </Button>
        )}
      </div>

      {/* Temas Gratuitos */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Temas Gratuitos
        </h3>
        {themesLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando temas...
          </div>
        ) : themes.filter((t: Theme) => !t.is_premium).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum tema gratuito disponível
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {themes
            .filter((t: Theme) => !t.is_premium)
            .map((theme: Theme) => (
              <Card
                key={theme.id}
                className={`overflow-hidden transition-all hover:shadow-lg ${
                  currentThemeId === theme.id ? "border-primary border-2" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={theme.thumbnail_url || DEFAULT_THEME_THUMBNAIL}
                    alt={theme.name}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_THEME_THUMBNAIL;
                    }}
                  />
                  {currentThemeId === theme.id && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-primary">
                        <Check className="h-3 w-3 mr-1" />
                        Atual
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-1">{theme.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {theme.description || "Tema gratuito"}
                  </p>
                  <div className="flex gap-1 mb-3">
                    {Object.values(theme.colors || DEFAULT_COLORS).slice(0, 4).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border-2 border-border"
                        style={{ backgroundColor: color || "#ccc" }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApply(theme)}
                      disabled={currentThemeId === theme.id || applyMutation.isPending}
                      className="flex-1"
                    >
                      {currentThemeId === theme.id ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Aplicado
                        </>
                      ) : (
                        "Aplicar"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>


      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>💡 Dica:</strong> Clique em "Aplicar" para trocar o tema da sua vitrine. 
            As mudanças serão visíveis imediatamente na loja online.
          </p>
          {themesLoading && (
            <p className="text-xs text-muted-foreground mt-2">
              Carregando temas disponíveis...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemesManager;
