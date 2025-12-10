"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  max_products: number;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'suspended' | 'trial' | 'past_due' | 'inactive';
  created_at: string;
  last_sign_in_at?: string;
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    role: number;
  }>;
  plan: {
    id: string;
    name: string;
    price: number;
    status: string;
    expires_at?: string;
    max_products: number;
  } | null;
  trial_ends_at?: string;
}

interface UserManageDialogProps {
  user: UserData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const UserManageDialog = ({
  user,
  open,
  onOpenChange,
  onSuccess,
}: UserManageDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(user.plan?.id || "");
  const primaryTenantId = user.tenants[0]?.id;

  useEffect(() => {
    if (open) {
      loadPlans();
      setSelectedPlanId(user.plan?.id || "");
    }
  }, [open, user.plan?.id]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .order("price_cents", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      toast.error("Erro ao carregar planos");
    }
  };

  const handleAction = async (action: string, payload?: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "superadmin-users",
        {
          method: 'POST',
          body: {
            userId: user.id,
            action,
            tenant_id: primaryTenantId,
            ...payload,
          },
        }
      );

      if (error) throw error;

      toast.success(data.message || "Ação executada com sucesso!");
      if (data.new_password) {
        navigator.clipboard.writeText(data.new_password);
        toast.info(`Nova senha copiada para área de transferência: ${data.new_password}`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(`Erro ao executar ação ${action}:`, error);
      toast.error(error.message || `Erro ao executar ação ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: UserData['status']) => {
    const statusMap: Record<string, string> = {
      active: "Ativo",
      trial: "Trial",
      past_due: "Vencido",
      suspended: "Suspenso",
      inactive: "Inativo",
    };
    return statusMap[status] || status;
  };

  const getDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {user.tenants.length > 0 && (
            <>
              <div>
                <Label className="text-sm font-medium">Tenant Principal</Label>
                <p className="text-sm text-muted-foreground">
                  {user.tenants[0].name} (/{user.tenants[0].slug})
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status Atual</Label>
                <p className="text-sm text-muted-foreground">
                  {getStatusBadge(user.status)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Plano Atual</Label>
                <p className="text-sm text-muted-foreground">
                  {user.plan?.name || "N/A"}
                </p>
              </div>

              {getDaysRemaining(user.trial_ends_at) !== null && (
                <div>
                  <Label className="text-sm font-medium">Dias Restantes</Label>
                  <p className="text-sm text-muted-foreground">
                    {getDaysRemaining(user.trial_ends_at)} dias
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="plan">Selecionar Plano</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId} disabled={loading || !primaryTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - R$ {(plan.price_cents / 100).toFixed(2)} (
                    {plan.max_products === -1
                      ? "Ilimitado"
                      : `${plan.max_products} produtos`}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => handleAction('changePlan', { plan_id: selectedPlanId })} 
              disabled={loading || !selectedPlanId || !primaryTenantId}
              className="w-full"
              size="sm"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aplicar Plano
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Adicionar Dias de Acesso</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('addDays', { days: 30 })}
                disabled={loading || !primaryTenantId}
              >
                +30 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('addDays', { days: 60 })}
                disabled={loading || !primaryTenantId}
              >
                +60 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('addDays', { days: 365 })}
                disabled={loading || !primaryTenantId}
              >
                +365 dias
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Adiciona dias e reativa o tenant automaticamente
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ações Administrativas</Label>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction('resetPassword')}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resetar Senha
            </Button>
            <p className="text-xs text-muted-foreground">
              Gera nova senha aleatória e copia para área de transferência
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};