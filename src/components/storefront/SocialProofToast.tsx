
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Eye, TrendingUp } from "lucide-react";

interface SocialProofNotification {
    id: string;
    name: string;
    city: string;
    action: "bought" | "viewed" | "added";
    product: string;
    timeAgo: string;
}

const FIRST_NAMES = [
    "Maria", "João", "Ana", "Pedro", "Julia", "Lucas", "Camila", "Gabriel",
    "Beatriz", "Matheus", "Larissa", "Felipe", "Amanda", "Rafael", "Isabela",
    "Bruno", "Letícia", "Thiago", "Carolina", "Diego"
];

const CITIES = [
    "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre",
    "Salvador", "Fortaleza", "Brasília", "Recife", "Campinas", "Goiânia",
    "Manaus", "Florianópolis", "Santos", "Vitória"
];

const TIME_AGOS = [
    "agora mesmo", "há 1 minuto", "há 2 minutos", "há 3 minutos", "há 5 minutos"
];

interface SocialProofToastProps {
    productNames: string[];
    viewersCount?: number;
    enabled?: boolean;
}

export const SocialProofToast = ({
    productNames,
    viewersCount = 0,
    enabled = true,
}: SocialProofToastProps) => {
    const [currentNotification, setCurrentNotification] = useState<SocialProofNotification | null>(null);
    const [realViewers, setRealViewers] = useState(viewersCount);

    // Generate random notification
    const generateNotification = useCallback((): SocialProofNotification => {
        const actions: Array<"bought" | "viewed" | "added"> = ["bought", "added", "viewed"];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        const product = productNames.length > 0
            ? productNames[Math.floor(Math.random() * productNames.length)]
            : "um produto";
        const timeAgo = TIME_AGOS[Math.floor(Math.random() * TIME_AGOS.length)];

        return {
            id: Date.now().toString(),
            name,
            city,
            action,
            product: product.length > 30 ? product.substring(0, 30) + "..." : product,
            timeAgo,
        };
    }, [productNames]);

    // Show notifications periodically
    useEffect(() => {
        if (!enabled || productNames.length === 0) return;

        // Initial delay
        const initialTimeout = setTimeout(() => {
            setCurrentNotification(generateNotification());
        }, 3000);

        // Periodic notifications
        const interval = setInterval(() => {
            setCurrentNotification(generateNotification());

            // Auto-hide after 4 seconds
            setTimeout(() => setCurrentNotification(null), 4000);
        }, 15000 + Math.random() * 10000); // 15-25 seconds random interval

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [enabled, productNames, generateNotification]);

    // Simulate viewer count fluctuation
    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(() => {
            setRealViewers((prev) => {
                const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
                return Math.max(1, prev + change);
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [enabled]);

    const getActionText = (action: "bought" | "viewed" | "added") => {
        switch (action) {
            case "bought":
                return "comprou";
            case "added":
                return "adicionou ao carrinho";
            case "viewed":
                return "está vendo";
        }
    };

    const getActionIcon = (action: "bought" | "viewed" | "added") => {
        switch (action) {
            case "bought":
                return <ShoppingBag className="w-4 h-4 text-green-500" />;
            case "added":
                return <ShoppingBag className="w-4 h-4 text-primary" />;
            case "viewed":
                return <Eye className="w-4 h-4 text-blue-500" />;
        }
    };

    if (!enabled) return null;

    return (
        <>
            {/* Toast notification */}
            <AnimatePresence>
                {currentNotification && (
                    <motion.div
                        key={currentNotification.id}
                        initial={{ opacity: 0, x: -100, y: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-20 left-4 z-40 max-w-[280px] bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-3"
                    >
                        <div className="flex items-start gap-3">
                            {/* Avatar placeholder */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                {currentNotification.name.charAt(0)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    {getActionIcon(currentNotification.action)}
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {currentNotification.timeAgo}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-foreground leading-snug">
                                    <span className="font-bold">{currentNotification.name}</span>{" "}
                                    de {currentNotification.city}{" "}
                                    {getActionText(currentNotification.action)}{" "}
                                    <span className="text-primary font-semibold">
                                        {currentNotification.product}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Live viewers counter */}
            {realViewers > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed bottom-20 left-4 z-30 bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-foreground">
                        <span className="font-bold">{realViewers}</span> pessoas vendo agora
                    </span>
                </motion.div>
            )}
        </>
    );
};

export default SocialProofToast;
