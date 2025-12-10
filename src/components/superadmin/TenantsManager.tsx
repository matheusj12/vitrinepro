import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Ban, CheckCircle, Trash2, RefreshCw } from "lucide-react";

interface Tenant {
  id: string;
  company_name: string;
  slug: string;
  email: string;
  active: boolean;
  subscription_status: string;
  subscriptions?: {
    plans: {
      name: string;
    };
  };
}

export const TenantsManager = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-tenants');
      if (error) throw error;
      setTenants(data.tenants || []);
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
      toast.error('Erro ao carregar tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (tenantId: string, action: string, extraData?: any) => {
    setActionLoading(tenantId);
    try {
      const url = new URL(window.location.origin);
      url.searchParams.set('tenantId', tenantId);
      
      const { error } = await supabase.functions.invoke(`superadmin-tenants?tenantId=${tenantId}`, {
        method: 'PUT',
        body: { action, ...extraData }
      });
      
      if (error) throw error;
      
      toast.success(`Ação "${action}" executada com sucesso`);
      loadTenants();
    } catch (error: any) {
      console.error('Erro ao executar ação:', error);
      toast.error(error.message || 'Erro ao executar ação');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (tenantId: string, companyName: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${companyName}"? Esta ação é irreversível e removerá TODOS os dados relacionados.`)) {
      return;
    }

    setActionLoading(tenantId);
    try {
      const { error } = await supabase.functions.invoke(`superadmin-tenants?tenantId=${tenantId}`, {
        method: 'DELETE'
      });
      
      if (error) throw error;
      
      toast.success('Tenant deletado com sucesso');
      loadTenants();
    } catch (error: any) {
      console.error('Erro ao deletar tenant:', error);
      toast.error(error.message || 'Erro ao deletar tenant');
    } finally {
      setActionLoading(null);
    }
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
      {tenants.map((tenant) => (
        <Card key={tenant.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{tenant.company_name}</CardTitle>
                <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
                <p className="text-sm text-muted-foreground">{tenant.email}</p>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`text-xs px-2 py-1 rounded ${tenant.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {tenant.active ? 'Ativo' : 'Suspenso'}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                  {tenant.subscriptions?.plans?.name || 'Sem plano'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {tenant.active ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(tenant.id, 'suspend')}
                  disabled={actionLoading === tenant.id}
                >
                  {actionLoading === tenant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4 mr-1" />}
                  Suspender
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(tenant.id, 'reactivate')}
                  disabled={actionLoading === tenant.id}
                >
                  {actionLoading === tenant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Reativar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSlug = prompt('Novo slug:', tenant.slug);
                  if (newSlug) handleAction(tenant.id, 'regenerate_slug', { newSlug });
                }}
                disabled={actionLoading === tenant.id}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerar Slug
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(tenant.id, tenant.company_name)}
                disabled={actionLoading === tenant.id}
              >
                {actionLoading === tenant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Deletar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
