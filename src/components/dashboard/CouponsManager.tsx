
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Ticket,
    Trash2,
    Edit,
    Copy,
    Calendar,
    Percent,
    DollarSign,
    Users,
    TrendingUp,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Coupon {
    id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
    min_purchase: number;
    max_discount: number | null;
    max_uses: number | null;
    used_count: number;
    valid_from: string | null;
    valid_until: string | null;
    active: boolean;
    created_at: string;
}

interface CouponsManagerProps {
    tenantId: string;
}

const CouponsManager = ({ tenantId }: CouponsManagerProps) => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Form state
    const [code, setCode] = useState("");
    const [type, setType] = useState<"percentage" | "fixed">("percentage");
    const [value, setValue] = useState("");
    const [minPurchase, setMinPurchase] = useState("");
    const [maxDiscount, setMaxDiscount] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [validUntil, setValidUntil] = useState("");

    const resetForm = () => {
        setCode("");
        setType("percentage");
        setValue("");
        setMinPurchase("");
        setMaxDiscount("");
        setMaxUses("");
        setValidUntil("");
        setEditingCoupon(null);
    };

    // Fetch coupons
    const { data: coupons, isLoading } = useQuery({
        queryKey: ["coupons", tenantId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("coupons")
                .select("*")
                .eq("tenant_id", tenantId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Coupon[];
        },
    });

    // Create/Update coupon
    const saveMutation = useMutation({
        mutationFn: async (couponData: Partial<Coupon>) => {
            if (editingCoupon) {
                const { error } = await supabase
                    .from("coupons")
                    .update(couponData)
                    .eq("id", editingCoupon.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("coupons")
                    .insert({ ...couponData, tenant_id: tenantId });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons", tenantId] });
            toast.success(editingCoupon ? "Cupom atualizado!" : "Cupom criado!");
            resetForm();
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            console.error("Erro completo:", error);
            const errorMsg = error.message || error.details || error.hint || JSON.stringify(error);
            toast.error("Falha ao salvar", {
                description: `Erro: ${errorMsg}. Verifique os dados ou contate o suporte.`,
                duration: 8000
            });
        },
    });

    // Delete coupon
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("coupons").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons", tenantId] });
            toast.success("Cupom excluído!");
        },
        onError: () => {
            toast.error("Erro ao excluir cupom");
        },
    });

    // Toggle coupon active
    const toggleMutation = useMutation({
        mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
            const { error } = await supabase
                .from("coupons")
                .update({ active })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons", tenantId] });
        },
    });

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setCode(coupon.code);
        setType(coupon.type);
        setValue(coupon.value.toString());
        setMinPurchase(coupon.min_purchase?.toString() || "");
        setMaxDiscount(coupon.max_discount?.toString() || "");
        setMaxUses(coupon.max_uses?.toString() || "");
        setValidUntil(coupon.valid_until ? coupon.valid_until.split("T")[0] : "");
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            toast.error("Digite o código do cupom");
            return;
        }
        if (!value || parseFloat(value) <= 0) {
            toast.error("Digite um valor válido");
            return;
        }

        const safeParseFloat = (val: string) => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        };

        const safeParseNullable = (val: string) => {
            if (!val) return null;
            const num = parseFloat(val);
            return isNaN(num) ? null : num;
        };

        const safeParseIntNullable = (val: string) => {
            if (!val) return null;
            const num = parseInt(val);
            return isNaN(num) ? null : num;
        };

        const couponPayload: any = {
            code: code.toUpperCase().replace(/\s/g, ""),
            type,
            value: safeParseFloat(value),
            min_purchase: safeParseFloat(minPurchase),
            max_discount: safeParseNullable(maxDiscount),
            max_uses: safeParseIntNullable(maxUses),
            active: true,
        };

        if (validUntil) {
            couponPayload.valid_until = new Date(validUntil).toISOString();
        } else {
            couponPayload.valid_until = null;
        }

        saveMutation.mutate(couponPayload);
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Código copiado!");
    };

    const generateRandomCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCode(result);
    };

    // Stats
    const totalCoupons = coupons?.length || 0;
    const activeCoupons = coupons?.filter((c) => c.active).length || 0;
    const totalUses = coupons?.reduce((acc, c) => acc + c.used_count, 0) || 0;

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
                    <h2 className="text-2xl font-bold">Cupons de Desconto</h2>
                    <p className="text-muted-foreground">
                        Crie cupons para atrair mais clientes
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
                            Novo Cupom
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Código do Cupom</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        placeholder="DESCONTO10"
                                        className="uppercase"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={generateRandomCode}
                                    >
                                        Gerar
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Desconto</Label>
                                    <Select
                                        value={type}
                                        onValueChange={(v) => setType(v as "percentage" | "fixed")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">
                                            {type === "percentage" ? "%" : "R$"}
                                        </span>
                                        <Input
                                            type="number"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder="10"
                                            className="pl-10"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Compra Mínima (R$)</Label>
                                    <Input
                                        type="number"
                                        value={minPurchase}
                                        onChange={(e) => setMinPurchase(e.target.value)}
                                        placeholder="0"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Desconto Máximo (R$)</Label>
                                    <Input
                                        type="number"
                                        value={maxDiscount}
                                        onChange={(e) => setMaxDiscount(e.target.value)}
                                        placeholder="Ilimitado"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Limite de Usos</Label>
                                    <Input
                                        type="number"
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value)}
                                        placeholder="Ilimitado"
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Válido Até</Label>
                                    <Input
                                        type="date"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
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
                                    {editingCoupon ? "Salvar" : "Criar Cupom"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                <Ticket className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalCoupons}</div>
                                <div className="text-sm text-muted-foreground">Total de Cupons</div>
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
                                <div className="text-2xl font-bold">{activeCoupons}</div>
                                <div className="text-sm text-muted-foreground">Cupons Ativos</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalUses}</div>
                                <div className="text-sm text-muted-foreground">Usos Totais</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Coupons List */}
            {coupons && coupons.length > 0 ? (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {coupons.map((coupon, index) => (
                            <motion.div
                                key={coupon.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    className={`transition-all ${!coupon.active ? "opacity-60" : ""
                                        }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-xl">
                                                    <Ticket className="h-6 w-6 text-violet-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-lg">
                                                            {coupon.code}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => handleCopyCode(coupon.code)}
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Badge variant={coupon.type === "percentage" ? "default" : "secondary"}>
                                                            <span className="flex items-center gap-1">
                                                                {coupon.type === "percentage" ? (
                                                                    <Percent className="h-3 w-3" />
                                                                ) : (
                                                                    <DollarSign className="h-3 w-3" />
                                                                )}
                                                                {coupon.type === "percentage"
                                                                    ? `${coupon.value}% OFF`
                                                                    : `R$ ${coupon.value.toFixed(2)} OFF`}
                                                            </span>
                                                        </Badge>
                                                        {coupon.min_purchase > 0 && (
                                                            <span>
                                                                Mín: R$ {coupon.min_purchase.toFixed(2)}
                                                            </span>
                                                        )}
                                                        <span>
                                                            {coupon.used_count}
                                                            {coupon.max_uses
                                                                ? ` / ${coupon.max_uses}`
                                                                : ""}{" "}
                                                            usos
                                                        </span>
                                                        {coupon.valid_until && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                até{" "}
                                                                {format(
                                                                    new Date(coupon.valid_until),
                                                                    "dd/MM/yyyy",
                                                                    { locale: ptBR }
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={coupon.active}
                                                    onCheckedChange={(checked) =>
                                                        toggleMutation.mutate({
                                                            id: coupon.id,
                                                            active: checked,
                                                        })
                                                    }
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(coupon)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600"
                                                    onClick={() => deleteMutation.mutate(coupon.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
                        <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Nenhum cupom criado</h3>
                        <p className="text-muted-foreground mb-4">
                            Crie cupons de desconto para atrair mais clientes
                        </p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Primeiro Cupom
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CouponsManager;
