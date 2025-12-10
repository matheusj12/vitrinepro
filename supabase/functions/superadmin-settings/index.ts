// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || ''

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    // Autenticação via token (mesma estratégia dos endpoints superadmin existentes)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verificar super admin
    const { data: membership } = await supabaseAdmin
      .from('tenant_memberships')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 3) {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas super admins.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .select('id, social, updated_at')
        .limit(1)
        .maybeSingle()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true, data: data || { social: {} } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'PUT') {
      const body = await req.json()
      const social = body?.social || {}

      // Garante que exista uma linha
      const { data: existing } = await supabaseAdmin
        .from('system_settings')
        .select('id')
        .limit(1)
        .maybeSingle()

      if (!existing) {
        const { error: insErr } = await supabaseAdmin
          .from('system_settings')
          .insert({ social })
        if (insErr) {
          return new Response(JSON.stringify({ error: insErr.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } else {
        const { error: updErr } = await supabaseAdmin
          .from('system_settings')
          .update({ social })
          .eq('id', existing.id)
        if (updErr) {
          return new Response(JSON.stringify({ error: updErr.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('superadmin-settings error:', error)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})