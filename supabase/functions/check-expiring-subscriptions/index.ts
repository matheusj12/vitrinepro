import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

interface ExpiringSubscription {
  tenant_id: string;
  company_name: string;
  email: string;
  trial_ends_at: string;
  days_remaining: number;
  plan_name: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Iniciando verificação de assinaturas expirando...');

    // Buscar subscriptions que estão próximas de expirar
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select(`
        tenant_id,
        trial_ends_at,
        status,
        plan_id,
        plans (
          name,
          slug
        )
      `)
      .not('trial_ends_at', 'is', null)
      .lte('trial_ends_at', sevenDaysFromNow.toISOString())
      .gte('trial_ends_at', now.toISOString())
      .in('status', ['trial', 'active']);

    if (subsError) {
      console.error('Erro ao buscar subscriptions:', subsError);
      throw subsError;
    }

    console.log(`📊 Encontradas ${subscriptions?.length || 0} subscriptions próximas de expirar`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma assinatura próxima de expirar', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados dos tenants
    const tenantIds = subscriptions.map(s => s.tenant_id);
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, company_name, email')
      .in('id', tenantIds)
      .eq('active', true);

    if (tenantsError) {
      console.error('Erro ao buscar tenants:', tenantsError);
      throw tenantsError;
    }

    // Processar cada assinatura
    const emailsSent: string[] = [];
    const emailsSkipped: string[] = [];

    for (const sub of subscriptions) {
      const tenant = tenants?.find(t => t.id === sub.tenant_id);
      if (!tenant || !tenant.email) {
        console.log(`⚠️ Tenant ${sub.tenant_id} sem email configurado`);
        continue;
      }

      const expiryDate = new Date(sub.trial_ends_at);
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Determinar tipo de notificação baseado nos dias restantes
      let notificationType: string | null = null;
      if (daysRemaining === 7) notificationType = 'expiry_warning_7';
      else if (daysRemaining === 3) notificationType = 'expiry_warning_3';
      else if (daysRemaining === 1) notificationType = 'expiry_warning_1';

      if (!notificationType) {
        console.log(`⏭️ Ignorando tenant ${tenant.company_name} (${daysRemaining} dias restantes)`);
        continue;
      }

      // Verificar se já enviamos este tipo de notificação
      const { data: alreadySent } = await supabase
        .from('email_notifications_sent')
        .select('id')
        .eq('tenant_id', sub.tenant_id)
        .eq('notification_type', notificationType)
        .eq('expiry_date', sub.trial_ends_at)
        .single();

      if (alreadySent) {
        console.log(`✅ Email ${notificationType} já enviado para ${tenant.company_name}`);
        emailsSkipped.push(tenant.email);
        continue;
      }

      // Enviar email
      try {
        const emailHtml = generateExpiryEmailHtml(
          tenant.company_name,
          daysRemaining,
          (sub.plans as any)?.name || 'Seu plano',
          tenant.id
        );

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Vitrine Digital <onboarding@resend.dev>',
            to: [tenant.email],
            subject: daysRemaining === 1 
              ? '⚠️ Seu acesso expira AMANHÃ!' 
              : `⏰ Seu acesso expira em ${daysRemaining} dias`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error(`❌ Erro ao enviar email para ${tenant.email}:`, errorData);
          continue;
        }

        const emailResult = await emailResponse.json();
        console.log('📧 Email enviado:', emailResult);

        // Registrar envio
        await supabase
          .from('email_notifications_sent')
          .insert({
            tenant_id: sub.tenant_id,
            user_email: tenant.email,
            notification_type: notificationType,
            days_before_expiry: daysRemaining,
            expiry_date: sub.trial_ends_at,
          });

        console.log(`📧 Email enviado para ${tenant.company_name} (${tenant.email}) - ${daysRemaining} dias`);
        emailsSent.push(tenant.email);

        // Registrar log administrativo
        await supabase
          .from('admin_logs')
          .insert({
            action: 'email_notification_sent',
            tenant_id: sub.tenant_id,
            meta: {
              notification_type: notificationType,
              days_remaining: daysRemaining,
              recipient: tenant.email,
              timestamp: new Date().toISOString(),
            }
          });

      } catch (error) {
        console.error(`❌ Erro ao processar ${tenant.company_name}:`, error);
      }
    }

    const summary = {
      checked: subscriptions.length,
      sent: emailsSent.length,
      skipped: emailsSkipped.length,
      emails_sent: emailsSent,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Verificação concluída:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateExpiryEmailHtml(
  companyName: string,
  daysRemaining: number,
  planName: string,
  tenantId: string
): string {
  const urgencyColor = daysRemaining === 1 ? '#dc2626' : daysRemaining === 3 ? '#ea580c' : '#f59e0b';
  const urgencyEmoji = daysRemaining === 1 ? '🚨' : daysRemaining === 3 ? '⚠️' : '⏰';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seu acesso está expirando</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
              ${urgencyEmoji} Atenção ${companyName}
            </h1>
          </div>

          <!-- Main Content -->
          <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Urgency Banner -->
            <div style="background-color: ${urgencyColor}; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0; font-size: 24px; font-weight: bold;">
                Seu acesso expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}
              </h2>
            </div>

            <!-- Message -->
            <div style="color: #374151; line-height: 1.6;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Olá, ${companyName}!
              </p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                ${daysRemaining === 1 
                  ? 'Seu período de teste termina <strong>AMANHÃ</strong>! Após a expiração, sua vitrine ficará indisponível para seus clientes.' 
                  : `Seu plano <strong>${planName}</strong> expira em apenas <strong>${daysRemaining} dias</strong>. Não perca o acesso à sua vitrine digital!`
                }
              </p>

              <p style="font-size: 16px; margin-bottom: 30px;">
                Para continuar aproveitando todos os recursos e manter sua loja online ativa, renove seu plano agora mesmo.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://sql-buddy-unlocked.lovable.app/dashboard" 
                   style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                  Renovar Agora
                </a>
              </div>

              <!-- Benefits Reminder -->
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <h3 style="color: #111827; font-size: 18px; margin-top: 0; margin-bottom: 15px;">
                  🎯 O que você vai perder se não renovar:
                </h3>
                <ul style="color: #4b5563; padding-left: 20px; margin: 0;">
                  <li style="margin-bottom: 8px;">Sua vitrine ficará offline para clientes</li>
                  <li style="margin-bottom: 8px;">Orçamentos pendentes não poderão ser concluídos</li>
                  <li style="margin-bottom: 8px;">Acesso ao painel administrativo bloqueado</li>
                  <li style="margin-bottom: 8px;">Perda de histórico e analytics</li>
                </ul>
              </div>
            </div>

            <!-- Support -->
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p style="margin-bottom: 10px;">
                Precisa de ajuda? Entre em contato com nosso suporte.
              </p>
              <p style="margin: 0;">
                <strong>Vitrine Digital</strong> - Sua loja online profissional
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 5px 0;">
              © ${new Date().getFullYear()} Vitrine Digital. Todos os direitos reservados.
            </p>
            <p style="margin: 5px 0;">
              Você está recebendo este email porque sua assinatura está próxima de expirar.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
