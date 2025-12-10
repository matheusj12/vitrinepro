import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { productId } = await req.json();

    if (!productId) {
      return new Response(JSON.stringify({ error: 'Product ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get original product
    const { data: originalProduct, error: productError } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !originalProduct) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has permission
    const { data: membership } = await supabaseClient
      .from('tenant_memberships')
      .select('role')
      .eq('tenant_id', originalProduct.tenant_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role < 1) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clone product (create new one with same data but different id and slug)
    const newSlug = `${originalProduct.slug}-copia-${Date.now()}`;
    const newSku = originalProduct.sku ? `${originalProduct.sku}-COPY` : null;

    const { data: newProduct, error: insertError } = await supabaseClient
      .from('products')
      .insert({
        tenant_id: originalProduct.tenant_id,
        category_id: originalProduct.category_id,
        name: `${originalProduct.name} (Cópia)`,
        slug: newSlug,
        sku: newSku,
        description: originalProduct.description,
        price: originalProduct.price,
        min_quantity: originalProduct.min_quantity,
        image_url: originalProduct.image_url,
        featured: false,
        active: false, // Clone starts inactive
        stock_control_enabled: originalProduct.stock_control_enabled,
        stock_quantity: 0, // Start with 0 stock
      })
      .select()
      .single();

    if (insertError || !newProduct) {
      throw insertError || new Error('Failed to create cloned product');
    }

    // Clone product images
    const { data: images } = await supabaseClient
      .from('product_images')
      .select('*')
      .eq('product_id', productId);

    if (images && images.length > 0) {
      const newImages = images.map((img: any) => ({
        product_id: newProduct.id,
        url: img.url,
        position: img.position,
      }));

      await supabaseClient.from('product_images').insert(newImages);
    }

    // Clone product variations
    const { data: variations } = await supabaseClient
      .from('product_variations')
      .select('*')
      .eq('product_id', productId);

    if (variations && variations.length > 0) {
      const newVariations = variations.map((variation: any) => ({
        product_id: newProduct.id,
        variation_type: variation.variation_type,
        variation_value: variation.variation_value,
        price_adjustment: variation.price_adjustment,
        sku_suffix: variation.sku_suffix,
        stock_quantity: 0, // Start with 0 stock
        active: variation.active,
      }));

      await supabaseClient.from('product_variations').insert(newVariations);
    }

    console.log(`Product ${productId} cloned to ${newProduct.id} by user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        originalProductId: productId,
        newProduct: newProduct 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
