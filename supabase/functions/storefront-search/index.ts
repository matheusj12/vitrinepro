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
    const query = url.searchParams.get('q');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');

    if (!slug || !query) {
      return new Response(
        JSON.stringify({ error: 'slug e q (query) são obrigatórios' }),
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

    // Buscar produtos por nome, SKU ou descrição
    const offset = (page - 1) * limit;
    const searchPattern = `%${query}%`;

    const { data: products, error: productsError, count } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `, { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .eq('active', true)
      .or(`name.ilike.${searchPattern},sku.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productsError) {
      throw productsError;
    }

    // Logar evento de busca no analytics
    await supabase
      .from('analytics_events')
      .insert({
        tenant_id: tenant.id,
        event_type: 'search',
        meta: { query, results_count: products.length }
      });

    const totalPages = Math.ceil((count || 0) / limit);

    return new Response(
      JSON.stringify({
        products,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em storefront-search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});