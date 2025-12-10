import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, ShoppingBag, FileText, Activity, Settings } from "lucide-react";
import UsersManager from "@/components/superadmin/UsersManager";
import { LogsViewer } from "@/components/superadmin/LogsViewer";
import PlansManager from "@/components/superadmin/PlansManager";
import SystemSettings from "@/components/superadmin/SystemSettings";

interface DashboardData {
  metrics: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    totalProducts: number;
    totalQuotes: number;
    totalUsers: number;
  };
  subscriptionsByStatus: Record<string, number>;
  recentTenants: any[];
}

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading } = useSuperAdmin();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && isSuperAdmin) {
      loadDashboard();
    }
  }, [loading, isSuperAdmin]);

  const loadDashboard = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-dashboard');
      
      if (error) throw error;
      
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout");
    } else {
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Super Admin</h1>
            <p className="text-sm text-muted-foreground">Painel de controle do sistema</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-4 overflow-x-auto flex-nowrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" />Configurações</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard?.metrics.totalTenants || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboard?.metrics.activeTenants || 0} ativos, {dashboard?.metrics.suspendedTenants || 0} suspensos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Produtos</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard?.metrics.totalProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">Em todas as lojas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orçamentos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard?.metrics.totalQuotes || 0}</div>
                  <p className="text-xs text-muted-foreground">Solicitações recebidas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard?.metrics.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Contas cadastradas</p>
                </CardContent>
              </Card>
            </div>

            {dashboard?.subscriptionsByStatus && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Subscriptions por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(dashboard.subscriptionsByStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{status}</span>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Tenants Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.recentTenants.map((tenant) => (
                    <div key={tenant.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{tenant.company_name}</p>
                        <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded ${tenant.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {tenant.active ? 'Ativo' : 'Suspenso'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{tenant.subscription_status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <UsersManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Planos</CardTitle>
              </CardHeader>
              <CardContent>
                <PlansManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Auditoria</CardTitle>
              </CardHeader>
              <CardContent>
                <LogsViewer />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SuperAdmin;