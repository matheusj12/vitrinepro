import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Search,
    Plus,
    Package,
    Tags,
    Settings,
    BarChart3,
    Palette,
    Bell,
    Image,
    FileText,
    ExternalLink,
    Moon,
    Sun,
    Keyboard
} from "lucide-react";

interface CommandPaletteProps {
    onNavigate: (tab: string) => void;
    onAction: (action: string) => void;
    tenantSlug?: string;
}

export const CommandPalette = ({ onNavigate, onAction, tenantSlug }: CommandPaletteProps) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
                e.preventDefault();
                setOpen(true);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            {/* Trigger button */}
            <Button
                variant="outline"
                className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline-flex">Buscar ou executar...</span>
                <span className="inline-flex lg:hidden">Buscar...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Digite um comando ou busque..." />
                <CommandList>
                    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

                    <CommandGroup heading="Ações Rápidas">
                        <CommandItem
                            onSelect={() => runCommand(() => onAction("new-product"))}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Novo Produto</span>
                            <kbd className="ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 hidden sm:flex">
                                N
                            </kbd>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => onAction("new-category"))}
                        >
                            <Tags className="mr-2 h-4 w-4" />
                            <span>Nova Categoria</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => onAction("new-banner"))}
                        >
                            <Image className="mr-2 h-4 w-4" />
                            <span>Novo Banner</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Navegação">
                        <CommandItem
                            onSelect={() => runCommand(() => onNavigate("products"))}
                        >
                            <Package className="mr-2 h-4 w-4" />
                            <span>Produtos</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => onNavigate("categories"))}
                        >
                            <Tags className="mr-2 h-4 w-4" />
                            <span>Categorias</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => onNavigate("banners"))}
                        >
                            <Image className="mr-2 h-4 w-4" />
                            <span>Banners</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => onNavigate("quotes"))}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Orçamentos</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => onNavigate("analytics"))}
                        >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            <span>Analytics</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => onNavigate("themes"))}
                        >
                            <Palette className="mr-2 h-4 w-4" />
                            <span>Aparência</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => onNavigate("notifications"))}
                        >
                            <Bell className="mr-2 h-4 w-4" />
                            <span>Notificações</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => onNavigate("settings"))}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Links">
                        {tenantSlug && (
                            <CommandItem
                                onSelect={() => runCommand(() => {
                                    window.open(`/loja/${tenantSlug}`, '_blank');
                                })}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                <span>Abrir Vitrine</span>
                            </CommandItem>
                        )}
                        <CommandItem
                            onSelect={() => runCommand(() => onAction("copy-link"))}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            <span>Copiar Link da Vitrine</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Preferências">
                        <CommandItem
                            onSelect={() => runCommand(() => onAction("toggle-theme"))}
                        >
                            <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span>Alternar Tema</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => onAction("show-shortcuts"))}
                        >
                            <Keyboard className="mr-2 h-4 w-4" />
                            <span>Atalhos de Teclado</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
};

export default CommandPalette;
