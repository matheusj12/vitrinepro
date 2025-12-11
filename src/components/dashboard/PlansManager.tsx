import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";
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
    features: unknown; // Json from Supabase
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

    const handleSelectPlan = async (plan: Plan) => {
        if (plan.id === currentPlan?.id) {
            toast.info("Você já está neste plano");
            return;
        }

        // Se é plano pago, por enquanto só mostra mensagem
        // TODO: Integrar com gateway de pagamento
        if (plan.price_cents > 0) {
            toast.info("Integração de pagamento em breve!", {
                description: "Entre em contato pelo WhatsApp para fazer upgrade.",
                duration: 5000,
            });
            return;
        }

        // Se é plano gratuito, pode fazer downgrade direto
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

    const formatPrice = (cents: number) => {
        if (cents === 0) return "Grátis";
        return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
    };

    const getFeaturesList = (plan: Plan): string[] => {
        // Se features é um array de strings, use diretamente
        if (Array.isArray(plan.features)) {
            return plan.features.map((f: any) => (typeof f === "string" ? f : f.name || f.label || JSON.stringify(f)));
        }
        return [];
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
                <p className="text-muted-foreground mt-2">
                    {isTrialExpired
                        ? "Seu trial expirou. Escolha um plano para continuar."
                        : daysRemaining
                            ? `Você está no trial - ${daysRemaining} dias restantes`
                            : "Faça upgrade para desbloquear mais recursos"}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isCurrentPlan = plan.id === currentPlan?.id;
                    const isPopular = plan.slug === "pro";
                    const features = getFeaturesList(plan);

                    return (
                        <Card
                            key={plan.id}
                            className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${isPopular ? "border-2 border-primary shadow-lg shadow-primary/10" : ""
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
                                    {plan.max_products > 0 && (
                                        <div className="flex items-center gap-3">
                                            <Check className={`h-5 w-5 shrink-0 ${isPopular ? "text-primary" : "text-green-500"}`} />
                                            <span className="text-sm">Até {plan.max_products} produtos</span>
                                        </div>
                                    )}
                                    {plan.max_products === -1 && (
                                        <div className="flex items-center gap-3">
                                            <Check className={`h-5 w-5 shrink-0 ${isPopular ? "text-primary" : "text-green-500"}`} />
                                            <span className="text-sm font-medium">Produtos ilimitados</span>
                                        </div>
                                    )}
                                    {plan.trial_days > 0 && (
                                        <div className="flex items-center gap-3">
                                            <Zap className={`h-5 w-5 shrink-0 ${isPopular ? "text-primary" : "text-amber-500"}`} />
                                            <span className="text-sm">{plan.trial_days} dias de teste grátis</span>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={isCurrentPlan || changingPlan !== null}
                                    className={`w-full ${isPopular
                                        ? "bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg shadow-primary/25"
                                        : ""
                                        }`}
                                    variant={isPopular ? "default" : "outline"}
                                >
                                    {changingPlan === plan.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : isCurrentPlan ? (
                                        <>
                                            <Crown className="h-4 w-4 mr-2" />
                                            Plano Atual
                                        </>
                                    ) : plan.price_cents > 0 ? (
                                        `Testar ${plan.trial_days} dias grátis`
                                    ) : (
                                        "Selecionar"
                                    )}
                                </Button>
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
