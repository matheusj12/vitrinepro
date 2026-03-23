import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

interface Plan {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price_cents: number;
    max_products: number;
    trial_days: number;
    features: unknown;
    active: boolean;
}

interface PlansManagerProps {
    tenantId: string;
}

export const PlansManager = ({ tenantId }: PlansManagerProps) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [changingPlan, setChangingPlan] = useState<string | null>(null);
    const { subscription, plan: currentPlan, daysRemaining, isTrialExpired, refetch } = useSubscription(tenantId);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const { data, error } = await supabase
                .from("plans")
                .select("*")
                .eq("active", true)
                .order("price_cents", { ascending: true });

            if (error) throw error;
            setPlans(data || []);
        } catch (err) {
            console.error("Error loading plans:", err);
            toast.error("Erro ao carregar planos");
        } finally {
            setIsLoading(false);
        }
    };

    // Usuário já usou trial se subscription tem trial_ends_at preenchido
    const hasUsedTrial = subscription !== null && subscription.trial_ends_at !== null;

    const handleActivateTrial = async (plan: Plan) => {
        setChangingPlan(plan.id);
        try {
            const { error } = await supabase.functions.invoke("activate-trial", {
                body: { planId: plan.id },
            });

            if (error) {
                let detail = "Erro ao ativar trial.";
                try {
                    const body = await (error as any).context?.json?.();
                    if (body?.error) detail = body.error;
                } catch {}
                throw new Error(detail);
            }

            toast.success(`Trial de ${plan.trial_days} dias ativado!`, {
                description: `Aproveite o plano ${plan.name} gratuitamente.`,
            });
            await refetch();
        } catch (err: any) {
            toast.error("Erro ao ativar trial", { description: err.message });
        } finally {
            setChangingPlan(null);
        }
    };

    const handleCheckout = async (plan: Plan) => {
        setChangingPlan(plan.id);
        try {
            const { data, error } = await supabase.functions.invoke("create-checkout-session", {
                body: {
                    planId: plan.id,
                    gateway: "asaas",
                    successUrl: window.location.origin + "/dashboard?payment=success",
                    cancelUrl: window.location.origin + "/dashboard?payment=canceled",
                },
            });

            if (error) {
                let detail = "Verifique se o Asaas está configurado no SuperAdmin → Payments.";
                try {
                    const body = await (error as any).context?.json?.();
                    if (body?.error) detail = body.error;
                } catch {}
                throw new Error(detail);
            }

            if (data?.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error("URL de checkout não retornada");
            }
        } catch (err: any) {
            console.error("Checkout error:", err);
            toast.error("Erro ao iniciar checkout", {
                description: err.message,
                duration: 6000,
            });
        } finally {
            setChangingPlan(null);
        }
    };

    const handleDowngrade = async (plan: Plan) => {
        setChangingPlan(plan.id);
        try {
            const { error } = await supabase.functions.invoke("tenant-change-plan", {
                body: { planId: plan.id },
            });

            if (error) throw error;

            toast.success("Plano alterado com sucesso!");
            await refetch();
        } catch (err) {
            console.error("Error changing plan:", err);
            toast.error("Erro ao alterar plano");
        } finally {
            setChangingPlan(null);
        }
    };

    const getButtonConfig = (plan: Plan): {
        label: string;
        disabled: boolean;
        action: () => void;
        variant: "default" | "outline" | "ghost";
        icon?: React.ReactNode;
    } => {
        const isCurrentPlan = plan.id === currentPlan?.id;
        const isFree = plan.price_cents === 0;
        const status = subscription?.status;
        const isLoading = changingPlan === plan.id;

        if (isLoading) {
            return { label: "", disabled: true, action: () => {}, variant: "outline" };
        }

        // Plano atual
        if (isCurrentPlan) {
            if (status === "trial" && !isTrialExpired) {
                return {
                    label: `Em Trial · ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""}`,
                    disabled: true,
                    action: () => {},
                    variant: "outline",
                    icon: <Clock className="h-4 w-4 mr-2" />,
                };
            }
            if (status === "trial" && isTrialExpired) {
                return {
                    label: "Trial expirado — Assinar",
                    disabled: false,
                    action: () => handleCheckout(plan),
                    variant: "default",
                };
            }
            if (status === "active") {
                return {
                    label: "Plano Atual",
                    disabled: true,
                    action: () => {},
                    variant: "outline",
                    icon: <Crown className="h-4 w-4 mr-2" />,
                };
            }
            if (status === "past_due") {
                return {
                    label: "Renovar Assinatura",
                    disabled: false,
                    action: () => handleCheckout(plan),
                    variant: "default",
                };
            }
            if (status === "canceled") {
                return {
                    label: "Reativar Plano",
                    disabled: false,
                    action: () => handleCheckout(plan),
                    variant: "default",
                };
            }
        }

        // Plano gratuito (não é o atual)
        if (isFree) {
            return {
                label: "Selecionar",
                disabled: false,
                action: () => handleDowngrade(plan),
                variant: "outline",
            };
        }

        // Plano pago, sem trial usado ou primeiro acesso
        if (!hasUsedTrial && plan.trial_days > 0) {
            return {
                label: `Iniciar ${plan.trial_days} dias grátis`,
                disabled: false,
                action: () => handleActivateTrial(plan),
                variant: "default",
            };
        }

        // Plano pago, já usou trial ou sem trial
        return {
            label: "Assinar Agora",
            disabled: false,
            action: () => handleCheckout(plan),
            variant: "default",
        };
    };

    const formatPrice = (cents: number) => {
        if (cents === 0) return "Grátis";
        return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
    };

    const getFeaturesList = (plan: Plan): string[] => {
        if (Array.isArray(plan.features)) {
            return plan.features.map((f: any) => (typeof f === "string" ? f : f.name || f.label || JSON.stringify(f)));
        }
        return [];
    };

    const getHeaderMessage = () => {
        if (!subscription) return "Escolha um plano para começar";
        if (subscription.status === "trial" && isTrialExpired) return "Seu trial expirou. Assine para continuar.";
        if (subscription.status === "trial" && daysRemaining !== null) return `Trial ativo — ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""} restante${daysRemaining !== 1 ? "s" : ""}`;
        if (subscription.status === "past_due") return "Pagamento pendente. Renove para não perder o acesso.";
        if (subscription.status === "canceled") return "Assinatura cancelada. Reative quando quiser.";
        return "Faça upgrade para desbloquear mais recursos";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-heading font-bold">Escolha seu plano</h2>
                <p className="text-muted-foreground mt-2">{getHeaderMessage()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isCurrentPlan = plan.id === currentPlan?.id;
                    const isPopular = plan.slug === "pro";
                    const features = getFeaturesList(plan);
                    const btnConfig = getButtonConfig(plan);
                    const isTrialActive = isCurrentPlan && subscription?.status === "trial" && !isTrialExpired;

                    return (
                        <Card
                            key={plan.id}
                            className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                                isPopular ? "border-2 border-primary shadow-lg shadow-primary/10" : ""
                            } ${isCurrentPlan ? "bg-primary/5" : ""}`}
                        >
                            {isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-gradient-to-r from-primary to-violet-600 text-white px-4 py-1">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Mais Popular
                                    </Badge>
                                </div>
                            )}

                            {isTrialActive && (
                                <div className="absolute top-3 right-3">
                                    <Badge variant="secondary" className="text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Trial
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pt-8">
                                <CardTitle className="text-lg font-medium text-muted-foreground uppercase tracking-wide">
                                    {plan.name}
                                </CardTitle>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold font-heading">{formatPrice(plan.price_cents)}</span>
                                    {plan.price_cents > 0 && <span className="text-muted-foreground">/mês</span>}
                                </div>
                                {plan.description && (
                                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                                )}
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    {features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <Check className={`h-5 w-5 shrink-0 ${isPopular ? "text-primary" : "text-green-500"}`} />
                                            <span className="text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={btnConfig.action}
                                    disabled={btnConfig.disabled || changingPlan !== null}
                                    className={`w-full ${
                                        isPopular && !btnConfig.disabled
                                            ? "bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg shadow-primary/25"
                                            : ""
                                    }`}
                                    variant={isPopular && !btnConfig.disabled ? "default" : btnConfig.variant}
                                >
                                    {changingPlan === plan.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <>
                                            {btnConfig.icon}
                                            {btnConfig.label}
                                        </>
                                    )}
                                </Button>

                                {/* Botão secundário "Assinar Agora" quando em trial no plano atual */}
                                {isCurrentPlan &&
                                    subscription?.status === "trial" &&
                                    !isTrialExpired &&
                                    plan.price_cents > 0 && (
                                        <Button
                                            onClick={() => handleCheckout(plan)}
                                            disabled={changingPlan !== null}
                                            className="w-full"
                                            variant="outline"
                                            size="sm"
                                        >
                                            Assinar Agora
                                        </Button>
                                    )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="text-center text-sm text-muted-foreground">
                <p>✓ Cancele quando quiser &nbsp; ✓ Sem taxas ocultas &nbsp; ✓ Suporte por WhatsApp</p>
            </div>
        </div>
    );
};

export default PlansManager;
