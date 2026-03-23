import { Home, Search, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface StorefrontBottomNavProps {
  slug: string;
  cartCount: number;
  whatsappNumber?: string;
  tenantName?: string;
}

export const StorefrontBottomNav = ({
  slug,
  cartCount,
  whatsappNumber,
  tenantName,
}: StorefrontBottomNavProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
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

  const isActive = (path: string) => location.pathname === path;

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá${tenantName ? `, ${tenantName}` : ""}! Vim pela loja online e gostaria de mais informações.`
      )}`
    : null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-background/90 backdrop-blur-xl border-t border-border/40",
        "transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex items-center h-16 px-2 pb-safe">
        {/* Início */}
        <Link
          to={`/loja/${slug}`}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
            isActive(`/loja/${slug}`)
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className={cn(
            "relative p-1.5 rounded-xl transition-all duration-200",
            isActive(`/loja/${slug}`) && "bg-primary/10"
          )}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Início</span>
        </Link>

        {/* Buscar */}
        <button
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>("[data-search-input]");
            if (input) {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setTimeout(() => input.focus(), 300);
            }
          }}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="p-1.5 rounded-xl">
            <Search className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Buscar</span>
        </button>

        {/* Sacola */}
        <Link
          to={`/loja/${slug}/carrinho`}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
            isActive(`/loja/${slug}/carrinho`)
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className={cn(
            "relative p-1.5 rounded-xl transition-all duration-200",
            isActive(`/loja/${slug}/carrinho`) && "bg-primary/10"
          )}>
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-primary rounded-full border-2 border-background animate-in zoom-in">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Sacola</span>
        </Link>

        {/* WhatsApp */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 group"
          >
            <div className="relative p-1 rounded-xl">
              {/* Botão verde destacado */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md group-active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}>
                <svg viewBox="0 0 32 32" className="w-5 h-5 fill-white">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.476 2.027 7.782L0 32l8.456-2.007A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.28 13.28 0 01-6.787-1.856l-.487-.29-5.02 1.192 1.213-4.89-.317-.503A13.27 13.27 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.907c-.397-.199-2.35-1.16-2.715-1.29-.364-.133-.629-.2-.893.2-.265.397-1.026 1.29-1.258 1.556-.232.265-.463.298-.86.1-.397-.2-1.677-.618-3.194-1.972-1.18-1.053-1.977-2.352-2.209-2.75-.232-.397-.025-.611.175-.809.178-.178.397-.464.596-.695.2-.232.265-.397.397-.662.133-.265.066-.497-.033-.695-.1-.2-.893-2.152-1.224-2.947-.322-.773-.65-.668-.893-.68-.231-.012-.497-.014-.762-.014s-.695.1-1.059.497c-.364.397-1.39 1.358-1.39 3.31s1.423 3.84 1.622 4.106c.2.265 2.8 4.276 6.785 5.995.948.41 1.688.654 2.265.837.952.303 1.818.26 2.502.158.763-.114 2.35-.96 2.682-1.888.332-.928.332-1.723.232-1.888-.099-.166-.364-.265-.761-.464z" />
                </svg>
              </div>
            </div>
            <span className="text-[10px] font-medium text-[#128C7E] dark:text-[#25D366]">WhatsApp</span>
          </a>
        ) : (
          /* Fallback se não tiver WhatsApp: mostra ícone de contato inativo */
          <div className="flex flex-col items-center justify-center flex-1 h-full gap-1 opacity-30 pointer-events-none">
            <div className="p-1.5">
              <svg viewBox="0 0 32 32" className="w-5 h-5 fill-muted-foreground">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.476 2.027 7.782L0 32l8.456-2.007A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium">WhatsApp</span>
          </div>
        )}
      </div>
    </div>
  );
};
