import React, { useState } from "react";
import {
    PageSection,
    SectionConfigMap,
    TestimonialItem,
    FAQItem,
    StatsItem,
    BrandLogo,
} from "@/types/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

/** Config mutável durante edição de formulário — permite acesso por string key */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EditableConfig = Record<string, any>;

interface SectionEditorProps {
    section: PageSection;
    /** Recebe o config final tipado antes de salvar */
    onSave: (config: EditableConfig) => void;
    onCancel: () => void;
}

export const SectionEditor = ({ section, onSave, onCancel }: SectionEditorProps) => {
    const [config, setConfig] = useState<EditableConfig>({ ...(section.config as EditableConfig) });

    const update = (key: string, value: unknown) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    const renderFields = () => {
        switch (section.type) {
            case "cta":
                return (
                    <>
                        <Field label="Título" value={config.title} onChange={(v) => update("title", v)} />
                        <Field label="Subtítulo" value={config.subtitle} onChange={(v) => update("subtitle", v)} />
                        <Field label="Texto do Botão" value={config.buttonText} onChange={(v) => update("buttonText", v)} />
                        <Field label="Link do Botão" value={config.buttonLink} onChange={(v) => update("buttonLink", v)} />
                        <Field label="URL da Imagem" value={config.imageUrl} onChange={(v) => update("imageUrl", v)} />
                        <SelectField
                            label="Layout"
                            value={config.layout}
                            options={[
                                { value: "image-left", label: "Imagem à Esquerda" },
                                { value: "image-right", label: "Imagem à Direita" },
                                { value: "centered", label: "Centralizado" },
                                { value: "full-bg", label: "Fundo Completo" },
                            ]}
                            onChange={(v) => update("layout", v)}
                        />
                        <ColorField label="Cor de Fundo" value={config.bgColor} onChange={(v) => update("bgColor", v)} />
                        <ColorField label="Cor do Texto" value={config.textColor} onChange={(v) => update("textColor", v)} />
                    </>
                );

            case "image_text":
                return (
                    <>
                        <Field label="Título" value={config.title} onChange={(v) => update("title", v)} />
                        <TextareaField label="Texto" value={config.text} onChange={(v) => update("text", v)} />
                        <Field label="URL da Imagem" value={config.imageUrl} onChange={(v) => update("imageUrl", v)} />
                        <SelectField
                            label="Layout"
                            value={config.layout}
                            options={[
                                { value: "image-left", label: "Imagem à Esquerda" },
                                { value: "image-right", label: "Imagem à Direita" },
                            ]}
                            onChange={(v) => update("layout", v)}
                        />
                        <ColorField label="Cor de Fundo" value={config.bgColor} onChange={(v) => update("bgColor", v)} />
                    </>
                );

            case "newsletter":
                return (
                    <>
                        <Field label="Título" value={config.title} onChange={(v) => update("title", v)} />
                        <Field label="Subtítulo" value={config.subtitle} onChange={(v) => update("subtitle", v)} />
                        <Field label="Texto do Botão" value={config.buttonText} onChange={(v) => update("buttonText", v)} />
                        <ColorField label="Cor de Fundo" value={config.bgColor} onChange={(v) => update("bgColor", v)} />
                    </>
                );

            case "video_embed":
                return (
                    <>
                        <Field label="Título" value={config.title} onChange={(v) => update("title", v)} />
                        <Field label="URL do Vídeo (YouTube/Vimeo)" value={config.videoUrl} onChange={(v) => update("videoUrl", v)} />
                    </>
                );

            case "brands_carousel":
                return (
                    <>
                        <Field label="Título" value={config.title} onChange={(v) => update("title", v)} />
                        <SelectField
                            label="Velocidade"
                            value={config.speed}
                            options={[
                                { value: "slow", label: "Lento" },
                                { value: "normal", label: "Normal" },
                                { value: "fast", label: "Rápido" },
                            ]}
                            onChange={(v) => update("speed", v)}
                        />
                        <SelectField
                            label="Tamanho do Logo"
                            value={config.logoSize || "medium"}
                            options={[
                                { value: "small", label: "Pequeno" },
                                { value: "medium", label: "Médio" },
                                { value: "large", label: "Grande" },
                            ]}
                            onChange={(v) => update("logoSize", v)}
                        />
                        <ArrayField
                            label="Logos (URLs das imagens)"
                            items={((config.logos as BrandLogo[] | undefined) || []).map((l) => (typeof l === "string" ? l : l.url))}
                            onUpdate={(items) => update("logos", items.map((url) => ({ url, name: "" })))}
                        />
                    </>
                );

            case "testimonials":
                return (
                    <>
                        <Field label="Título" value={config.title} onChange={(v) => update("title", v)} />
                        <SelectField
                            label="Layout"
                            value={config.layout}
                            options={[
                                { value: "cards", label: "Cards em Grid" },
                                { value: "carousel", label: "Carrossel" },
                            ]}
                            onChange={(v) => update("layout", v)}
                        />
                        <TestimonialsEditor
                            items={config.items || []}
                            onUpdate={(items) => update("items", items)}
                        />
                    </>
                );

            case "faq":
                return (
                    <>
                        <Field label="Título" value={config.title} onChange={(v) => update("title", v)} />
                        <FAQEditor
                            items={config.items || []}
                            onUpdate={(items) => update("items", items)}
                        />
                    </>
                );

            case "stats_counter":
                return (
                    <>
                        <ColorField label="Cor de Fundo" value={config.bgColor} onChange={(v) => update("bgColor", v)} />
                        <StatsEditor
                            items={config.items || []}
                            onUpdate={(items) => update("items", items)}
                        />
                    </>
                );

            case "contact_map":
                return (
                    <>
                        <Field label="Título" value={config.title} onChange={(v) => update("title", v)} />
                        <Field label="WhatsApp" value={config.whatsapp} onChange={(v) => update("whatsapp", v)} />
                        <Field label="E-mail" value={config.email} onChange={(v) => update("email", v)} />
                        <TextareaField label="Endereço" value={config.address} onChange={(v) => update("address", v)} />
                        <Field label="URL do Google Maps (embed)" value={config.mapsEmbedUrl} onChange={(v) => update("mapsEmbedUrl", v)} />
                    </>
                );

            case "featured_products":
                return (
                    <>
                        <Field label="Título" value={config.title} onChange={(v) => update("title", v)} />
                        <Field label="Máximo de Itens" value={config.maxItems?.toString()} onChange={(v) => update("maxItems", parseInt(v) || 8)} />
                        <SelectField
                            label="Layout"
                            value={config.layout}
                            options={[
                                { value: "grid", label: "Grid" },
                                { value: "carousel", label: "Carrossel" },
                            ]}
                            onChange={(v) => update("layout", v)}
                        />
                    </>
                );

            case "spacer":
                return (
                    <>
                        <SelectField
                            label="Altura"
                            value={config.height}
                            options={[
                                { value: "small", label: "Pequeno" },
                                { value: "medium", label: "Médio" },
                                { value: "large", label: "Grande" },
                            ]}
                            onChange={(v) => update("height", v)}
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={config.showDivider || false}
                                onChange={(e) => update("showDivider", e.target.checked)}
                                className="rounded"
                            />
                            <Label className="text-sm">Mostrar divisor</Label>
                        </div>
                    </>
                );

            case "hero_banner":
                return (
                    <>
                        <SelectField
                            label="Altura"
                            value={config.height}
                            options={[
                                { value: "small", label: "Pequeno" },
                                { value: "medium", label: "Médio" },
                                { value: "large", label: "Grande" },
                                { value: "full", label: "Tela Cheia" },
                            ]}
                            onChange={(v) => update("height", v)}
                        />
                    </>
                );

            default:
                return (
                    <p className="text-sm text-muted-foreground py-4">
                        Esta seção não possui configurações editáveis no momento.
                    </p>
                );
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onCancel}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h3 className="font-heading font-bold text-lg">Editar Seção</h3>
                    <p className="text-sm text-muted-foreground capitalize">{section.type.replace(/_/g, " ")}</p>
                </div>
            </div>

            <div className="space-y-4 bg-card border border-border/50 rounded-xl p-6">
                {renderFields()}
            </div>

            <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button onClick={() => onSave(config)}>
                    <Save className="h-4 w-4 mr-1" /> Aplicar
                </Button>
            </div>
        </div>
    );
};

