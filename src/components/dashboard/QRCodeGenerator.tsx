import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Download,
    Copy,
    Check,
    QrCode,
    Smartphone,
    Share2,
    Palette
} from "lucide-react";
import { toast } from "sonner";

interface QRCodeGeneratorProps {
    storeUrl: string;
    storeName: string;
}

export const QRCodeGenerator = ({ storeUrl, storeName }: QRCodeGeneratorProps) => {
    const [copied, setCopied] = useState(false);
    const [fgColor, setFgColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [size, setSize] = useState(256);

    const fullUrl = `${window.location.origin}${storeUrl}`;

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        toast.success("Link copiado!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPNG = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;

        const canvas = document.createElement("canvas");
        canvas.width = size * 2;
        canvas.height = size * 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const link = document.createElement("a");
            link.download = `qrcode-${storeName.toLowerCase().replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();

            URL.revokeObjectURL(url);
            toast.success("QR Code baixado!");
        };

        img.src = url;
    };

    const handleDownloadSVG = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.download = `qrcode-${storeName.toLowerCase().replace(/\s+/g, '-')}.svg`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        toast.success("QR Code SVG baixado!");
    };

    const handleShareWhatsApp = () => {
        const text = `Confira meu catálogo virtual: ${fullUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, "_blank");
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border-b">
                <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Code da sua Vitrine
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* QR Code Preview */}
                    <div className="flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="p-4 bg-white rounded-2xl shadow-lg border"
                        >
                            <QRCodeSVG
                                id="qr-code-svg"
                                value={fullUrl}
                                size={size}
                                fgColor={fgColor}
                                bgColor={bgColor}
                                level="H"
                                includeMargin={true}
                            />
                        </motion.div>

                        <div className="mt-4 text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Escaneie para acessar sua vitrine
                            </p>
                            <div className="flex items-center gap-2 justify-center">
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                <code className="text-xs bg-secondary px-2 py-1 rounded">
                                    {fullUrl.replace('http://', '').replace('https://', '')}
                                </code>
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-6">
                        {/* Colors */}
                        <div>
                            <Label className="flex items-center gap-2 mb-3">
                                <Palette className="h-4 w-4" />
                                Personalizar cores
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Cor do QR</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            type="color"
                                            value={fgColor}
                                            onChange={(e) => setFgColor(e.target.value)}
                                            className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={fgColor}
                                            onChange={(e) => setFgColor(e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Cor de fundo</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            type="color"
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Size */}
                        <div>
                            <Label className="text-xs text-muted-foreground">Tamanho</Label>
                            <div className="flex gap-2 mt-1">
                                {[128, 256, 512].map((s) => (
                                    <Button
                                        key={s}
                                        variant={size === s ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSize(s)}
                                        className={size === s ? "bg-violet-600 hover:bg-violet-700" : ""}
                                    >
                                        {s}px
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-4 border-t">
                            <Button
                                onClick={handleCopyLink}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                {copied ? "Link copiado!" : "Copiar link da vitrine"}
                            </Button>

                            <Button
                                onClick={handleDownloadPNG}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Baixar PNG
                            </Button>

                            <Button
                                onClick={handleDownloadSVG}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Baixar SVG (vetorial)
                            </Button>

                            <Button
                                onClick={handleShareWhatsApp}
                                className="w-full justify-start bg-green-600 hover:bg-green-700"
                            >
                                <Share2 className="mr-2 h-4 w-4" />
                                Compartilhar no WhatsApp
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Usage tips */}
                <div className="mt-8 p-4 bg-secondary/50 rounded-xl">
                    <h4 className="font-medium mb-2">💡 Dicas de uso:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Imprima o QR Code em cartões de visita, panfletos ou embalagens</li>
                        <li>• Cole na vitrine física da sua loja</li>
                        <li>• Adicione em posts nas redes sociais</li>
                        <li>• Use em materiais promocionais</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};

export default QRCodeGenerator;
