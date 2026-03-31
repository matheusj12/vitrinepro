import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Percent, DollarSign } from "lucide-react";

interface Coupon {
    id: string;
    code: string;
    description: string | null;
    discount_type: "percent" | "fixed";
    discount_value: number;
    pix_only: boolean;
    max_uses: number | null;
    current_uses: number;
    expires_at: string | null;
    active: boolean;
    created_at: string;
}

const emptyForm = {
    code: "",
    description: "",
    discount_type: "percent" as "percent" | "fixed",
    discount_value: "",
    pix_only: true,
    max_uses: "",
    expires_at: "",
};

export const CouponsManager = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadCoupons(); }, []);

    const loadCoupons = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("subscription_coupons")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) toast.error("Erro ao carregar cupons");
        else setCoupons(data || []);
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!form.code || !form.discount_value) {
            toast.error("Preencha código e valor do desconto");
            return;
        }
        setSaving(true);
        const payload = {
            code: form.code.toUpperCase().trim(),
            description: form.description || null,
            discount_type: form.discount_type,
            discount_value: parseFloat(form.discount_value),
            pix_only: form.pix_only,
            max_uses: form.max_uses ? parseInt(form.max_uses) : null,
            expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
            active: true,
        };
        const { error } = await supabase.from("subscription_coupons").insert(payload);
        if (error) {
            toast.error(error.message.includes("unique") ? "Código já existe" : "Erro ao criar cupom");
        } else {
            toast.success("Cupom criado!");
            setDialogOpen(false);
            setForm(emptyForm);
            loadCoupons();
        }
        setSaving(false);
    };

    const toggleActive = async (id: string, active: boolean) => {
        const { error } = await supabase
            .from("subscription_coupons")
            .update({ active: !active })
            .eq("id", id);
        if (error) toast.error("Erro ao atualizar cupom");
        else {
            toast.success(active ? "Cupom desativado" : "Cupom ativado");
            loadCoupons();
        }
    };

    const deleteCoupon = async (id: string) => {
        if (!confirm("Excluir este cupom?")) return;
        const { error } = await supabase.from("subscription_coupons").delete().eq("id", id);
        if (error) toast.error("Erro ao excluir");
        else { toast.success("Cupom excluído"); loadCoupons(); }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Código copiado!");
    };

    const generateCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        setForm(f => ({ ...f, code }));
    };

    const isExpired = (expires_at: string | null) => {
        if (!expires_at) return false;
        return new Date(expires_at) < new Date();
    };

    if (isLoading) return <div className="text-center py-8">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Cupons de Desconto</h2>
                    <p className="text-muted-foreground text-sm">Crie cupons para atrair novos assinantes via PIX</p>
                </div>
                <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Novo Cupom
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-2xl font-bold">{coupons.filter(c => c.active).length}</p>
                        <p className="text-sm text-muted-foreground">Cupons ativos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-2xl font-bold">{coupons.reduce((s, c) => s + c.current_uses, 0)}</p>
                        <p className="text-sm text-muted-foreground">Total de usos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-2xl font-bold">{coupons.filter(c => c.pix_only).length}</p>
                        <p className="text-sm text-muted-foreground">Exclusivos PIX</p>
                    </CardContent>
                </Card>
            </div>

            {/* Lista */}
            <div className="space-y-3">
                {coupons.length === 0 && (
                    <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum cupom criado ainda.</CardContent></Card>
                )}
                {coupons.map(coupon => (
                    <Card key={coupon.id} className={!coupon.active || isExpired(coupon.expires_at) ? "opacity-60" : ""}>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-lg">{coupon.code}</span>
                                        <button onClick={() => copyCode(coupon.code)} className="text-muted-foreground hover:text-foreground">
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Badge variant="secondary" className="text-green-700 bg-green-100">
                                            {coupon.discount_type === "percent"
                                                ? `${coupon.discount_value}% OFF`
                                                : `R$ ${coupon.discount_value} OFF`}
                                        </Badge>
                                        {coupon.pix_only && <Badge variant="outline" className="text-blue-600 border-blue-300">PIX only</Badge>}
                                        {isExpired(coupon.expires_at) && <Badge variant="destructive">Expirado</Badge>}
                                        {!coupon.active && <Badge variant="outline">Inativo</Badge>}
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground text-right shrink-0">
                                    <div>{coupon.current_uses}{coupon.max_uses ? `/${coupon.max_uses}` : ""} usos</div>
                                    {coupon.expires_at && (
                                        <div>Até {new Date(coupon.expires_at).toLocaleDateString("pt-BR")}</div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={coupon.active}
                                        onCheckedChange={() => toggleActive(coupon.id, coupon.active)}
                                    />
                                    <button onClick={() => deleteCoupon(coupon.id)} className="text-destructive hover:opacity-70">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            {coupon.description && (
                                <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Dialog criar */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Criar Cupom</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="CODIGO"
                                value={form.code}
                                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                className="font-mono"
                            />
                            <Button variant="outline" type="button" onClick={generateCode}>Gerar</Button>
                        </div>
                        <Input
                            placeholder="Descrição (ex: Bem-vindo! 50% off no 1º mês)"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs mb-1 block">Tipo de desconto</Label>
                                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v as any }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percent"><Percent className="h-3 w-3 inline mr-1" />Percentual (%)</SelectItem>
                                        <SelectItem value="fixed"><DollarSign className="h-3 w-3 inline mr-1" />Valor fixo (R$)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs mb-1 block">
                                    {form.discount_type === "percent" ? "Desconto (%)" : "Desconto (R$)"}
                                </Label>
                                <Input
                                    type="number"
                                    placeholder={form.discount_type === "percent" ? "50" : "29.90"}
                                    value={form.discount_value}
                                    onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs mb-1 block">Máx. usos (vazio = ilimitado)</Label>
                                <Input
                                    type="number"
                                    placeholder="100"
                                    value={form.max_uses}
                                    onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label className="text-xs mb-1 block">Expira em</Label>
                                <Input
                                    type="date"
                                    value={form.expires_at}
                                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 border rounded-lg p-3">
                            <Switch
                                checked={form.pix_only}
                                onCheckedChange={v => setForm(f => ({ ...f, pix_only: v }))}
                            />
                            <div>
                                <p className="text-sm font-medium">Apenas PIX</p>
                                <p className="text-xs text-muted-foreground">Desconto válido somente para pagamento via PIX</p>
                            </div>
                        </div>
                        <Button className="w-full" onClick={handleSave} disabled={saving}>
                            {saving ? "Criando..." : "Criar Cupom"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CouponsManager;
