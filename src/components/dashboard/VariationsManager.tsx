import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
    Plus,
    X,
    Palette,
    Ruler,
    Package,
    Trash2,
    GripVertical
} from "lucide-react";

export interface ProductVariation {
    id?: string;
    name: string; // "Tamanho", "Cor"
    value: string; // "P", "M", "G" ou "Azul", "Vermelho"
    price_adjustment: number;
    stock_quantity: number;
    sku_suffix: string;
    image_url?: string;
    active: boolean;
}

interface VariationsManagerProps {
    variations: ProductVariation[];
    onChange: (variations: ProductVariation[]) => void;
}

const COMMON_VARIATION_TYPES = [
    { name: "Tamanho", icon: Ruler, values: ["PP", "P", "M", "G", "GG", "XG"] },
    { name: "Cor", icon: Palette, values: ["Preto", "Branco", "Azul", "Vermelho", "Verde", "Amarelo", "Rosa", "Cinza"] },
    { name: "Material", icon: Package, values: ["Algodão", "Poliéster", "Linho", "Seda", "Couro", "Jeans"] },
];

const VariationsManager = ({ variations, onChange }: VariationsManagerProps) => {
    const [selectedType, setSelectedType] = useState<string>("");
    const [customTypeName, setCustomTypeName] = useState("");
    const [customValue, setCustomValue] = useState("");
    const [showCustomType, setShowCustomType] = useState(false);

    const addVariation = (type: string, value: string) => {
        // Verificar se já existe essa combinação
        const exists = variations.some(
            (v) => v.name === type && v.value === value
        );
        if (exists) {
            toast.error("Esta variação já existe");
            return;
        }

        const newVariation: ProductVariation = {
            name: type,
            value: value,
            price_adjustment: 0,
            stock_quantity: 0,
            sku_suffix: `-${value.toUpperCase().substring(0, 3)}`,
            active: true,
        };

        onChange([...variations, newVariation]);
        toast.success(`Variação "${type}: ${value}" adicionada`);
    };

    const removeVariation = (index: number) => {
        const newVariations = variations.filter((_, i) => i !== index);
        onChange(newVariations);
    };

    const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
        const newVariations = [...variations];
        newVariations[index] = { ...newVariations[index], [field]: value };
        onChange(newVariations);
    };

    const handleAddCustomValue = () => {
        const type = showCustomType ? customTypeName : selectedType;
        if (!type.trim()) {
            toast.error("Selecione ou digite um tipo de variação");
            return;
        }
        if (!customValue.trim()) {
            toast.error("Digite o valor da variação");
            return;
        }

        addVariation(type, customValue);
        setCustomValue("");
    };

    // Agrupar variações por tipo
    const groupedVariations = variations.reduce((acc, variation) => {
        if (!acc[variation.name]) {
            acc[variation.name] = [];
        }
        acc[variation.name].push(variation);
        return acc;
    }, {} as Record<string, ProductVariation[]>);

    const getTypeIcon = (type: string) => {
        const found = COMMON_VARIATION_TYPES.find((t) => t.name === type);
        return found?.icon || Package;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Variações do Produto</Label>
                <Badge variant="secondary">
                    {variations.length} variação{variations.length !== 1 ? "ões" : ""}
                </Badge>
            </div>

            {/* Adicionar variação */}
            <Card>
                <CardContent className="pt-4 space-y-4">
                    {/* Tipo de variação */}
                    <div className="flex gap-2 items-end">
                        {!showCustomType ? (
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs text-muted-foreground">Tipo de variação</Label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMMON_VARIATION_TYPES.map((type) => (
                                            <SelectItem key={type.name} value={type.name}>
                                                <span className="flex items-center gap-2">
                                                    <type.icon className="h-4 w-4" />
                                                    {type.name}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs text-muted-foreground">Nome do tipo</Label>
                                <Input
                                    value={customTypeName}
                                    onChange={(e) => setCustomTypeName(e.target.value)}
                                    placeholder="Ex: Voltagem, Sabor..."
                                />
                            </div>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCustomType(!showCustomType)}
                        >
                            {showCustomType ? "Usar padrão" : "Tipo personalizado"}
                        </Button>
                    </div>

                    {/* Valores rápidos */}
                    {selectedType && !showCustomType && (
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Adicionar valor rápido</Label>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_VARIATION_TYPES.find((t) => t.name === selectedType)?.values.map(
                                    (value) => {
                                        const exists = variations.some(
                                            (v) => v.name === selectedType && v.value === value
                                        );
                                        return (
                                            <Button
                                                key={value}
                                                type="button"
                                                variant={exists ? "secondary" : "outline"}
                                                size="sm"
                                                disabled={exists}
                                                onClick={() => addVariation(selectedType, value)}
                                                className="text-xs"
                                            >
                                                {exists ? "✓ " : "+ "}
                                                {value}
                                            </Button>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    )}

                    {/* Valor personalizado */}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">Valor personalizado</Label>
                            <Input
                                value={customValue}
                                onChange={(e) => setCustomValue(e.target.value)}
                                placeholder="Ex: XXG, Bordô, 110v..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddCustomValue();
                                    }
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={handleAddCustomValue}
                            disabled={!customValue.trim() || (!selectedType && !customTypeName)}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de variações por grupo */}
            {Object.keys(groupedVariations).length > 0 && (
                <div className="space-y-4">
                    {Object.entries(groupedVariations).map(([type, typeVariations]) => {
                        const TypeIcon = getTypeIcon(type);
                        return (
                            <Card key={type}>
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{type}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {typeVariations.length}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {typeVariations.map((variation, idx) => {
                                            const globalIndex = variations.findIndex(
                                                (v) => v.name === variation.name && v.value === variation.value
                                            );
                                            return (
                                                <div
                                                    key={`${variation.name}-${variation.value}-${idx}`}
                                                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                                                >
                                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

                                                    <Badge variant="secondary" className="min-w-[60px] justify-center">
                                                        {variation.value}
                                                    </Badge>

                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs whitespace-nowrap">Preço +/-</Label>
                                                        <Input
                                                            type="number"
                                                            value={variation.price_adjustment || ""}
                                                            onChange={(e) =>
                                                                updateVariation(globalIndex, "price_adjustment", parseFloat(e.target.value) || 0)
                                                            }
                                                            placeholder="0"
                                                            className="w-20 h-8 text-sm"
                                                            step="0.01"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs whitespace-nowrap">Estoque</Label>
                                                        <Input
                                                            type="number"
                                                            value={variation.stock_quantity || ""}
                                                            onChange={(e) =>
                                                                updateVariation(globalIndex, "stock_quantity", parseInt(e.target.value) || 0)
                                                            }
                                                            placeholder="0"
                                                            className="w-20 h-8 text-sm"
                                                            min="0"
                                                        />
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => removeVariation(globalIndex)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Dica */}
            {variations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                    Adicione variações se seu produto tem diferentes tamanhos, cores ou outras opções
                </p>
            )}
        </div>
    );
};

export default VariationsManager;
