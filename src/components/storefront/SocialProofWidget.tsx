import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Eye, Users, Clock } from "lucide-react";

interface SocialProofWidgetProps {
    tenantId: string;
    productName?: string;
    enabled?: boolean;
}

// Simulated data - in production, this would fetch from analytics
const names = [
    "Maria", "João", "Ana", "Pedro", "Carla", "Lucas",
    "Juliana", "Rafael", "Fernanda", "Marcelo", "Patricia",
    "Bruno", "Camila", "Diego", "Amanda"
];

const cities = [
    "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba",
    "Porto Alegre", "Salvador", "Brasília", "Fortaleza", "Recife"
];

const actions = [
    { type: "view", icon: Eye, message: "visualizou este produto" },
    { type: "cart", icon: ShoppingCart, message: "adicionou ao carrinho" },
    { type: "buy", icon: ShoppingCart, message: "acabou de comprar" },
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomTime = () => Math.floor(Math.random() * 10) + 1;

interface Notification {
    id: number;
    name: string;
    city: string;
    action: typeof actions[0];
    time: number;
}

export const SocialProofWidget = ({ tenantId, productName, enabled = true }: SocialProofWidgetProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
    const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 15) + 3);

    useEffect(() => {
        if (!enabled) return;

        // Generate initial notifications
        const initialNotifications: Notification[] = Array.from({ length: 5 }, (_, i) => ({
            id: i,
            name: getRandomItem(names),
            city: getRandomItem(cities),
            action: getRandomItem(actions),
            time: getRandomTime(),
        }));
        setNotifications(initialNotifications);

        // Show notifications periodically
        const showNotification = () => {
            const notification: Notification = {
                id: Date.now(),
                name: getRandomItem(names),
                city: getRandomItem(cities),
                action: getRandomItem(actions),
                time: getRandomTime(),
            };

            setCurrentNotification(notification);

            // Hide after 4 seconds
            setTimeout(() => {
                setCurrentNotification(null);
            }, 4000);
        };

        // Show first notification after 5 seconds
        const initialTimeout = setTimeout(showNotification, 5000);

        // Then show every 15-30 seconds
        const interval = setInterval(() => {
            if (Math.random() > 0.3) { // 70% chance to show
                showNotification();
            }
        }, Math.random() * 15000 + 15000);

        // Update viewer count periodically
        const viewerInterval = setInterval(() => {
            setViewerCount(prev => {
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                return Math.max(1, Math.min(prev + change, 50));
            });
        }, 10000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
            clearInterval(viewerInterval);
        };
    }, [enabled]);

    if (!enabled) return null;

    return (
        <>
            {/* Viewer count badge */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-24 left-4 z-40 hidden md:flex items-center gap-2 bg-background/90 backdrop-blur-sm border rounded-full px-3 py-1.5 shadow-lg"
            >
                <div className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{viewerCount}</strong> pessoas vendo agora
                </span>
            </motion.div>

            {/* Notification toast */}
            <AnimatePresence>
                {currentNotification && (
                    <motion.div
                        initial={{ opacity: 0, x: -100, y: 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-36 left-4 z-40 max-w-xs"
                    >
                        <div className="bg-background/95 backdrop-blur-sm border rounded-xl shadow-xl p-4 flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                    {currentNotification.name[0]}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {currentNotification.name} de {currentNotification.city}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <currentNotification.action.icon className="h-3 w-3" />
                                    {currentNotification.action.message}
                                    {productName && ` - ${productName}`}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    há {currentNotification.time} minuto{currentNotification.time > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SocialProofWidget;
