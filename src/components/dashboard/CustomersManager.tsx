import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Users,
    Search,
    Phone,
    Mail,
    MessageCircle,
    ShoppingBag,
    Trash2,
    Edit,
    Loader2,
    User,
    MapPin,
    Tag,
    Calendar,
    TrendingUp,
    DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    document: string | null;
    address: {
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
    tags: string[];
    notes: string | null;
    source: string;
    total_orders: number;
    total_spent: number;
    last_order_at: string | null;
    created_at: string;
}

interface CustomersManagerProps {
    tenantId: string;
}

const CustomersManager = ({ tenantId }: CustomersManagerProps) => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTab, setSelectedTab] = useState("all");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        document: "",
        notes: "",
        tags: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zip: "",
    });

    // Fetch customers
    const { data: customers, isLoading } = useQuery({
        queryKey: ["customers", tenantId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("customers")
                .select("*")
                .eq("tenant_id", tenantId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Customer[];
        },
    });

    // Create/Update customer
    const saveMutation = useMutation({
        mutationFn: async (customerData: Partial<Customer>) => {
            if (editingCustomer) {
                const { error } = await supabase
                    .from("customers")
                    .update(customerData)
                    .eq("id", editingCustomer.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("customers")
                    .insert({ ...customerData, tenant_id: tenantId });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers", tenantId] });
            toast.success(editingCustomer ? "Cliente atualizado!" : "Cliente cadastrado!");
            resetForm();
            setIsDialogOpen(false);
        },
        onError: () => {
            toast.error("Erro ao salvar cliente");
        },
    });

    // Delete customer
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("customers").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers", tenantId] });
            toast.success("Cliente excluído!");
        },
        onError: () => {
            toast.error("Erro ao excluir cliente");
        },
    });

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            whatsapp: "",
            document: "",
            notes: "",
            tags: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
            zip: "",
        });
        setEditingCustomer(null);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            email: customer.email || "",
            phone: customer.phone || "",
            whatsapp: customer.whatsapp || "",
            document: customer.document || "",
            notes: customer.notes || "",
            tags: customer.tags?.join(", ") || "",
            street: customer.address?.street || "",
            number: customer.address?.number || "",
            complement: customer.address?.complement || "",
            neighborhood: customer.address?.neighborhood || "",
            city: customer.address?.city || "",
            state: customer.address?.state || "",
            zip: customer.address?.zip || "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Digite o nome do cliente");
            return;
        }

        const tags = formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);

        saveMutation.mutate({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            whatsapp: formData.whatsapp || null,
            document: formData.document || null,
            notes: formData.notes || null,
            tags,
            address: {
                street: formData.street,
                number: formData.number,
                complement: formData.complement,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
            },
            source: "manual",
        });
    };

    const handleWhatsAppClick = (whatsapp: string) => {
        const phone = whatsapp.replace(/\D/g, "");
        window.open(`https://wa.me/55${phone}`, "_blank");
    };

    // Filter customers
    const filteredCustomers = customers?.filter((customer) => {
        const matchesSearch =
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.whatsapp?.includes(searchQuery) ||
            customer.phone?.includes(searchQuery);

        if (selectedTab === "all") return matchesSearch;
        if (selectedTab === "whatsapp") return matchesSearch && customer.whatsapp;
        if (selectedTab === "buyers") return matchesSearch && customer.total_orders > 0;

        return matchesSearch;
    });

    // Stats
    const totalCustomers = customers?.length || 0;
    const totalWithWhatsapp = customers?.filter((c) => c.whatsapp).length || 0;
    const totalBuyers = customers?.filter((c) => c.total_orders > 0).length || 0;
    const totalRevenue = customers?.reduce((acc, c) => acc + (c.total_spent || 0), 0) || 0;

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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Clientes</h2>
                    <p className="text-muted-foreground">
                        Gerencie sua base de clientes
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                resetForm();
                                setIsDialogOpen(true);
                            }}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Dados Pessoais */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                                    Dados Pessoais
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label>Nome *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="Nome do cliente"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            placeholder="email@exemplo.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CPF/CNPJ</Label>
                                        <Input
                                            value={formData.document}
                                            onChange={(e) =>
                                                setFormData({ ...formData, document: e.target.value })
                                            }
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefone</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                            }
                                            placeholder="(00) 0000-0000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>WhatsApp</Label>
                                        <Input
                                            value={formData.whatsapp}
                                            onChange={(e) =>
                                                setFormData({ ...formData, whatsapp: e.target.value })
                                            }
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Endereço */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                                    Endereço
                                </h3>
                                <div className="grid grid-cols-6 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label>CEP</Label>
                                        <Input
                                            value={formData.zip}
                                            onChange={(e) =>
                                                setFormData({ ...formData, zip: e.target.value })
                                            }
                                            placeholder="00000-000"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-4">
                                        <Label>Rua</Label>
                                        <Input
                                            value={formData.street}
                                            onChange={(e) =>
                                                setFormData({ ...formData, street: e.target.value })
                                            }
                                            placeholder="Nome da rua"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-1">
                                        <Label>Número</Label>
                                        <Input
                                            value={formData.number}
                                            onChange={(e) =>
                                                setFormData({ ...formData, number: e.target.value })
                                            }
                                            placeholder="123"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Complemento</Label>
                                        <Input
                                            value={formData.complement}
                                            onChange={(e) =>
                                                setFormData({ ...formData, complement: e.target.value })
                                            }
                                            placeholder="Apto, bloco..."
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-3">
                                        <Label>Bairro</Label>
                                        <Input
                                            value={formData.neighborhood}
                                            onChange={(e) =>
                                                setFormData({ ...formData, neighborhood: e.target.value })
                                            }
                                            placeholder="Bairro"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-4">
                                        <Label>Cidade</Label>
                                        <Input
                                            value={formData.city}
                                            onChange={(e) =>
                                                setFormData({ ...formData, city: e.target.value })
                                            }
                                            placeholder="Cidade"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Estado</Label>
                                        <Input
                                            value={formData.state}
                                            onChange={(e) =>
                                                setFormData({ ...formData, state: e.target.value })
                                            }
                                            placeholder="UF"
                                            maxLength={2}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tags e Notas */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tags (separadas por vírgula)</Label>
                                    <Input
                                        value={formData.tags}
                                        onChange={(e) =>
                                            setFormData({ ...formData, tags: e.target.value })
                                        }
                                        placeholder="VIP, Atacado, Novo..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notas</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) =>
                                            setFormData({ ...formData, notes: e.target.value })
                                        }
                                        placeholder="Observações sobre o cliente..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={saveMutation.isPending}
                                >
                                    {saveMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {editingCustomer ? "Salvar" : "Cadastrar"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                <Users className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalCustomers}</div>
                                <div className="text-sm text-muted-foreground">Total</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <MessageCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalWithWhatsapp}</div>
                                <div className="text-sm text-muted-foreground">Com WhatsApp</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <ShoppingBag className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalBuyers}</div>
                                <div className="text-sm text-muted-foreground">Compradores</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <DollarSign className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Gasto</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Tabs */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, email ou telefone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList>
                        <TabsTrigger value="all">Todos</TabsTrigger>
                        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                        <TabsTrigger value="buyers">Compradores</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Customers List */}
            {filteredCustomers && filteredCustomers.length > 0 ? (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {filteredCustomers.map((customer, index) => (
                            <motion.div
                                key={customer.id}
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
                                                    <User className="h-6 w-6 text-violet-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">{customer.name}</span>
                                                        {customer.tags?.map((tag) => (
                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                        {customer.email && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {customer.email}
                                                            </span>
                                                        )}
                                                        {customer.whatsapp && (
                                                            <button
                                                                onClick={() => handleWhatsAppClick(customer.whatsapp!)}
                                                                className="flex items-center gap-1 text-green-600 hover:text-green-700"
                                                            >
                                                                <MessageCircle className="h-3 w-3" />
                                                                {customer.whatsapp}
                                                            </button>
                                                        )}
                                                        {customer.phone && !customer.whatsapp && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {customer.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {customer.address?.city && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {customer.address.city}
                                                            {customer.address.state && `, ${customer.address.state}`}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {customer.total_orders > 0 && (
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium">
                                                            {customer.total_orders} pedido{customer.total_orders > 1 ? "s" : ""}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            R$ {customer.total_spent?.toFixed(2)}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(customer)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-600"
                                                        onClick={() => deleteMutation.mutate(customer.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">
                            {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery
                                ? "Tente outra busca"
                                : "Cadastre seus clientes para acompanhar vendas"}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Cadastrar Cliente
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CustomersManager;
