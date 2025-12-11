import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Package,
    Truck,
    CreditCard,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    MessageCircle,
    Loader2,
    Filter,
    Calendar,
    DollarSign,
    ShoppingBag
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderItem {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    variation?: string;
    image_url?: string;
}

interface Order {
    id: string;
    order_number: number;
    customer_name: string;
    customer_email: string | null;
    customer_whatsapp: string | null;
    items: OrderItem[];
    subtotal: number;
    shipping_cost: number;
    discount: number;
    total: number;
    payment_method: string | null;
    payment_status: string;
    shipping_status: string;
    shipping_address: any;
    tracking_code: string | null;
    notes: string | null;
    source: string;
    created_at: string;
}

interface OrdersManagerProps {
    tenantId: string;
}

const paymentStatusLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    paid: { label: "Pago", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    failed: { label: "Falhou", color: "bg-red-100 text-red-800", icon: XCircle },
    refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800", icon: CreditCard },
};

const shippingStatusLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Pendente", color: "bg-gray-100 text-gray-800", icon: Clock },
    processing: { label: "Preparando", color: "bg-blue-100 text-blue-800", icon: Package },
    shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800", icon: Truck },
    delivered: { label: "Entregue", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: XCircle },
};

const OrdersManager = ({ tenantId }: OrdersManagerProps) => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Fetch orders
    const { data: orders, isLoading } = useQuery({
        queryKey: ["orders", tenantId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("tenant_id", tenantId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Order[];
        },
    });

    // Update order status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, field, value }: { orderId: string; field: string; value: string }) => {
            const { error } = await supabase
                .from("orders")
                .update({ [field]: value })
                .eq("id", orderId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders", tenantId] });
            toast.success("Status atualizado!");
        },
        onError: () => {
            toast.error("Erro ao atualizar status");
        },
    });

    // Filter orders
    const filteredOrders = orders?.filter((order) => {
        const matchesSearch =
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.order_number.toString().includes(searchQuery) ||
            order.customer_whatsapp?.includes(searchQuery);

        const matchesStatus =
            statusFilter === "all" ||
            order.payment_status === statusFilter ||
            order.shipping_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Stats
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.filter(o => o.payment_status === "paid").reduce((acc, o) => acc + o.total, 0) || 0;
    const pendingOrders = orders?.filter(o => o.payment_status === "pending").length || 0;
    const shippedOrders = orders?.filter(o => o.shipping_status === "shipped" || o.shipping_status === "delivered").length || 0;

    const handleWhatsAppClick = (whatsapp: string, orderNumber: number) => {
        const phone = whatsapp.replace(/\D/g, "");
        const message = encodeURIComponent(
            `Olá! Sobre seu pedido #${orderNumber}, gostaria de informar...`
        );
        window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
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
                <h2 className="text-2xl font-bold">Pedidos</h2>
                <p className="text-muted-foreground">
                    Gerencie os pedidos da sua loja
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                <ShoppingBag className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalOrders}</div>
                                <div className="text-sm text-muted-foreground">Total</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-sm text-muted-foreground">Faturamento</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{pendingOrders}</div>
                                <div className="text-sm text-muted-foreground">Pendentes</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Truck className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{shippedOrders}</div>
                                <div className="text-sm text-muted-foreground">Enviados</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, número ou WhatsApp..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrar..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Aguardando Pagamento</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="processing">Preparando</SelectItem>
                        <SelectItem value="shipped">Enviado</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Orders List */}
            {filteredOrders && filteredOrders.length > 0 ? (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {filteredOrders.map((order, index) => {
                            const paymentInfo = paymentStatusLabels[order.payment_status] || paymentStatusLabels.pending;
                            const shippingInfo = shippingStatusLabels[order.shipping_status] || shippingStatusLabels.pending;
                            const PaymentIcon = paymentInfo.icon;
                            const ShippingIcon = shippingInfo.icon;

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <Card className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
                                                        <span className="font-bold text-violet-600">
                                                            #{order.order_number}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold">{order.customer_name}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {order.source}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                            </span>
                                                            <span className="font-medium text-foreground">
                                                                R$ {order.total.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {/* Status badges */}
                                                    <div className="flex flex-col gap-1">
                                                        <Badge className={paymentInfo.color}>
                                                            <PaymentIcon className="h-3 w-3 mr-1" />
                                                            {paymentInfo.label}
                                                        </Badge>
                                                        <Badge className={shippingInfo.color}>
                                                            <ShippingIcon className="h-3 w-3 mr-1" />
                                                            {shippingInfo.label}
                                                        </Badge>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setSelectedOrder(order)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {order.customer_whatsapp && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-green-600"
                                                                onClick={() => handleWhatsAppClick(order.customer_whatsapp!, order.order_number)}
                                                            >
                                                                <MessageCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick status update */}
                                            <div className="mt-3 pt-3 border-t flex gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Pagamento:</span>
                                                    <Select
                                                        value={order.payment_status}
                                                        onValueChange={(value) =>
                                                            updateStatusMutation.mutate({
                                                                orderId: order.id,
                                                                field: "payment_status",
                                                                value,
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="w-[140px] h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Aguardando</SelectItem>
                                                            <SelectItem value="paid">Pago</SelectItem>
                                                            <SelectItem value="failed">Falhou</SelectItem>
                                                            <SelectItem value="refunded">Reembolsado</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Entrega:</span>
                                                    <Select
                                                        value={order.shipping_status}
                                                        onValueChange={(value) =>
                                                            updateStatusMutation.mutate({
                                                                orderId: order.id,
                                                                field: "shipping_status",
                                                                value,
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="w-[140px] h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pendente</SelectItem>
                                                            <SelectItem value="processing">Preparando</SelectItem>
                                                            <SelectItem value="shipped">Enviado</SelectItem>
                                                            <SelectItem value="delivered">Entregue</SelectItem>
                                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">
                            {searchQuery || statusFilter !== "all"
                                ? "Nenhum pedido encontrado"
                                : "Nenhum pedido ainda"}
                        </h3>
                        <p className="text-muted-foreground">
                            {searchQuery || statusFilter !== "all"
                                ? "Tente outra busca ou filtro"
                                : "Os pedidos aparecerão aqui quando os clientes comprarem"}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Order Detail Dialog */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Pedido #{selectedOrder?.order_number}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                                    Cliente
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-muted-foreground">Nome:</span>
                                        <p className="font-medium">{selectedOrder.customer_name}</p>
                                    </div>
                                    {selectedOrder.customer_email && (
                                        <div>
                                            <span className="text-sm text-muted-foreground">Email:</span>
                                            <p className="font-medium">{selectedOrder.customer_email}</p>
                                        </div>
                                    )}
                                    {selectedOrder.customer_whatsapp && (
                                        <div>
                                            <span className="text-sm text-muted-foreground">WhatsApp:</span>
                                            <p className="font-medium">{selectedOrder.customer_whatsapp}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                                    Itens
                                </h4>
                                <div className="space-y-2">
                                    {(selectedOrder.items as OrderItem[])?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {item.image_url && (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    {item.variation && (
                                                        <p className="text-sm text-muted-foreground">{item.variation}</p>
                                                    )}
                                                    <p className="text-sm text-muted-foreground">
                                                        Qtd: {item.quantity} x R$ {item.price.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-medium">
                                                R$ {(item.quantity * item.price).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="space-y-2 border-t pt-4">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                                </div>
                                {selectedOrder.shipping_cost > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Frete</span>
                                        <span>R$ {selectedOrder.shipping_cost.toFixed(2)}</span>
                                    </div>
                                )}
                                {selectedOrder.discount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Desconto</span>
                                        <span>- R$ {selectedOrder.discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                    <span>Total</span>
                                    <span>R$ {selectedOrder.total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedOrder.notes && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                                        Observações
                                    </h4>
                                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                                        {selectedOrder.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrdersManager;
