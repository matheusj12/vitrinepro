import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price_cents: number;
    max_products: number;
    trial_days: number;
    features: string[];
    active: boolean;
}

interface Subscription {
    id: string;
    tenant_id: string;
    plan_id: string;
    status: "trial" | "active" | "past_due" | "canceled" | "inactive";
    started_at: string;
    trial_ends_at: string | null;
    payment_confirmed: boolean;
    plans?: Plan;
}

interface UseSubscriptionResult {
    subscription: Subscription | null;
    plan: Plan | null;
    isLoading: boolean;
    error: string | null;
    isTrialExpiring: boolean;
    isTrialExpired: boolean;
    daysRemaining: number | null;
    refetch: () => Promise<void>;
}

export const useSubscription = (tenantId: string | null): UseSubscriptionResult => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscription = async () => {
        if (!tenantId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const { data, error: fetchError } = await supabase
                .from("subscriptions")
                .select(`
          *,
          plans (*)
        `)
                .eq("tenant_id", tenantId)
                .maybeSingle();

            if (fetchError) {
                console.error("Error fetching subscription:", fetchError);
                setError("Erro ao carregar assinatura");
                setIsLoading(false);
                return;
            }

            if (data) {
                setSubscription(data as Subscription);
            }
            setIsLoading(false);
        } catch (err) {
            console.error("Unexpected error:", err);
            setError("Erro inesperado");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, [tenantId]);

    // Calcular dias restantes do trial
    const calculateDaysRemaining = (): number | null => {
        if (!subscription?.trial_ends_at) return null;
        const trialEnd = new Date(subscription.trial_ends_at);
        const now = new Date();
        const diffMs = trialEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysRemaining = calculateDaysRemaining();
    const isTrialExpiring = daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0;
    const isTrialExpired = daysRemaining !== null && daysRemaining <= 0 && subscription?.status === "trial";

    return {
        subscription,
        plan: subscription?.plans || null,
        isLoading,
        error,
        isTrialExpiring,
        isTrialExpired,
        daysRemaining,
        refetch: fetchSubscription,
    };
};
