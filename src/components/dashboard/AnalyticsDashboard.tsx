import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, ShoppingBag, MessageCircle, FileText, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AnalyticsDashboardProps {
  tenantId: string;
}

const AnalyticsDashboard = ({ tenantId }: AnalyticsDashboardProps) => {
  const [period, setPeriod] = useState<7 | 30 | 90>(7);

  // Calcular data de início
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);

  const ANALYTICS_STALE = 5 * 60 * 1000; // 5 min — analytics não muda a cada segundo

  // Visitas à vitrine
  const { data: viewsData, isLoading: viewsLoading, error: viewsError } = useQuery({
    queryKey: ["analytics-views", tenantId, period],
    staleTime: ANALYTICS_STALE,
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
    staleTime: ANALYTICS_STALE,
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
    staleTime: ANALYTICS_STALE,
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
    staleTime: ANALYTICS_STALE,
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

  // Visitas por dia (para gráfico)
  const { data: dailyViewsData = [] } = useQuery({
    queryKey: ["analytics-daily", tenantId, period],
    staleTime: ANALYTICS_STALE,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("analytics_events")
          .select("event_type, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true });

        if (error || !data) return [];

        // Agrupa por dia
        const byDay: Record<string, { visitas: number; produtos: number; whatsapp: number }> = {};
        data.forEach((e) => {
          const day = new Date(e.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
          if (!byDay[day]) byDay[day] = { visitas: 0, produtos: 0, whatsapp: 0 };
          if (e.event_type === "page_view") byDay[day].visitas++;
          if (e.event_type === "product_view") byDay[day].produtos++;
          if (e.event_type === "whatsapp_click") byDay[day].whatsapp++;
        });

        return Object.entries(byDay).map(([dia, vals]) => ({ dia, ...vals }));
      } catch {
        return [];
      }
    },
  });

  // Eventos recentes
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
        if (error) return [];
        return data || [];
      } catch {
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
  const conversionRate = totalViews > 0 ? (((whatsappClicks + totalQuotes) / totalViews) * 100).toFixed(1) : "0";

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
          {([7, 30, 90] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p} dias
            </Button>
          ))}
        </div>
      </div>

      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Houve um problema ao carregar alguns dados. Os valores podem estar incompletos.
          </AlertDescription>
        </Alert>
      )}

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
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas à Vitrine</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalViews.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">Últimos {period} dias</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Vistos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProductViews.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">Visualizações de produtos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques WhatsApp</CardTitle>
            <MessageCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{whatsappClicks.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">Interesse em contato</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Engajamento</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Visitas → Ação (WhatsApp + Orçamento)</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de visitas diárias */}
      {dailyViewsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Visitas por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyViewsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Line type="monotone" dataKey="visitas" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Visitas" />
                <Line type="monotone" dataKey="produtos" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Produtos" />
                <Line type="monotone" dataKey="whatsapp" stroke="#22c55e" strokeWidth={2} dot={false} name="WhatsApp" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground justify-center">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" /> Visitas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 inline-block" /> Produtos</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> WhatsApp</span>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Funil de conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Visitantes → Cliques WhatsApp</span>
                <span className="text-sm font-bold">
                  {totalViews > 0 ? ((whatsappClicks / totalViews) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalViews > 0 ? Math.min((whatsappClicks / totalViews) * 100, 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Visitantes → Orçamentos</span>
                <span className="text-sm font-bold">
                  {totalViews > 0 ? ((totalQuotes / totalViews) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalViews > 0 ? Math.min((totalQuotes / totalViews) * 100, 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Visitas na Vitrine → Produtos Vistos</span>
                <span className="text-sm font-bold">
                  {totalViews > 0 ? ((totalProductViews / totalViews) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalViews > 0 ? Math.min((totalProductViews / totalViews) * 100, 100) : 0}%` }} />
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
                <div key={event.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    {event.event_type === "page_view" && <Eye className="h-4 w-4 text-blue-500" />}
                    {event.event_type === "product_view" && <ShoppingBag className="h-4 w-4 text-purple-500" />}
                    {event.event_type === "whatsapp_click" && <MessageCircle className="h-4 w-4 text-green-500" />}
                    {event.event_type === "quote_created" && <FileText className="h-4 w-4 text-orange-500" />}
                    <span className="font-medium capitalize">{event.event_type.replace(/_/g, " ")}</span>
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
