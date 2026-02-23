import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    PageLayout,
    PageSection,
    SectionType,
    DEFAULT_PAGE_LAYOUT,
    SECTION_CATALOG,
    generateSectionId,
} from "@/types/sections";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    GripVertical,
    Eye,
    EyeOff,
    Trash2,
    Plus,
    Save,
    Sparkles,
    Lock,
    ChevronUp,
    ChevronDown,
    Settings2,
    LayoutPanelLeft,
    ArrowUpDown,
    Loader2,
    ExternalLink,
    Undo2,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { SectionEditor } from "./SectionEditor";

interface PageBuilderManagerProps {
    tenantId: string;
    slug?: string;
}

const PageBuilderManager = ({ tenantId, slug }: PageBuilderManagerProps) => {
    const queryClient = useQueryClient();
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [showCatalog, setShowCatalog] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Fetch current page_sections from store_settings
    const { data: storeSettings, isLoading } = useQuery({
        queryKey: ["store-settings-pagebuilder", tenantId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("store_settings")
                .select("*")
                .eq("tenant_id", tenantId)
                .single();
            if (error) throw error;
            return data;
        },
    });

    const currentLayout: PageLayout =
        (storeSettings as any)?.page_sections?.sections?.length > 0
            ? (storeSettings as any).page_sections
            : DEFAULT_PAGE_LAYOUT;

    const [sections, setSections] = useState<PageSection[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync sections when data loads
    React.useEffect(() => {
        if (currentLayout?.sections) {
            setSections(currentLayout.sections);
            setHasChanges(false);
        }
    }, [storeSettings]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (layout: PageLayout) => {
            const { error } = await supabase
                .from("store_settings")
                .update({ page_sections: layout } as any)
                .eq("tenant_id", tenantId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["store-settings-pagebuilder", tenantId] });
            queryClient.invalidateQueries({ queryKey: ["store-settings", tenantId] });
            toast.success("Layout salvo com sucesso!");
            setHasChanges(false);
        },
        onError: () => toast.error("Erro ao salvar layout"),
    });

    const updateSections = (newSections: PageSection[]) => {
        setSections(newSections);
        setHasChanges(true);
    };

    const handleSave = () => {
        saveMutation.mutate({ sections });
    };

    const handleReset = () => {
        setSections(currentLayout.sections);
        setHasChanges(false);
        toast.info("Alterações descartadas");
    };

    // Move section up/down
    const moveSection = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const newSections = [...sections];
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        updateSections(newSections);
    };

    // Toggle visibility
    const toggleVisibility = (index: number) => {
        const newSections = [...sections];
        if (newSections[index].locked) return; // Can't hide locked sections
        newSections[index] = { ...newSections[index], visible: !newSections[index].visible };
        updateSections(newSections);
    };

    // Remove section
    const removeSection = (index: number) => {
        if (sections[index].locked) return;
        const newSections = sections.filter((_, i) => i !== index);
        updateSections(newSections);
    };

    // Add section from catalog
    const addSection = (type: SectionType) => {
        const catalogItem = SECTION_CATALOG.find((c) => c.type === type);
        if (!catalogItem) return;

        const newSection: PageSection = {
            id: generateSectionId(),
            type,
            visible: true,
            config: { ...catalogItem.defaultConfig },
        };

        // Insert before footer if it exists
        const footerIndex = sections.findIndex((s) => s.type === "footer");
        const newSections = [...sections];
        if (footerIndex >= 0) {
            newSections.splice(footerIndex, 0, newSection);
        } else {
            newSections.push(newSection);
        }

        updateSections(newSections);
        setShowCatalog(false);
        setEditingSectionId(newSection.id);
        toast.success(`Seção "${catalogItem.label}" adicionada!`);
    };

    // Update section config
    const updateSectionConfig = (sectionId: string, config: any) => {
        const newSections = sections.map((s) =>
            s.id === sectionId ? { ...s, config } : s
        );
        updateSections(newSections);
    };

    // AI generation
    const handleGenerateAI = async () => {
        setIsGeneratingAI(true);
        try {
            const { data, error } = await supabase.functions.invoke("ai-generate-sections", {
                body: { tenantId },
            });
            if (error) throw error;
            if (data?.sections && Array.isArray(data.sections)) {
                // Insert AI sections before footer
                const footerIndex = sections.findIndex((s) => s.type === "footer");
                const newSections = [...sections];
                const aiSections: PageSection[] = data.sections.map((s: any) => ({
                    id: generateSectionId(),
                    type: s.type,
                    visible: true,
                    config: s.config || {},
                }));
                if (footerIndex >= 0) {
                    newSections.splice(footerIndex, 0, ...aiSections);
                } else {
                    newSections.push(...aiSections);
                }
                updateSections(newSections);
                toast.success(`${aiSections.length} seções geradas pela IA!`);
            } else {
                toast.info("IA não retornou seções. Tente novamente.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro ao gerar seções com IA. Verifique se a função está configurada.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const getSectionLabel = (type: SectionType): string => {
        const map: Record<string, string> = {
            header: "Header",
            hero_banner: "Banner Hero",
            product_stories: "Product Stories",
            product_reels: "Product Reels",
            categories_scroll: "Categorias",
            product_grid: "Produtos",
            footer: "Rodapé",
            bottom_nav: "Nav Mobile",
            cta: "Call to Action",
            brands_carousel: "Carrossel de Marcas",
            testimonials: "Depoimentos",
            newsletter: "Newsletter",
            image_text: "Imagem + Texto",
            faq: "FAQ",
            stats_counter: "Estatísticas",
            video_embed: "Vídeo",
            contact_map: "Contato / Mapa",
            spacer: "Espaçador",
            featured_products: "Destaques",
        };
        return map[type] || type;
    };

    const getSectionIcon = (type: SectionType) => {
        const iconMap: Record<string, string> = {
            header: "LayoutDashboard",
            hero_banner: "Image",
            product_stories: "CircleDot",
            product_reels: "Film",
            categories_scroll: "Tags",
            product_grid: "Grid3x3",
            footer: "AlignEndHorizontal",
            bottom_nav: "Smartphone",
            cta: "MousePointerClick",
            brands_carousel: "Award",
            testimonials: "MessageSquareQuote",
            newsletter: "Mail",
            image_text: "LayoutPanelLeft",
            faq: "HelpCircle",
            stats_counter: "TrendingUp",
            video_embed: "Play",
            contact_map: "MapPin",
            spacer: "SeparatorHorizontal",
            featured_products: "Star",
        };
        const iconName = iconMap[type] || "Box";
        const IconComponent = (LucideIcons as any)[iconName];
        return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Editing a section
    if (editingSectionId) {
        const section = sections.find((s) => s.id === editingSectionId);
        if (section) {
            return (
                <SectionEditor
                    section={section}
                    onSave={(config) => {
                        updateSectionConfig(section.id, config);
                        setEditingSectionId(null);
                    }}
                    onCancel={() => setEditingSectionId(null)}
                />
            );
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
                        <LayoutPanelLeft className="h-6 w-6 text-primary" />
                        Page Builder
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Arraste, adicione e configure as seções da sua vitrine
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {slug && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/${slug}`, "_blank")}
                        >
                            <ExternalLink className="h-4 w-4 mr-1" /> Ver Loja
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAI}
                        className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-200 hover:border-violet-300 text-violet-700 dark:text-violet-300"
                    >
                        {isGeneratingAI ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4 mr-1" />
                        )}
                        Gerar com IA
                    </Button>
                </div>
            </div>

            {/* Save bar */}
            {hasChanges && (
                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        Você tem alterações não salvas
                    </p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                            <Undo2 className="h-4 w-4 mr-1" /> Descartar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {saveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-1" />
                            )}
                            Salvar
                        </Button>
                    </div>
                </div>
            )}

            {/* Section List */}
            <div className="space-y-2">
                {sections.map((section, index) => (
                    <div
                        key={section.id}
                        className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all ${section.visible
                            ? "bg-card border-border/50 hover:border-primary/30 hover:shadow-sm"
                            : "bg-muted/30 border-border/30 opacity-60"
                            } ${section.locked ? "" : "cursor-grab"}`}
                    >
                        {/* Drag Handle / Lock */}
                        <div className="flex-shrink-0 text-muted-foreground">
                            {section.locked ? (
                                <Lock className="h-4 w-4 text-primary/50" />
                            ) : (
                                <ArrowUpDown className="h-4 w-4" />
                            )}
                        </div>

                        {/* Icon + Name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                {getSectionIcon(section.type)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{getSectionLabel(section.type)}</p>
                                {section.locked && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5">
                                        Obrigatório
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Move buttons */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveSection(index, "up")}
                                disabled={index === 0}
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveSection(index, "down")}
                                disabled={index === sections.length - 1}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>

                            {/* Edit */}
                            {!section.locked && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setEditingSectionId(section.id)}
                                >
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            )}

                            {/* Toggle visibility */}
                            {!section.locked && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => toggleVisibility(index)}
                                >
                                    {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                            )}

                            {/* Delete */}
                            {!section.locked && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:text-destructive"
                                    onClick={() => removeSection(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Section Button */}
            <div className="border-2 border-dashed border-border/50 rounded-xl p-4">
                {showCatalog ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-heading font-bold text-sm">Adicionar Seção</h4>
                            <Button variant="ghost" size="sm" onClick={() => setShowCatalog(false)}>
                                Cancelar
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {SECTION_CATALOG.filter((c) => !c.locked).map((item) => {
                                const IconComponent = (LucideIcons as any)[item.icon];
                                return (
                                    <button
                                        key={item.type}
                                        onClick={() => addSection(item.type)}
                                        className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent hover:border-primary/30 transition-all text-left group"
                                    >
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                            {IconComponent && <IconComponent className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{item.label}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                                                {item.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        className="w-full h-12 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCatalog(true)}
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Adicionar Seção
                    </Button>
                )}
            </div>

            {/* Tip */}
            <p className="text-center text-xs text-muted-foreground">
                💡 Use o botão <strong>"Gerar com IA"</strong> para criar seções automaticamente baseadas no seu nicho
            </p>
        </div>
    );
};

export default PageBuilderManager;
