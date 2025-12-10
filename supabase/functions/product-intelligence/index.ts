import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId');

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'tenantId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar analytics dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: analytics } = await supabase
      .from('analytics_events')
      .select('product_id, event_type')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('product_id', 'is', null);

    // Contar visualizações por produto
    const productViews = new Map<string, number>();
    analytics?.forEach(event => {
      if (event.event_type === 'product_view') {
        const count = productViews.get(event.product_id!) || 0;
        productViews.set(event.product_id!, count + 1);
      }
    });

    // Determinar threshold para "Popular" (top 20% de visualizações)
    const viewCounts = Array.from(productViews.values()).sort((a, b) => b - a);
    const popularThreshold = viewCounts[Math.floor(viewCounts.length * 0.2)] || 5;

    // Identificar produtos populares
    const popularProducts = Array.from(productViews.entries())
      .filter(([_, views]) => views >= popularThreshold)
      .map(([productId]) => productId);

    // Buscar produtos em orçamentos (mais procurados)
    const { data: quoteItems } = await supabase
      .from('quote_items')
      .select(`
        product_id,
        quotes!inner(tenant_id)
      `)
      .eq('quotes.tenant_id', tenantId)
      .not('product_id', 'is', null);

    const mostQuotedProducts = new Map<string, number>();
    quoteItems?.forEach(item => {
      const count = mostQuotedProducts.get(item.product_id!) || 0;
      mostQuotedProducts.set(item.product_id!, count + 1);
    });

    const topQuoted = Array.from(mostQuotedProducts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([productId]) => productId);

    return new Response(
      JSON.stringify({
        popular_products: popularProducts,
        most_quoted_products: topQuoted,
        stats: {
          total_views: Array.from(productViews.values()).reduce((a, b) => a + b, 0),
          total_quotes: Array.from(mostQuotedProducts.values()).reduce((a, b) => a + b, 0),
          popular_threshold: popularThreshold
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em product-intelligence:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