// ---- Reusable Field Components ----

const Field = ({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) => (
    <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
);

const TextareaField = ({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) => (
    <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        <Textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={4} />
    </div>
);

const ColorField = ({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) => (
    <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex gap-2 items-center">
            <input
                type="color"
                value={value || "#000000"}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-14 rounded border cursor-pointer"
            />
            <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="flex-1" />
        </div>
    </div>
);

const SelectField = ({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value?: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) => (
    <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        <select
            value={value || options[0]?.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    </div>
);

const ArrayField = ({ label, items, onUpdate }: { label: string; items: string[]; onUpdate: (items: string[]) => void }) => (
    <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        {items.map((item, i) => (
            <div key={i} className="flex gap-2">
                <Input value={item} onChange={(e) => { const n = [...items]; n[i] = e.target.value; onUpdate(n); }} />
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => onUpdate(items.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onUpdate([...items, ""])}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
    </div>
);

// ---- Complex Sub-Editors ----

const TestimonialsEditor = ({ items, onUpdate }: { items: TestimonialItem[]; onUpdate: (items: TestimonialItem[]) => void }) => (
    <div className="space-y-3">
        <Label className="text-sm font-medium">Depoimentos</Label>
        {items.map((item, i) => (
            <div key={i} className="p-4 border rounded-xl space-y-2 bg-muted/30">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Depoimento {i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdate(items.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
                <Input placeholder="Nome" value={item.name || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], name: e.target.value }; onUpdate(n); }} />
                <Textarea placeholder="Texto do depoimento" value={item.text || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], text: e.target.value }; onUpdate(n); }} rows={2} />
                <Input placeholder="Cargo / Função" value={item.role || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], role: e.target.value }; onUpdate(n); }} />
                <div className="flex items-center gap-2">
                    <Label className="text-xs">Nota:</Label>
                    <select
                        value={item.rating || 5}
                        onChange={(e) => { const n = [...items]; n[i] = { ...n[i], rating: parseInt(e.target.value) }; onUpdate(n); }}
                        className="h-8 px-2 rounded border text-sm"
                    >
                        {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r} ⭐</option>)}
                    </select>
                </div>
            </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onUpdate([...items, { name: "", text: "", rating: 5 }])}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Depoimento
        </Button>
    </div>
);

const FAQEditor = ({ items, onUpdate }: { items: FAQItem[]; onUpdate: (items: FAQItem[]) => void }) => (
    <div className="space-y-3">
        <Label className="text-sm font-medium">Perguntas</Label>
        {items.map((item, i) => (
            <div key={i} className="p-4 border rounded-xl space-y-2 bg-muted/30">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Pergunta {i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdate(items.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
                <Input placeholder="Pergunta" value={item.question || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], question: e.target.value }; onUpdate(n); }} />
                <Textarea placeholder="Resposta" value={item.answer || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], answer: e.target.value }; onUpdate(n); }} rows={2} />
            </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onUpdate([...items, { question: "", answer: "" }])}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Pergunta
        </Button>
    </div>
);

const StatsEditor = ({ items, onUpdate }: { items: StatsItem[]; onUpdate: (items: StatsItem[]) => void }) => (
    <div className="space-y-3">
        <Label className="text-sm font-medium">Estatísticas</Label>
        {items.map((item, i) => (
            <div key={i} className="p-4 border rounded-xl space-y-2 bg-muted/30">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Stat {i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdate(items.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Valor (ex: 500)" value={item.value || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], value: e.target.value }; onUpdate(n); }} />
                    <Input placeholder="Label (ex: Clientes)" value={item.label || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], label: e.target.value }; onUpdate(n); }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Prefixo (ex: +)" value={item.prefix || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], prefix: e.target.value }; onUpdate(n); }} />
                    <Input placeholder="Sufixo (ex: %)" value={item.suffix || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], suffix: e.target.value }; onUpdate(n); }} />
                </div>
            </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => onUpdate([...items, { value: "", label: "", prefix: "", suffix: "" }])}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Estatística
        </Button>
    </div>
);
