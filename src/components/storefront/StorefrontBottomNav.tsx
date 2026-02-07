
import { Home, Search, ShoppingBag, Menu, User } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";

interface StorefrontBottomNavProps {
    slug: string;
    cartCount: number;
}

export const StorefrontBottomNav = ({ slug, cartCount }: StorefrontBottomNavProps) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show on scroll up, hide on scroll down (but always show near top)
            if (currentScrollY < 50) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const navItems = [
        { icon: Home, label: "Início", path: `/loja/${slug}` },
        { icon: Search, label: "Buscar", path: "#search" },
        { icon: ShoppingBag, label: "Sacola", path: `/loja/${slug}/carrinho`, badge: cartCount },
        { icon: User, label: "Perfil", path: "#profile" },
    ];

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/50 pb-safe transition-transform duration-300 md:hidden",
                isVisible ? "translate-y-0" : "translate-y-full"
            )}
        >
            <div className="flex items-center justify-around h-16 px-2 pb-2">
                {navItems.map((item, index) => (
                    <Link
                        key={index}
                        to={item.path}
                        onClick={(e) => {
                            if (item.path.startsWith("#")) {
                                e.preventDefault();
                                if (item.path === "#search") {
                                    const searchInput = document.querySelector('input[type="text"]');
                                    if (searchInput) (searchInput as HTMLElement).focus();
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }
                        }}
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary active:scale-95 transition-all relative"
                    >
                        <div className="relative p-1">
                            <item.icon className="w-6 h-6" />
                            {item.badge ? (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-primary rounded-full animate-in zoom-in border border-background">
                                    {item.badge}
                                </span>
                            ) : null}
                        </div>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};
