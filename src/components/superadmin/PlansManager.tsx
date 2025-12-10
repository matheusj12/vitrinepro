import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plan } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PlansManager = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price_cents: "0",
    max_products: "-1",
    trial_days: "0",
    features: "",
    active: true,
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("price_cents");

      if (error) throw error;
      return data as Plan[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("plans").insert({
        ...data,
        price_cents: parseInt(data.price_cents),
        max_products: parseInt(data.max_products),
        trial_days: parseInt(data.trial_days),
        features: data.features.split("\n").filter((f: string) => f.trim()),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plano criado!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("plans")
        .update({
          ...data,
          price_cents: parseInt(data.price_cents),
          max_products: parseInt(data.max_products),
          trial_days: parseInt(data.trial_days),
          features: data.features.split("\n").filter((f: string) => f.trim()),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plano atualizado!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price_cents: "0",
      max_products: "-1",
      trial_days: "0",
      features: "",
      active: true,
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (plan: Plan) => {
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      price_cents: plan.price_cents.toString(),
      max_products: plan.max_products.toString(),
      trial_days: plan.trial_days.toString(),
      features: plan.features.join("\n"),
      active: plan.active,
    });
    setEditingId(plan.id);
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Planos ({plans.length})</h2>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? "Cancelar" : "Novo Plano"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar" : "Novo"} Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Preço (centavos)</Label>
                <Input
                  type="number"
                  value={formData.price_cents}
                  onChange={(e) => setFormData({ ...formData, price_cents: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Ex: 4990 = R$ 49,90</p>
              </div>
              <div>
                <Label>Máx Produtos</Label>
                <Input
                  type="number"
                  value={formData.max_products}
                  onChange={(e) => setFormData({ ...formData, max_products: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">-1 = ilimitado</p>
              </div>
              <div>
                <Label>Dias de Trial</Label>
                <Input
                  type="number"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                />
              </div>
              <div>
                <Label>Features (uma por linha)</Label>
                <Textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Plano ativo</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Salvar</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{plan.name}</span>
                {!plan.active && <span className="text-xs text-muted-foreground">Inativo</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">R$ {(plan.price_cents / 100).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="text-sm">
                  <p>Produtos: {plan.max_products === -1 ? "Ilimitado" : plan.max_products}</p>
                  <p>Trial: {plan.trial_days} dias</p>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-semibold mb-1">Features:</p>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlansManager;
