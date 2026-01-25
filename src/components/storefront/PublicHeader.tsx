import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useCart } from "@/hooks/useCart";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface PublicHeaderProps {
  storeName: string;
  logoUrl?: string;
  whatsappNumber?: string;
  // Links configurados pelo cliente
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  whatsappBusinessUrl?: string;
  pinterestUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  // Ícones enviados pelo Super Admin (URLs públicas)
  instagramIcon?: string;
  facebookIcon?: string;
  tiktokIcon?: string;
  youtubeIcon?: string;
  whatsappIcon?: string;
  pinterestIcon?: string;
  twitterIcon?: string;
  linkedinIcon?: string;

  categories: Category[];
  slug: string;
}

export const PublicHeader = ({
  storeName,
  logoUrl,
  whatsappNumber,
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  youtubeUrl,
  whatsappBusinessUrl,
  pinterestUrl,
  twitterUrl,
  linkedinUrl,
  instagramIcon,
  facebookIcon,
  tiktokIcon,
  youtubeIcon,
  whatsappIcon,
  pinterestIcon,
  twitterIcon,
  linkedinIcon,
  categories,
  slug,
}: PublicHeaderProps) => {
  const { getTotalItems } = useCart();
  const cartItemsCount = getTotalItems();

  const SocialIcon = ({ icon, label, url }: { icon?: string; label: string; url?: string }) => {
    if (!url || !icon) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        aria-label={label}
        className="p-2 rounded-md hover:bg-accent transition-colors"
      >
        <img src={icon} alt={label} className="h-5 w-5" />
      </a>
    );
  };

  const whatsappQuickLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : undefined;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to={`/loja/${slug}`} className="flex items-center gap-2 group outline-none">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 font-bold text-white text-xl">
                {storeName.charAt(0).toUpperCase()}
              </div>
              <span className="font-heading font-bold text-xl hidden sm:inline tracking-tight text-foreground/90">
                {storeName}
              </span>
            </div>
          )}
        </Link>

        {/* Navigation Menu - Ajustado para ser mais visível */}
        <div className="hidden md:flex items-center justify-center flex-1 px-8">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <Link to={`/loja/${slug}`}>
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-full bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Início
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to={`/loja/${slug}/sobre`}>
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-full bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                    Sobre a Loja
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Actions (social + cart) */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 border-r pr-2 mr-2 border-border/50">
            {/* Redes sociais com tooltip nativo básico para clareza */}
            <SocialIcon icon={instagramIcon} label="Instagram" url={instagramUrl} />
            <SocialIcon icon={facebookIcon} label="Facebook" url={facebookUrl} />
            <SocialIcon icon={tiktokIcon} label="TikTok" url={tiktokUrl} />
            <SocialIcon icon={youtubeIcon} label="YouTube" url={youtubeUrl} />
            <SocialIcon icon={whatsappIcon} label="WhatsApp" url={whatsappBusinessUrl || whatsappQuickLink} />
          </div>

          {/* Cart Button - Redesigned */}
          <Link to={`/loja/${slug}/carrinho`}>
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full h-10 w-10 border-border/50 bg-background/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 group"
              aria-label="Abrir carrinho"
            >
              <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center ring-2 ring-background group-hover:bg-white group-hover:text-primary animate-in zoom-in-50">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};