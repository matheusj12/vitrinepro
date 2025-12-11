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
    <header className="sticky top-0 z-50 w-full border-b glass transition-all duration-300">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to={`/loja/${slug}`} className="flex items-center gap-2 group">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 font-bold text-white text-xl">
                {storeName.charAt(0).toUpperCase()}
              </div>
              <span className="font-heading font-bold text-xl hidden sm:inline tracking-tight text-foreground/90">
                {storeName}
              </span>
            </div>
          )}
        </Link>

        {/* Navigation Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to={`/loja/${slug}`}>
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {categories.length > 0 && (
              <NavigationMenuItem>
                <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link to={`/loja/${slug}/categoria/${category.slug}`}>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="text-sm font-medium leading-none">
                              {category.name}
                            </div>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Actions (social + cart) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Redes sociais: renderiza somente quando houver link (cliente) + ícone (super admin) */}
          <SocialIcon icon={instagramIcon} label="Instagram" url={instagramUrl} />
          <SocialIcon icon={facebookIcon} label="Facebook" url={facebookUrl} />
          <SocialIcon icon={tiktokIcon} label="TikTok" url={tiktokUrl} />
          <SocialIcon icon={youtubeIcon} label="YouTube" url={youtubeUrl} />
          <SocialIcon icon={whatsappIcon} label="WhatsApp" url={whatsappBusinessUrl || whatsappQuickLink} />
          <SocialIcon icon={pinterestIcon} label="Pinterest" url={pinterestUrl} />
          <SocialIcon icon={twitterIcon} label="X / Twitter" url={twitterUrl} />
          <SocialIcon icon={linkedinIcon} label="LinkedIn" url={linkedinUrl} />

          {/* Cart */}
          <Link to={`/loja/${slug}/carrinho`}>
            <Button variant="ghost" size="icon" className="relative" aria-label="Abrir carrinho">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
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