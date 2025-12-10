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
    const authHeader = req.headers.get('Authorization');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { 
        headers: authHeader ? { Authorization: authHeader } : {} 
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const { type, startDate, endDate, tenantId: bodyTenantId } = await req.json();

    let tenantId = bodyTenantId;

    // Se tiver autenticação, buscar tenant do usuário
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!authError && user) {
        const { data: membership } = await supabase
          .from('tenant_memberships')
          .select('tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (membership) {
          tenantId = membership.tenant_id;
        }
      }
    }

    if (!tenantId) {
      console.error('Tenant não identificado', { hasAuth: !!authHeader });
      return new Response(
        JSON.stringify({ success: false, data: [], error: 'Tenant não identificado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: any = {};

    // Relatório de Views
    if (type === 'views') {
      let query = supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('event_type', 'page_view');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { count } = await query;

      result = {
        total_page_views: count || 0
      };
    }

    // Relatório de Produtos
    if (type === 'products') {
      let query = supabase
        .from('analytics_events')
        .select('product_id')
        .eq('tenant_id', tenantId)
        .eq('event_type', 'product_view');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: productViews } = await query;

      // Agrupar por produto
      const productCounts: Record<string, number> = {};
      productViews?.forEach((event) => {
        if (event.product_id) {
          productCounts[event.product_id] = (productCounts[event.product_id] || 0) + 1;
        }
      });

      // Top 10 produtos
      const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([productId, count]) => ({ product_id: productId, views: count }));

      // Buscar nomes dos produtos
      if (topProducts.length > 0) {
        const productIds = topProducts.map(p => p.product_id);
        const { data: products } = await supabase
          .from('products')
          .select('id, name, image_url')
          .in('id', productIds);

        topProducts.forEach(item => {
          const product = products?.find(p => p.id === item.product_id);
          if (product) {
            (item as any).name = product.name;
            (item as any).image_url = product.image_url;
          }
        });
      }

      result = {
        total_product_views: productViews?.length || 0,
        top_products: topProducts
      };
    }

    // Relatório de WhatsApp
    if (type === 'whatsapp') {
      let query = supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('event_type', 'whatsapp_click');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { count } = await query;

      result = {
        total_whatsapp_clicks: count || 0
      };
    }

    // Relatório de Orçamentos
    if (type === 'quotes') {
      let quotesQuery = supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if (startDate) {
        quotesQuery = quotesQuery.gte('created_at', startDate);
      }
      if (endDate) {
        quotesQuery = quotesQuery.lte('created_at', endDate);
      }

      const { count } = await quotesQuery;

      result = {
        total_quotes: count || 0
      };
    }

    console.log('Relatório gerado:', { tenant_id: tenantId, type, result });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no analytics-reports:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        data: [], 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
