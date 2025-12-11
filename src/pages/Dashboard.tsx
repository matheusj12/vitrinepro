import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useEnsureTenant } from "@/hooks/useEnsureTenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import CommandPalette from "@/components/dashboard/CommandPalette";
import CouponsManager from "@/components/dashboard/CouponsManager";
import CustomersManager from "@/components/dashboard/CustomersManager";
import OrdersManager from "@/components/dashboard/OrdersManager";
import CatalogExport from "@/components/dashboard/CatalogExport";
import StockManager from "@/components/dashboard/StockManager";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Loader2,
  Package,
  Tags,
  Image,
  FileText,
  BarChart3,
  Palette,
  Bell,
  Settings,
  ExternalLink,
  Copy,
  LogOut,
  Menu,
  X,
  QrCode,
  Plus,
  Moon,
  Sun,
  ChevronRight,
  TrendingUp,
  Users,
  ShoppingCart,
  Eye,
  Ticket,
  UserCircle,
  FileDown,
  Boxes
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
  const [showQRCode, setShowQRCode] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [copied, setCopied] = useState(false);

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
        // Could trigger new product modal here
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

  // Estado de loading (auth, tenant loading ou criação de tenant)
  if (authLoading || tenantLoading || isCreatingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur-xl opacity-20 animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin text-violet-600 mx-auto mb-4 relative" />
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao criar sua loja</CardTitle>
          </CardHeader>
          <CardContent>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Configurando sua loja...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
              <p className="text-muted-foreground">Aguarde enquanto preparamos tudo para você.</p>
            </div>
            <Button onClick={() => refetchTenant()} className="w-full">
              Verificar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { tenant } = tenantData;
  const storeUrl = `/loja/${tenant.slug}`;

  const navigationItems = [
    { id: "products", label: "Produtos", icon: Package },
    { id: "categories", label: "Categorias", icon: Tags },
    { id: "banners", label: "Banners", icon: Image },
    { id: "quotes", label: "Orçamentos", icon: FileText },
    { id: "orders", label: "Pedidos", icon: ShoppingCart },
    { id: "customers", label: "Clientes", icon: UserCircle },
    { id: "coupons", label: "Cupons", icon: Ticket },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "stock", label: "Estoque", icon: Boxes },
    { id: "catalog", label: "Catálogo PDF", icon: FileDown },
    { id: "themes", label: "Aparência", icon: Palette },
    { id: "qrcode", label: "QR Code", icon: QrCode },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  // Mock stats - in production, fetch from analytics
  const stats = [
    { label: "Visitas Hoje", value: "127", icon: Eye, change: "+12%", positive: true },
    { label: "Orçamentos", value: "8", icon: ShoppingCart, change: "+3", positive: true },
    { label: "Conversão", value: "6.3%", icon: TrendingUp, change: "+0.5%", positive: true },
    { label: "Produtos Ativos", value: "24", icon: Package, change: "", positive: true },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          tenantId={tenant.id}
          tenantName={tenant.company_name}
          onComplete={handleOnboardingComplete}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="fixed left-0 top-0 bottom-0 w-[280px] bg-card border-r z-40 flex flex-col"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-sm truncate">{tenant.company_name}</h2>
                <p className="text-xs text-muted-foreground truncate">@{tenant.slug}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Command Palette Trigger */}
        <div className="p-4 border-b">
          <CommandPalette
            onNavigate={setActiveTab}
            onAction={handleCommandAction}
            tenantSlug={tenant.slug}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${activeTab === item.id
                ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {activeTab === item.id && (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => window.open(storeUrl, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver Vitrine
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-[280px]' : ''}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-bold text-lg">
                  {navigationItems.find(item => item.id === activeTab)?.label || "Dashboard"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDark(!isDark)}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? <Copy className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar Link"}
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                onClick={() => window.open(storeUrl, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver Vitrine
              </Button>
            </div>
          </div>
        </header>

        {/* Stats Cards - Show on main tabs */}
        {(activeTab === "products" || activeTab === "analytics") && (
          <div className="px-4 lg:px-6 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                          <stat.icon className="h-5 w-5 text-violet-600" />
                        </div>
                        {stat.change && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.positive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'
                            }`}>
                            {stat.change}
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="px-4 lg:px-6 pb-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
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
            {activeTab === "settings" && <SettingsManager tenant={tenant} />}
          </motion.div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
