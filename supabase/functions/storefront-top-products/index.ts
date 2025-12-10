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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'slug é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar tenant pelo slug
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular produtos mais populares baseado em analytics
    const { data: analytics } = await supabase
      .from('analytics_events')
      .select('product_id')
      .eq('tenant_id', tenant.id)
      .in('event_type', ['product_view', 'whatsapp_click'])
      .not('product_id', 'is', null);

    // Contar ocorrências de cada produto
    const productCounts = new Map<string, number>();
    analytics?.forEach(event => {
      const count = productCounts.get(event.product_id!) || 0;
      productCounts.set(event.product_id!, count + 1);
    });

    // Buscar produtos em orçamentos
    const { data: quoteItems } = await supabase
      .from('quote_items')
      .select(`
        product_id,
        quotes!inner(tenant_id)
      `)
      .eq('quotes.tenant_id', tenant.id)
      .not('product_id', 'is', null);

    // Adicionar peso maior para produtos em orçamentos
    quoteItems?.forEach(item => {
      const count = productCounts.get(item.product_id!) || 0;
      productCounts.set(item.product_id!, count + 3); // Peso 3x para orçamentos
    });

    // Ordenar produtos por popularidade
    const sortedProducts = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => productId);

    if (sortedProducts.length === 0) {
      // Se não há dados de analytics, retornar produtos em destaque
      const { data: featuredProducts } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('active', true)
        .eq('featured', true)
        .limit(limit);

      return new Response(
        JSON.stringify({ products: featuredProducts || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar detalhes dos produtos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('tenant_id', tenant.id)
      .eq('active', true)
      .in('id', sortedProducts);

    if (productsError) {
      throw productsError;
    }

    // Ordenar produtos de acordo com a ordem de popularidade
    const orderedProducts = sortedProducts
      .map(id => products?.find(p => p.id === id))
      .filter(p => p !== undefined);

    return new Response(
      JSON.stringify({ products: orderedProducts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em storefront-top-products:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});