
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useEnsureTenant } from "@/hooks/useEnsureTenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProductsManager from "@/components/dashboard/ProductsManager";
import CategoriesManager from "@/components/dashboard/CategoriesManager";
import QuotesManager from "@/components/dashboard/QuotesManager";
import SettingsManager from "@/components/dashboard/SettingsManager";
import BannersManager from "@/components/dashboard/BannersManager";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import NotificationsManager from "@/components/dashboard/NotificationsManager";
import ThemesManager from "@/components/dashboard/ThemesManager";
import OnboardingWizard from "@/components/dashboard/OnboardingWizard";
import QRCodeGenerator from "@/components/dashboard/QRCodeGenerator";
import CouponsManager from "@/components/dashboard/CouponsManager";
import CustomersManager from "@/components/dashboard/CustomersManager";
import OrdersManager from "@/components/dashboard/OrdersManager";
import CatalogExport from "@/components/dashboard/CatalogExport";
import StockManager from "@/components/dashboard/StockManager";
import PlansManager from "@/components/dashboard/PlansManager";
import TrialBanner from "@/components/dashboard/TrialBanner";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Package,
  TrendingUp,
  ShoppingCart,
  Eye,
  Menu,
  Sun,
  Moon,
  Copy,
  ExternalLink
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Hook para garantir que o tenant existe (cria automaticamente se não existir)
  const { tenantId: ensuredTenantId, isCreating: isCreatingTenant, error: tenantCreationError } = useEnsureTenant(user);

  // Buscar dados do tenant após garantir que ele existe
  const { data: tenantData, isLoading: tenantLoading, refetch: refetchTenant } = useTenant(user?.id);

  const [activeTab, setActiveTab] = useState("products");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dashboard Stats Realtime State
  const [statsData, setStatsData] = useState({
    visits: 0,
    quotes: 0,
    conversion: "0%",
    activeProducts: 0
  });

  // Hook de assinatura para verificar trial
  const { isTrialExpiring, isTrialExpired, daysRemaining } = useSubscription(tenantData?.tenant?.id || null);

  useEffect(() => {
    if (!authLoading && !user) {
      console.log("No user found, redirecting to auth");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Refetch tenant data quando o tenant é criado
  useEffect(() => {
    if (ensuredTenantId && !tenantData?.tenant) {
      console.log("Tenant created, refetching data...");
      refetchTenant();
    }
  }, [ensuredTenantId, tenantData?.tenant, refetchTenant]);

  // Check if first time user
  useEffect(() => {
    if (tenantData?.tenant) {
      const hasCompletedOnboarding = localStorage.getItem(`onboarding-${tenantData.tenant.id}`);
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [tenantData]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Fetch Stats Realtime Hooks
  useEffect(() => {
    const tenantId = tenantData?.tenant?.id;
    if (!tenantId) return;

    const fetchStats = async () => {
      // 1. Produtos Ativos
      try {
        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("active", true);

        // 2. Orçamentos (Quotes)
        let quotesCount = 0;
        try {
          const { count } = await supabase
            .from("quotes")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenantId);
          quotesCount = count || 0;
        } catch (e) { }

        // 3. Simulação de Visitas (Placeholder)
        let visitsCount = 0;
        try {
          const { count } = await supabase
            .from("page_views")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenantId);
          visitsCount = count || 0;
        } catch (e) { }

        const conversionRate = visitsCount > 0 ? ((quotesCount / visitsCount) * 100).toFixed(1) + "%" : "0%";

        setStatsData({
          visits: visitsCount,
          quotes: quotesCount,
          conversion: conversionRate,
          activeProducts: productsCount || 0
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();

    // Opcional: Realtime subscription
    const channel = supabase
      .channel('dashboard-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `tenant_id=eq.${tenantId}` }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantData?.tenant?.id]);


  const handleLogout = async () => {
    console.log("Logging out user:", user?.id);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      toast.error("Erro ao fazer logout");
    } else {
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    }
  };

  const handleCopyLink = async () => {
    if (!tenantData?.tenant) return;
    const url = `${window.location.origin}/loja/${tenantData.tenant.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOnboardingComplete = () => {
    if (tenantData?.tenant) {
      localStorage.setItem(`onboarding-${tenantData.tenant.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  const handleCommandAction = (action: string) => {
    switch (action) {
      case "new-product":
        setActiveTab("products");
        break;
      case "new-category":
        setActiveTab("categories");
        break;
      case "new-banner":
        setActiveTab("banners");
        break;
      case "copy-link":
        handleCopyLink();
        break;
      case "toggle-theme":
        setIsDark(!isDark);
        break;
      default:
        break;
    }
  };

  // --------------------------------------------------------------------------
  // CONDITIONAL RENDERS (Loading / Error) - MUST BE AFTER ALL HOOKS
  // --------------------------------------------------------------------------

  // Estado de loading (auth, tenant loading ou criação de tenant)
  if (authLoading || tenantLoading || isCreatingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-20 animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4 relative" />
          </div>
          <p className="text-muted-foreground font-medium">
            {isCreatingTenant ? "Criando sua loja..." : "Carregando painel..."}
          </p>
        </motion.div>
      </div>
    );
  }

  // Erro na criação do tenant
  if (tenantCreationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <h3 className="font-bold text-lg text-destructive mb-2">Erro ao criar sua loja</h3>
            <p className="text-muted-foreground mb-4">{tenantCreationError}</p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Tentar novamente
              </Button>
              <Button variant="outline" onClick={handleLogout} className="w-full">
                Sair e fazer login novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tenant ainda não carregado (pode estar ainda sendo processado)
  if (!tenantData?.tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Configurando sua loja...</p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Aguarde enquanto preparamos tudo para você.</p>
            <Button onClick={() => refetchTenant()} className="w-full">
              Verificar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderização Principal (após carregar tudo)
  const { tenant } = tenantData;
  const storeUrl = `/loja/${tenant.slug}`;

  const stats = [
    { label: "Visitas Hoje", value: statsData.visits.toString(), icon: Eye, change: "", positive: true },
    { label: "Orçamentos", value: statsData.quotes.toString(), icon: ShoppingCart, change: "", positive: true },
    { label: "Conversão", value: statsData.conversion, icon: TrendingUp, change: "", positive: true },
    { label: "Produtos Ativos", value: statsData.activeProducts.toString(), icon: Package, change: "", positive: true },
  ];

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case "products": return "Gerenciar Produtos";
      case "categories": return "Categorias";
      case "banners": return "Banners da Loja";
      case "quotes": return "Orçamentos";
      case "orders": return "Pedidos";
      case "customers": return "Clientes";
      case "coupons": return "Cupons de Desconto";
      case "analytics": return "Visão Geral";
      case "stock": return "Controle de Estoque";
      case "catalog": return "Catálogo PDF";
      case "themes": return "Aparência da Loja";
      case "qrcode": return "QR Code";
      case "notifications": return "Notificações";
      case "plans": return "Seu Plano";
      case "settings": return "Configurações";
      default: return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Trial Banner */}
      {(isTrialExpiring || isTrialExpired) && daysRemaining !== null && (
        <TrialBanner
          daysRemaining={daysRemaining}
          isExpired={isTrialExpired}
          onUpgradeClick={() => setActiveTab("plans")}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Onboarding Wizard */}
        <AnimatePresence>
          {showOnboarding && (
            <OnboardingWizard
              tenantId={tenant.id}
              tenantName={tenant.company_name}
              tenantSlug={tenant.slug}
              onComplete={handleOnboardingComplete}
              onSkip={() => {
                if (tenantData?.tenant) {
                  localStorage.setItem(`onboarding-${tenantData.tenant.id}`, 'skipped');
                }
                setShowOnboarding(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <DashboardSidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          tenant={tenant}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onCommandAction={handleCommandAction}
        />

        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-[280px]' : ''} h-screen overflow-hidden`}>
          {/* Top Header */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b h-16 shrink-0">
            <div className="flex items-center justify-between px-4 lg:px-8 h-full">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent/50"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="font-bold text-xl text-foreground/90 tracking-tight">
                    {getPageTitle(activeTab)}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-9 h-9"
                  onClick={() => setIsDark(!isDark)}
                >
                  {isDark ? <Sun className="h-5 w-5 text-orange-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
                </Button>
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                    onClick={handleCopyLink}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copiado!" : "Copiar Link"}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 border-0"
                    onClick={() => window.open(storeUrl, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver Loja
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards - Show on main tabs */}
              <AnimatePresence mode="wait">
                {(activeTab === "products" || activeTab === "analytics") && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    {stats.map((stat, idx) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm bg-white/50 dark:bg-black/20 backdrop-blur-xl group">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <stat.icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              </div>
                              {stat.change && (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.positive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'
                                  }`}>
                                  {stat.change}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Component Content */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl p-1"
              >
                {activeTab === "products" && <ProductsManager tenantId={tenant.id} />}
                {activeTab === "categories" && <CategoriesManager tenantId={tenant.id} />}
                {activeTab === "banners" && <BannersManager tenantId={tenant.id} />}
                {activeTab === "quotes" && <QuotesManager tenantId={tenant.id} />}
                {activeTab === "orders" && <OrdersManager tenantId={tenant.id} />}
                {activeTab === "customers" && <CustomersManager tenantId={tenant.id} />}
                {activeTab === "coupons" && <CouponsManager tenantId={tenant.id} />}
                {activeTab === "analytics" && <AnalyticsDashboard tenantId={tenant.id} />}
                {activeTab === "stock" && <StockManager tenantId={tenant.id} />}
                {activeTab === "catalog" && <CatalogExport tenantId={tenant.id} storeName={tenant.company_name} primaryColor={tenant.primary_color} />}
                {activeTab === "themes" && <ThemesManager tenantId={tenant.id} />}
                {activeTab === "qrcode" && <QRCodeGenerator storeUrl={storeUrl} storeName={tenant.company_name} />}
                {activeTab === "notifications" && <NotificationsManager tenantId={tenant.id} />}
                {activeTab === "plans" && <PlansManager tenantId={tenant.id} />}
                {activeTab === "settings" && <SettingsManager tenant={tenant} />}
              </motion.div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
