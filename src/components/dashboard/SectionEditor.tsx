import React, { useState } from "react";
import { PageSection, SectionType } from "@/types/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus, Trash2, Star } from "lucide-react";

interface SectionEditorProps {
    section: PageSection;
    onSave: (config: any) => void;
    onCancel: () => void;
}

export const SectionEditor = ({ section, onSave, onCancel }: SectionEditorProps) => {
    const [config, setConfig] = useState<any>({ ...section.config });

    const update = (key: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }));
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
                        <ArrayField
                            label="Logos (URLs das imagens)"
                            items={(config.logos || []).map((l: any) => (typeof l === "string" ? l : l.url))}
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

const TestimonialsEditor = ({ items, onUpdate }: { items: any[]; onUpdate: (items: any[]) => void }) => {
    const [googleInput, setGoogleInput] = React.useState("");
    const [importing, setImporting] = React.useState(false);
    const [importError, setImportError] = React.useState("");
    const [importSuccess, setImportSuccess] = React.useState("");

    const handleImportGoogle = async () => {
        let input = googleInput.trim();
        if (!input) {
            setImportError("Informe o link ou Place ID do Google Maps");
            return;
        }

        setImporting(true);
        setImportError("");
        setImportSuccess("");

        // SMART PARSER: Check if it's raw text pasted instead of a URL
        if (!input.includes("http") && input.length > 50) {
            const parsedReviews = parsePasteContent(input);
            if (parsedReviews.length > 0) {
                const existingKeys = new Set(items.map((item: any) => `${item.name}|${item.text}`));
                const newReviews = parsedReviews.filter((r: any) => !existingKeys.has(`${r.name}|${r.text}`));
                onUpdate([...items, ...newReviews]);
                setImportSuccess(`✅ ${newReviews.length} avaliações extraídas com sucesso do texto colado!`);
                setGoogleInput("");
                setImporting(false);
                return;
            }
        }

        // If it's a URL, try the backend function (optional fallback)
        try {
            const { supabase } = await import("@/integrations/supabase/client");
            const { data, error } = await supabase.functions.invoke("fetch-google-reviews", {
                body: { input },
            });

            if (error) throw new Error(error.message || "Erro ao buscar reviews");
            if (data?.error) {
                // If the error is about API key/billing, give the Magic Paste tip
                if (data.error.includes("billing") || data.error.includes("Place ID") || data.error.includes("API")) {
                    setImportError("O Google bloqueou a importação automática via link (requer chave paga). Use a 'Dica' abaixo para importar GRÁTIS!");
                    return;
                }
                throw new Error(data.error);
            }

            const reviews = data?.reviews || [];
            if (reviews.length === 0) {
                setImportError("Nenhuma avaliação encontrada.");
                return;
            }

            const existingKeys = new Set(items.map((item: any) => `${item.name}|${item.text}`));
            const newReviews = reviews.filter((r: any) => !existingKeys.has(`${r.name}|${r.text}`));
            onUpdate([...items, ...newReviews]);

            setImportSuccess(`✅ ${newReviews.length} avaliações importadas de "${data?.placeName || "Google"}".`);
            setGoogleInput("");
        } catch (err: any) {
            setImportError("Erro no link. Tente copiar e colar o texto das avaliações diretamente (Dica abaixo)!");
        } finally {
            setImporting(false);
        }
    };

    const parsePasteContent = (text: string) => {
        const reviews: any[] = [];
        const lines = text.split("\n").map(l => l.trim()).filter(l => l);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check for star patterns: "5 estrelas", "4 stars", "★★★★★"
            const starMatch = line.match(/^([1-5])\s*(estrelas|stars|★)/i) ||
                line.match(/(estrelas|stars|★)/i);

            if (starMatch) {
                let name = i > 0 ? lines[i - 1] : "Cliente";

                // Skip common metadata lines to find the real name
                let nameIdx = i - 1;
                while (nameIdx >= 0 && (
                    lines[nameIdx].includes("Local Guide") ||
                    lines[nameIdx].includes("comentários") ||
                    lines[nameIdx].includes("Foto") ||
                    lines[nameIdx].match(/^\d+$/)
                )) {
                    nameIdx--;
                }
                if (nameIdx >= 0) name = lines[nameIdx];

                const rating = starMatch[1] ? parseInt(starMatch[1]) : 5;
                let reviewText = "";
                let role = "Google Maps";

                // Look for the date/time line
                if (i + 1 < lines.length && lines[i + 1].match(/há|ago|mês|ano|dia|semana/i)) {
                    role = lines[i + 1];
                    if (i + 2 < lines.length) reviewText = lines[i + 2];
                } else if (i + 1 < lines.length) {
                    reviewText = lines[i + 1];
                }

                if (reviewText && reviewText.length > 5 && !reviewText.includes("Compartilhar")) {
                    reviews.push({
                        name: name.substring(0, 50),
                        text: reviewText,
                        rating: rating,
                        role: role,
                        source: "google"
                    });
                }
            }
        }
        return reviews;
    };

    return (
        <div className="space-y-4">
            {/* Google Import Section */}
            <div className="p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-blue-600">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
                    </svg>
                    <Label className="text-sm font-semibold text-blue-800 dark:text-blue-300">Sincronizar com Google Maps</Label>
                </div>
                <div className="flex flex-col gap-2">
                    <Label className="text-[10px] text-blue-700 font-bold uppercase ml-1">Cole o Link OU o Texto da Avaliação</Label>
                    <div className="flex gap-2">
                        <textarea
                            placeholder="Copie as avaliações do Google e COLE aqui..."
                            value={googleInput}
                            onChange={(e) => setGoogleInput(e.target.value)}
                            className="flex-1 text-sm bg-white border border-blue-200 rounded-md p-2 min-h-[80px] focus:ring-1 focus:ring-blue-400 outline-none"
                        />
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleImportGoogle}
                        disabled={importing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 h-10"
                    >
                        {importing ? "Processando..." : "Importar Agora"}
                    </Button>
                </div>

                <div className="bg-white/50 p-2 rounded border border-blue-100 space-y-2">
                    <p className="text-[10px] text-blue-800 leading-tight">
                        🚀 <b>COMO USAR SEM CUSTO:</b><br />
                        1. Abre o Google Maps e procure sua loja.<br />
                        2. Clique na aba <b>Avaliações</b>.<br />
                        3. Selecione o texto das avaliações com o mouse e dê <b>Ctrl+C</b>.<br />
                        4. Volte aqui e dê <b>Ctrl+V</b> no campo acima e clique em Importar.
                    </p>
                </div>

                {importError && (
                    <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-100">{importError}</p>
                )}
                {importSuccess && (
                    <p className="text-xs text-green-700 bg-green-50 dark:bg-green-950/30 p-2 rounded border border-green-100">{importSuccess}</p>
                )}
            </div>

            {/* Manual testimonials list */}
            <Label className="text-sm font-medium">Depoimentos</Label>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, i) => (
                    <div key={i} className="p-4 border rounded-xl space-y-3 bg-muted/30 relative">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                # {i + 1}
                                {item.source === "google" && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                        Google Maps
                                    </span>
                                )}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => onUpdate(items.filter((_, j) => j !== i))}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Nome</Label>
                                <Input placeholder="Ex: João Silva" value={item.name || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], name: e.target.value }; onUpdate(n); }} className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Cargo / Cidade</Label>
                                <Input placeholder="Ex: Goiânia - GO" value={item.role || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], role: e.target.value }; onUpdate(n); }} className="h-8 text-sm" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Foto do Cliente (URL)</Label>
                            <Input placeholder="URL da imagem ou deixe vazio" value={item.avatarUrl || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], avatarUrl: e.target.value }; onUpdate(n); }} className="h-8 text-sm" />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Depoimento</Label>
                            <Textarea placeholder="O que o cliente disse..." value={item.text || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], text: e.target.value }; onUpdate(n); }} rows={3} className="text-sm italic" />
                        </div>

                        <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg border">
                            <Label className="text-xs font-bold text-muted-foreground">NOTA:</Label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => { const n = [...items]; n[i] = { ...n[i], rating: star }; onUpdate(n); }}
                                        className={`transition-all ${star <= (item.rating || 5) ? "text-amber-400 scale-110" : "text-slate-200"}`}
                                    >
                                        <Star className={`h-5 w-5 ${star <= (item.rating || 5) ? "fill-current" : ""}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Button variant="outline" className="w-full border-dashed" onClick={() => onUpdate([...items, { name: "", text: "", rating: 5 }])}>
                <Plus className="h-4 w-4 mr-1" /> Criar Depoimento Manual
            </Button>
        </div>
    );
};

const FAQEditor = ({ items, onUpdate }: { items: any[]; onUpdate: (items: any[]) => void }) => (
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

const StatsEditor = ({ items, onUpdate }: { items: any[]; onUpdate: (items: any[]) => void }) => (
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
