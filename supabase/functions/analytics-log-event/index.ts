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

    const { tenantId, eventType, productId, meta } = await req.json();

    if (!tenantId || !eventType) {
      return new Response(
        JSON.stringify({ error: 'tenantId e eventType são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar eventType
    const validEvents = ['page_view', 'product_view', 'whatsapp_click', 'quote_created'];
    if (!validEvents.includes(eventType)) {
      return new Response(
        JSON.stringify({ error: 'eventType inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Capturar IP e user-agent
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Inserir evento
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        tenant_id: tenantId,
        event_type: eventType,
        product_id: productId || null,
        meta: meta || {},
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (error) {
      console.error('Erro ao inserir evento:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Evento registrado:', { tenantId, eventType, productId });

    return new Response(
      JSON.stringify({ success: true, message: 'Evento registrado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no analytics-log-event:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});