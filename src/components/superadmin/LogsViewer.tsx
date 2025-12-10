import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Log {
  id: string;
  action: string;
  created_at: string;
  meta: any;
  tenant?: {
    company_name: string;
    slug: string;
  };
}

export const LogsViewer = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-logs');
      if (error) throw error;
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      tenant_suspended: 'Tenant Suspenso',
      tenant_reactivated: 'Tenant Reativado',
      tenant_deleted: 'Tenant Deletado',
      slug_regenerated: 'Slug Regenerado',
      plan_changed: 'Plano Alterado',
      user_role_changed: 'Role de Usuário Alterado',
      user_banned: 'Usuário Banido',
      user_unbanned: 'Usuário Desbloqueado',
      password_reset: 'Senha Resetada'
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum log encontrado
          </CardContent>
        </Card>
      ) : (
        logs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm">{getActionLabel(log.action)}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                {log.tenant && (
                  <div className="text-right">
                    <p className="text-xs font-medium">{log.tenant.company_name}</p>
                    <p className="text-xs text-muted-foreground">/{log.tenant.slug}</p>
                  </div>
                )}
              </div>
            </CardHeader>
            {log.meta && Object.keys(log.meta).length > 0 && (
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(log.meta, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
};
