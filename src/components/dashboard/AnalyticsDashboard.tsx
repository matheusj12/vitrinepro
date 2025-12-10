import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, ShoppingBag, MessageCircle, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AnalyticsDashboardProps {
  tenantId: string;
}

const AnalyticsDashboard = ({ tenantId }: AnalyticsDashboardProps) => {
  const [period, setPeriod] = useState<7 | 30>(7);

  // Calcular data de início
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);

  // Visitas à vitrine
  const { data: viewsData, isLoading: viewsLoading, error: viewsError } = useQuery({
    queryKey: ["analytics-views", tenantId, period],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("analytics-reports", {
          body: { 
            type: "views",
            startDate: startDate.toISOString(),
          },
        });
        if (error) {
          console.error("Erro ao buscar views:", error);
          return { success: false, data: { total_page_views: 0 } };
        }
        return data;
      } catch (err) {
        console.error("Exceção ao buscar views:", err);
        return { success: false, data: { total_page_views: 0 } };
      }
    },
  });

  // Produtos mais vistos
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["analytics-products", tenantId, period],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("analytics-reports", {
          body: { 
            type: "products",
            startDate: startDate.toISOString(),
          },
        });
        if (error) {
          console.error("Erro ao buscar products:", error);
          return { success: false, data: { total_product_views: 0, top_products: [] } };
        }
        return data;
      } catch (err) {
        console.error("Exceção ao buscar products:", err);
        return { success: false, data: { total_product_views: 0, top_products: [] } };
      }
    },
  });

  // Cliques no WhatsApp
  const { data: whatsappData, isLoading: whatsappLoading, error: whatsappError } = useQuery({
    queryKey: ["analytics-whatsapp", tenantId, period],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("analytics-reports", {
          body: { 
            type: "whatsapp",
            startDate: startDate.toISOString(),
          },
        });
        if (error) {
          console.error("Erro ao buscar whatsapp:", error);
          return { success: false, data: { total_whatsapp_clicks: 0 } };
        }
        return data;
      } catch (err) {
        console.error("Exceção ao buscar whatsapp:", err);
        return { success: false, data: { total_whatsapp_clicks: 0 } };
      }
    },
  });

  // Orçamentos criados
  const { data: quotesData, isLoading: quotesLoading, error: quotesError } = useQuery({
    queryKey: ["analytics-quotes", tenantId, period],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("analytics-reports", {
          body: { 
            type: "quotes",
            startDate: startDate.toISOString(),
          },
        });
        if (error) {
          console.error("Erro ao buscar quotes:", error);
          return { success: false, data: { total_quotes: 0 } };
        }
        return data;
      } catch (err) {
        console.error("Exceção ao buscar quotes:", err);
        return { success: false, data: { total_quotes: 0 } };
      }
    },
  });

  // Eventos recentes para debug
  const { data: recentEvents = [] } = useQuery({
    queryKey: ["analytics-events", tenantId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("analytics_events")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) {
          console.error("Erro ao buscar eventos:", error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.error("Exceção ao buscar eventos:", err);
        return [];
      }
    },
  });

  const isLoading = viewsLoading || productsLoading || whatsappLoading || quotesLoading;
  const hasErrors = viewsError || productsError || whatsappError || quotesError;

  // Valores seguros com fallback
  const safeViewsData = viewsData?.data || { total_page_views: 0 };
  const safeProductsData = productsData?.data || { total_product_views: 0, top_products: [] };
  const safeWhatsappData = whatsappData?.data || { total_whatsapp_clicks: 0 };
  const safeQuotesData = quotesData?.data || { total_quotes: 0 };

  const totalViews = safeViewsData.total_page_views || 0;
  const totalProductViews = safeProductsData.total_product_views || 0;
  const whatsappClicks = safeWhatsappData.total_whatsapp_clicks || 0;
  const totalQuotes = safeQuotesData.total_quotes || 0;
  const topProducts = safeProductsData.top_products || [];

  const hasNoData = totalViews === 0 && totalProductViews === 0 && whatsappClicks === 0 && totalQuotes === 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="text-muted-foreground">Carregando analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics da Vitrine</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o desempenho da sua loja
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(7)}
          >
            7 dias
          </Button>
          <Button
            variant={period === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(30)}
          >
            30 dias
          </Button>
        </div>
      </div>

      {/* Alertas de erro */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Houve um problema ao carregar alguns dados. Os valores podem estar incompletos.
          </AlertDescription>
        </Alert>
      )}

      {/* Mensagem quando não há dados */}
      {hasNoData && !hasErrors && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum dado de analytics ainda. Os dados aparecerão quando sua vitrine começar a receber visitas.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas à Vitrine</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Últimos {period} dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Vistos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProductViews}</div>
            <p className="text-xs text-muted-foreground">Visualizações de produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques WhatsApp</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whatsappClicks}</div>
            <p className="text-xs text-muted-foreground">Interesse em contato</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuotes}</div>
            <p className="text-xs text-muted-foreground">Gerados no período</p>
          </CardContent>
        </Card>
      </div>

      {/* Produtos mais vistos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top 5 Produtos Mais Vistos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.slice(0, 5).map((product: any, index: number) => (
                <div key={product.product_id} className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-muted-foreground w-8">
                    #{index + 1}
                  </div>
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/default-product-512.png";
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{product.name || "Produto sem nome"}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.views} visualizações
                    </p>
                  </div>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${(product.views / (topProducts[0]?.views || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma visualização de produto registrada ainda.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Taxa de conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Visitantes → Cliques WhatsApp</span>
                <span className="text-sm font-bold">
                  {totalViews > 0 
                    ? ((whatsappClicks / totalViews) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ 
                    width: `${totalViews > 0 
                      ? ((whatsappClicks / totalViews) * 100)
                      : 0}%` 
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Visitantes → Orçamentos</span>
                <span className="text-sm font-bold">
                  {totalViews > 0 
                    ? ((totalQuotes / totalViews) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${totalViews > 0 
                      ? ((totalQuotes / totalViews) * 100)
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Últimos eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <div key={event.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div className="flex items-center gap-2">
                    {event.event_type === "page_view" && <Eye className="h-4 w-4 text-blue-500" />}
                    {event.event_type === "product_view" && <ShoppingBag className="h-4 w-4 text-purple-500" />}
                    {event.event_type === "whatsapp_click" && <MessageCircle className="h-4 w-4 text-green-500" />}
                    {event.event_type === "quote_created" && <FileText className="h-4 w-4 text-orange-500" />}
                    <span className="font-medium capitalize">{event.event_type.replace("_", " ")}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(event.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum evento registrado ainda.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
