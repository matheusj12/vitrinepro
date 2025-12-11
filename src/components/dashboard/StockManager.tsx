import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
    Search,
    Save,
    Loader2,
    Bell,
    CheckCircle2,
    XCircle
} from "lucide-react";

interface StockManagerProps {
    tenantId: string;
}

interface ProductWithStock extends Product {
    stock_quantity?: number;
    stock_control_enabled?: boolean;
    low_stock_alert?: number;
}

const StockManager = ({ tenantId }: StockManagerProps) => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [editingStock, setEditingStock] = useState<Record<string, number>>({});
    const [editingAlert, setEditingAlert] = useState<Record<string, number>>({});

    // Fetch products with stock info
    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products-stock", tenantId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("active", true)
                .order("name");

            if (error) throw error;
            return data as ProductWithStock[];
        },
    });

    // Update stock mutation
    const updateStockMutation = useMutation({
        mutationFn: async ({
            productId,
            stock_quantity,
            low_stock_alert,
            stock_control_enabled,
        }: {
            productId: string;
            stock_quantity?: number;
            low_stock_alert?: number;
            stock_control_enabled?: boolean;
        }) => {
            const updateData: any = {};
            if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
            if (low_stock_alert !== undefined) updateData.low_stock_alert = low_stock_alert;
            if (stock_control_enabled !== undefined) updateData.stock_control_enabled = stock_control_enabled;

            const { error } = await supabase
                .from("products")
                .update(updateData)
                .eq("id", productId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products-stock", tenantId] });
            toast.success("Estoque atualizado!");
        },
        onError: () => {
            toast.error("Erro ao atualizar estoque");
        },
    });

    // Filter products
    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats
    const totalProducts = products.length;
    const productsWithStock = products.filter((p) => p.stock_control_enabled);
    const lowStockProducts = productsWithStock.filter(
        (p) => (p.stock_quantity || 0) <= (p.low_stock_alert || 5)
    );
    const outOfStockProducts = productsWithStock.filter(
        (p) => (p.stock_quantity || 0) === 0
    );

    const handleSaveStock = (productId: string) => {
        const stock_quantity = editingStock[productId];
        const low_stock_alert = editingAlert[productId];

        updateStockMutation.mutate({
            productId,
            stock_quantity,
            low_stock_alert,
        });

        // Limpar edição
        setEditingStock((prev) => {
            const newState = { ...prev };
            delete newState[productId];
            return newState;
        });
        setEditingAlert((prev) => {
            const newState = { ...prev };
            delete newState[productId];
            return newState;
        });
    };

    const toggleStockControl = (productId: string, enabled: boolean) => {
        updateStockMutation.mutate({
            productId,
            stock_control_enabled: enabled,
        });
    };

    const getStockStatus = (product: ProductWithStock) => {
        if (!product.stock_control_enabled) return "disabled";
        const stock = product.stock_quantity || 0;
        const alert = product.low_stock_alert || 5;
        if (stock === 0) return "out";
        if (stock <= alert) return "low";
        return "ok";
    };

    const getStockBadge = (status: string) => {
        switch (status) {
            case "out":
                return (
                    <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Sem estoque
                    </Badge>
                );
            case "low":
                return (
                    <Badge className="gap-1 bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="h-3 w-3" />
                        Estoque baixo
                    </Badge>
                );
            case "ok":
                return (
                    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Em estoque
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="gap-1">
                        Desativado
                    </Badge>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Controle de Estoque</h2>
                <p className="text-muted-foreground">
                    Gerencie o estoque dos seus produtos e receba alertas
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                <Package className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalProducts}</div>
                                <div className="text-sm text-muted-foreground">Produtos</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{productsWithStock.length}</div>
                                <div className="text-sm text-muted-foreground">Com controle</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={lowStockProducts.length > 0 ? "border-yellow-300" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{lowStockProducts.length}</div>
                                <div className="text-sm text-muted-foreground">Estoque baixo</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={outOfStockProducts.length > 0 ? "border-red-300" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{outOfStockProducts.length}</div>
                                <div className="text-sm text-muted-foreground">Sem estoque</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alertas */}
            {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
                <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Bell className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                                    Atenção ao Estoque!
                                </h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    {outOfStockProducts.length > 0 && (
                                        <span>
                                            <strong>{outOfStockProducts.length}</strong> produto(s) sem estoque.{" "}
                                        </span>
                                    )}
                                    {lowStockProducts.length > 0 && (
                                        <span>
                                            <strong>{lowStockProducts.length}</strong> produto(s) com estoque baixo.
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Products List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {filteredProducts.map((product, index) => {
                        const status = getStockStatus(product);
                        const currentStock =
                            editingStock[product.id] !== undefined
                                ? editingStock[product.id]
                                : product.stock_quantity || 0;
                        const currentAlert =
                            editingAlert[product.id] !== undefined
                                ? editingAlert[product.id]
                                : product.low_stock_alert || 5;
                        const hasChanges =
                            editingStock[product.id] !== undefined ||
                            editingAlert[product.id] !== undefined;

                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: index * 0.02 }}
                            >
                                <Card
                                    className={`transition-all ${status === "out"
                                        ? "border-red-200"
                                        : status === "low"
                                            ? "border-yellow-200"
                                            : ""
                                        }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            {/* Product Image */}
                                            <img
                                                src={product.image_url || "/images/default-product-512.png"}
                                                alt={product.name}
                                                className="w-14 h-14 object-cover rounded-lg"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "/images/default-product-512.png";
                                                }}
                                            />

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium truncate">{product.name}</h4>
                                                    {product.sku && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {product.sku}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {getStockBadge(status)}
                                                    {product.price && (
                                                        <span className="text-sm text-muted-foreground">
                                                            R$ {product.price.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stock Control Toggle */}
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-muted-foreground">
                                                    Controlar
                                                </Label>
                                                <Switch
                                                    checked={product.stock_control_enabled || false}
                                                    onCheckedChange={(checked) =>
                                                        toggleStockControl(product.id, checked)
                                                    }
                                                />
                                            </div>

                                            {/* Stock Input */}
                                            {product.stock_control_enabled && (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                                            Estoque
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            value={currentStock}
                                                            onChange={(e) =>
                                                                setEditingStock({
                                                                    ...editingStock,
                                                                    [product.id]: parseInt(e.target.value) || 0,
                                                                })
                                                            }
                                                            className="w-20 h-9"
                                                            min="0"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                                            Alerta
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            value={currentAlert}
                                                            onChange={(e) =>
                                                                setEditingAlert({
                                                                    ...editingAlert,
                                                                    [product.id]: parseInt(e.target.value) || 0,
                                                                })
                                                            }
                                                            className="w-20 h-9"
                                                            min="0"
                                                        />
                                                    </div>

                                                    {hasChanges && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleSaveStock(product.id)}
                                                            disabled={updateStockMutation.isPending}
                                                        >
                                                            {updateStockMutation.isPending ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Save className="h-4 w-4 mr-1" />
                                                                    Salvar
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Progress bar for stock */}
                                        {product.stock_control_enabled && (
                                            <div className="mt-3">
                                                <Progress
                                                    value={Math.min((currentStock / Math.max(currentAlert * 3, 10)) * 100, 100)}
                                                    className={`h-1.5 ${status === "out"
                                                        ? "[&>div]:bg-red-500"
                                                        : status === "low"
                                                            ? "[&>div]:bg-yellow-500"
                                                            : "[&>div]:bg-green-500"
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {filteredProducts.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">
                            {searchQuery ? "Nenhum produto encontrado" : "Sem produtos"}
                        </h3>
                        <p className="text-muted-foreground">
                            {searchQuery
                                ? "Tente outra busca"
                                : "Cadastre produtos para gerenciar o estoque"}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default StockManager;
