import { AlertTriangle, Crown, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TrialBannerProps {
    daysRemaining: number;
    isExpired?: boolean;
    onUpgradeClick: () => void;
}

export const TrialBanner = ({ daysRemaining, isExpired = false, onUpgradeClick }: TrialBannerProps) => {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed && !isExpired) return null;

    // Trial expirado - banner fixo vermelho
    if (isExpired) {
        return (
            <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-3 shadow-lg">
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div>
                            <span className="font-semibold">Seu período de teste expirou!</span>
                            <p className="text-sm text-white/80">
                                Atualize seu plano para continuar usando todas as funcionalidades.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={onUpgradeClick}
                        size="sm"
                        className="bg-white text-red-600 hover:bg-white/90 font-semibold shrink-0"
                    >
                        <Crown className="h-4 w-4 mr-2" />
                        Fazer Upgrade
                    </Button>
                </div>
            </div>
        );
    }

    // Trial ativo mas expirando em breve - banner amarelo
    const urgency = daysRemaining <= 1 ? "high" : daysRemaining <= 3 ? "medium" : "low";
    const bgClass = {
        high: "bg-gradient-to-r from-orange-500 to-amber-500",
        medium: "bg-gradient-to-r from-amber-500 to-yellow-500",
        low: "bg-gradient-to-r from-violet-600 to-indigo-600",
    }[urgency];

    return (
        <div className={`${bgClass} text-white px-4 py-2.5 shadow-md`}>
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 shrink-0" />
                    <span className="text-sm sm:text-base">
                        <span className="font-semibold">Trial:</span>{" "}
                        {daysRemaining === 1 ? "Último dia!" : `${daysRemaining} dias restantes`}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={onUpgradeClick}
                        size="sm"
                        variant="secondary"
                        className="bg-white/20 hover:bg-white/30 text-white border-0 font-medium"
                    >
                        <Crown className="h-4 w-4 mr-1.5" />
                        Upgrade
                    </Button>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        aria-label="Fechar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrialBanner;
