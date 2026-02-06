
import { motion } from "framer-motion";
import {
    Package,
    Tags,
    Image,
    FileText,
    ShoppingCart,
    UserCircle,
    Ticket,
    BarChart3,
    Boxes,
    FileDown,
    Palette,
    QrCode,
    Bell,
    Crown,
    Settings,
    ExternalLink,
    LogOut,
    X,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CommandPalette from "@/components/dashboard/CommandPalette";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    tenant: any;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogout: () => void;
    onCommandAction: (action: string) => void;
}

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
    { id: "plans", label: "Planos", icon: Crown },
    { id: "settings", label: "Configurações", icon: Settings },
];

const DashboardSidebar = ({
    open,
    setOpen,
    tenant,
    activeTab,
    setActiveTab,
    onLogout,
    onCommandAction
}: DashboardSidebarProps) => {
    const storeUrl = `/loja/${tenant.slug}`;

    return (
        <motion.aside
            initial={{ x: -280 }}
            animate={{ x: open ? 0 : -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-sidebar border-r border-sidebar-border z-40 flex flex-col shadow-2xl shadow-black/5"
        >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-sidebar-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-sm truncate text-sidebar-foreground">{tenant.company_name}</h2>
                            <p className="text-xs text-muted-foreground truncate">@{tenant.slug}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden text-muted-foreground hover:text-foreground"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Command Palette Trigger */}
            <div className="px-4 py-4">
                <CommandPalette
                    onNavigate={setActiveTab}
                    onAction={onCommandAction}
                    tenantSlug={tenant.slug}
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {navigationItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (window.innerWidth < 1024) setOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                                />
                            )}
                            <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                            <span className="flex-1 text-left">{item.label}</span>
                            {isActive && (
                                <ChevronRight className="h-4 w-4 ml-auto text-primary/50" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-sidebar-border space-y-2 bg-sidebar-accent/10">
                <Button
                    variant="outline"
                    className="w-full justify-start border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group"
                    onClick={() => window.open(storeUrl, '_blank')}
                >
                    <ExternalLink className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                    Ver Vitrine
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={onLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </Button>
            </div>
        </motion.aside>
    );
};

export default DashboardSidebar;
