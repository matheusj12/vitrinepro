import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    FileDown,
    Loader2,
    CheckCircle2,
    Eye,
    Palette,
    Grid3X3,
    List,
    Image as ImageIcon
} from "lucide-react";
import { jsPDF } from "jspdf";

interface CatalogExportProps {
    tenantId: string;
    storeName: string;
    primaryColor: string;
}

const CatalogExport = ({ tenantId, storeName, primaryColor }: CatalogExportProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [layout, setLayout] = useState<"grid" | "list">("grid");
    const [showPrices, setShowPrices] = useState(true);
    const [showDescriptions, setShowDescriptions] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Fetch products
    const { data: products = [] } = useQuery({
        queryKey: ["products", tenantId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("active", true)
                .order("name");

            if (error) throw error;
            return data as Product[];
        },
    });

    // Fetch categories
    const { data: categories = [] } = useQuery({
        queryKey: ["categories", tenantId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .eq("tenant_id", tenantId)
                .order("position");

            if (error) throw error;
            return data as Category[];
        },
    });

    const filteredProducts = selectedCategory === "all"
        ? products
        : products.filter(p => p.category_id === selectedCategory);

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 124, g: 58, b: 237 }; // fallback violet
    };

    const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    };

    const generatePDF = async () => {
        if (filteredProducts.length === 0) {
            toast.error("Nenhum produto para exportar");
            return;
        }

        setIsGenerating(true);
        toast.loading("Gerando catálogo em PDF...");

        try {
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - (margin * 2);
            const color = hexToRgb(primaryColor);

            // Cover page
            pdf.setFillColor(color.r, color.g, color.b);
            pdf.rect(0, 0, pageWidth, pageHeight, "F");

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(36);
            pdf.setFont("helvetica", "bold");
            pdf.text(storeName, pageWidth / 2, pageHeight / 2 - 20, { align: "center" });

            pdf.setFontSize(18);
            pdf.setFont("helvetica", "normal");
            pdf.text("Catálogo de Produtos", pageWidth / 2, pageHeight / 2 + 10, { align: "center" });

            pdf.setFontSize(12);
            pdf.text(`${filteredProducts.length} produtos`, pageWidth / 2, pageHeight / 2 + 25, { align: "center" });

            // Products pages
            pdf.addPage();
            let y = margin;

            if (layout === "grid") {
                // Grid layout: 2 columns
                const cardWidth = (contentWidth - 10) / 2;
                const cardHeight = showDescriptions ? 80 : 60;
                let col = 0;

                for (const product of filteredProducts) {
                    if (y + cardHeight > pageHeight - margin) {
                        pdf.addPage();
                        y = margin;
                        col = 0;
                    }

                    const x = margin + (col * (cardWidth + 10));

                    // Card background
                    pdf.setFillColor(250, 250, 250);
                    pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "F");

                    // Product image
                    try {
                        if (product.image_url) {
                            const img = await loadImage(product.image_url);
                            pdf.addImage(img, "JPEG", x + 5, y + 5, 25, 25);
                        }
                    } catch (e) {
                        // Skip image if it fails to load
                    }

                    // Product info
                    const textX = x + 35;
                    const textWidth = cardWidth - 40;

                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "bold");
                    const nameLines = pdf.splitTextToSize(product.name, textWidth);
                    pdf.text(nameLines.slice(0, 2), textX, y + 12);

                    if (showPrices && product.price) {
                        pdf.setTextColor(color.r, color.g, color.b);
                        pdf.setFontSize(12);
                        pdf.text(`R$ ${product.price.toFixed(2)}`, textX, y + 25);
                    }

                    if (showDescriptions && product.description) {
                        pdf.setTextColor(100, 100, 100);
                        pdf.setFontSize(8);
                        const descLines = pdf.splitTextToSize(product.description, textWidth);
                        pdf.text(descLines.slice(0, 3), textX, y + 35);
                    }

                    col++;
                    if (col >= 2) {
                        col = 0;
                        y += cardHeight + 8;
                    }
                }
            } else {
                // List layout
                for (const product of filteredProducts) {
                    const rowHeight = showDescriptions ? 35 : 25;

                    if (y + rowHeight > pageHeight - margin) {
                        pdf.addPage();
                        y = margin;
                    }

                    // Row background
                    pdf.setFillColor(250, 250, 250);
                    pdf.roundedRect(margin, y, contentWidth, rowHeight, 2, 2, "F");

                    // Product info
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "bold");
                    pdf.text(product.name, margin + 5, y + 10);

                    if (showPrices && product.price) {
                        pdf.setTextColor(color.r, color.g, color.b);
                        pdf.setFontSize(11);
                        pdf.text(`R$ ${product.price.toFixed(2)}`, pageWidth - margin - 5, y + 10, { align: "right" });
                    }

                    if (showDescriptions && product.description) {
                        pdf.setTextColor(100, 100, 100);
                        pdf.setFontSize(8);
                        pdf.setFont("helvetica", "normal");
                        const descLines = pdf.splitTextToSize(product.description, contentWidth - 80);
                        pdf.text(descLines[0] || "", margin + 5, y + 20);
                    }

                    y += rowHeight + 5;
                }
            }

            // Footer on last page
            pdf.setTextColor(150, 150, 150);
            pdf.setFontSize(8);
            pdf.text(
                `Catálogo gerado por VitrinePro - ${new Date().toLocaleDateString("pt-BR")}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: "center" }
            );

            // Save the PDF
            const fileName = `catalogo-${storeName.toLowerCase().replace(/\s+/g, "-")}.pdf`;
            pdf.save(fileName);

            toast.dismiss();
            toast.success("Catálogo PDF gerado com sucesso!");
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast.dismiss();
            toast.error("Erro ao gerar PDF. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Exportar Catálogo PDF</h2>
                <p className="text-muted-foreground">
                    Gere um catálogo profissional para compartilhar com clientes
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Options */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Opções do Catálogo</CardTitle>
                        <CardDescription>
                            Personalize como seu catálogo será gerado
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Category filter */}
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas as categorias" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as categorias</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Layout */}
                        <div className="space-y-2">
                            <Label>Layout</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={layout === "grid" ? "default" : "outline"}
                                    onClick={() => setLayout("grid")}
                                    className="flex-1"
                                >
                                    <Grid3X3 className="h-4 w-4 mr-2" />
                                    Grade
                                </Button>
                                <Button
                                    type="button"
                                    variant={layout === "list" ? "default" : "outline"}
                                    onClick={() => setLayout("list")}
                                    className="flex-1"
                                >
                                    <List className="h-4 w-4 mr-2" />
                                    Lista
                                </Button>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Mostrar Preços</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Exibir valores dos produtos
                                    </p>
                                </div>
                                <Switch
                                    checked={showPrices}
                                    onCheckedChange={setShowPrices}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Mostrar Descrições</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Incluir descrição resumida
                                    </p>
                                </div>
                                <Switch
                                    checked={showDescriptions}
                                    onCheckedChange={setShowDescriptions}
                                />
                            </div>
                        </div>

                        {/* Generate button */}
                        <Button
                            onClick={generatePDF}
                            disabled={isGenerating || filteredProducts.length === 0}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                            size="lg"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gerando PDF...
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Gerar Catálogo PDF
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Preview</CardTitle>
                        <CardDescription>
                            Visualização aproximada do catálogo
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="aspect-[3/4] rounded-lg border-2 overflow-hidden flex flex-col"
                            style={{ borderColor: primaryColor }}
                        >
                            {/* Cover preview */}
                            <div
                                className="flex-1 flex flex-col items-center justify-center text-white p-4"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <h3 className="text-xl font-bold text-center">{storeName}</h3>
                                <p className="text-sm opacity-80">Catálogo de Produtos</p>
                                <p className="text-xs mt-2 opacity-60">
                                    {filteredProducts.length} produtos
                                </p>
                            </div>

                            {/* Products preview */}
                            <div className="bg-gray-50 p-3 space-y-2">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Produtos incluídos:
                                </p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {filteredProducts.slice(0, 5).map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between text-xs bg-white rounded px-2 py-1"
                                        >
                                            <span className="truncate flex-1">{product.name}</span>
                                            {showPrices && product.price && (
                                                <span className="font-medium ml-2" style={{ color: primaryColor }}>
                                                    R$ {product.price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {filteredProducts.length > 5 && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            +{filteredProducts.length - 5} produtos...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                Nenhum produto ativo para exportar
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <h4 className="font-medium">Profissional</h4>
                        <p className="text-sm text-muted-foreground">
                            Design limpo e elegante
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Palette className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                        <h4 className="font-medium">Sua Marca</h4>
                        <p className="text-sm text-muted-foreground">
                            Cores personalizadas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <ImageIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <h4 className="font-medium">Com Imagens</h4>
                        <p className="text-sm text-muted-foreground">
                            Fotos dos produtos
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CatalogExport;
