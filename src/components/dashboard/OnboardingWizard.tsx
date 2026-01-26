import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    X,
    Check,
    ArrowRight,
    ArrowLeft,
    Building2,
    Package,
    MessageCircle,
    Palette,
    Share2,
    Sparkles,
    Upload,
    Phone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface OnboardingWizardProps {
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    onComplete: () => void;
    onSkip: () => void;
}

const steps = [
    { id: 1, title: "Sua Loja", icon: Building2, description: "Configure as informações básicas" },
    { id: 2, title: "Primeiro Produto", icon: Package, description: "Adicione seu primeiro produto" },
    { id: 3, title: "WhatsApp", icon: MessageCircle, description: "Configure seu número" },
    { id: 4, title: "Aparência", icon: Palette, description: "Personalize sua vitrine" },
    { id: 5, title: "Compartilhar", icon: Share2, description: "Divulgue sua loja" },
];

export const OnboardingWizard = ({ tenantId, tenantName, tenantSlug, onComplete, onSkip }: OnboardingWizardProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Store info
    // Se o nome for o padrão gerado pelo sistema (ex: "Loja de Fulano"), iniciamos vazio para forçar o usuário a configurar.
    const isDefaultName = tenantName?.startsWith("Loja de ") || tenantName === "Minha Loja";
    const [storeName, setStoreName] = useState(isDefaultName ? "" : (tenantName || ""));
    const [storeLogo, setStoreLogo] = useState<File | null>(null);

    // Step 2: First product
    const [productName, setProductName] = useState("");
    const [productPrice, setProductPrice] = useState("");

    // Step 3: WhatsApp
    const [whatsappNumber, setWhatsappNumber] = useState("");

    // Step 4: Colors
    const [primaryColor, setPrimaryColor] = useState("#7c3aed");

    const progress = (currentStep / steps.length) * 100;

    const handleNext = async () => {
        if (currentStep === 1) {
            // Save store name and logo
            setIsLoading(true);
            try {
                // Update store name
                if (storeName.trim()) {
                    await supabase
                        .from("tenants")
                        .update({ company_name: storeName })
                        .eq("id", tenantId);
                }

                // Upload logo if selected
                if (storeLogo) {
                    const fileExt = storeLogo.name.split('.').pop();
                    const fileName = `${tenantId}/logo.${fileExt}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('store-logos')
                        .upload(fileName, storeLogo, {
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (uploadError) {
                        console.error('Erro ao fazer upload do logo:', uploadError);
                        toast.error('Erro ao enviar logo, mas continuando...');
                    } else {
                        // Get public URL
                        const { data: urlData } = supabase.storage
                            .from('store-logos')
                            .getPublicUrl(fileName);

                        // Update store_settings with logo URL
                        await supabase
                            .from("store_settings")
                            .upsert({
                                tenant_id: tenantId,
                                branding: {
                                    store_title: storeName,
                                    logo_url: urlData.publicUrl
                                }
                            }, { onConflict: 'tenant_id' });

                        toast.success("Logo enviado com sucesso!");
                    }
                }

                toast.success("Nome da loja salvo!");
            } catch (error) {
                console.error(error);
                toast.error("Erro ao salvar dados da loja");
            }
            setIsLoading(false);
        }

        if (currentStep === 2) {
            // Save first product
            if (productName.trim()) {
                setIsLoading(true);
                try {
                    await supabase
                        .from("products")
                        .insert({
                            tenant_id: tenantId,
                            name: productName,
                            price: productPrice ? parseFloat(productPrice) : null,
                            active: true,
                            slug: productName.toLowerCase().replace(/\s+/g, '-'),
                        });
                    toast.success("Produto criado!");
                } catch (error) {
                    console.error(error);
                }
                setIsLoading(false);
            }
        }

        if (currentStep === 3) {
            // Save WhatsApp
            if (whatsappNumber.trim()) {
                setIsLoading(true);
                try {
                    const cleanNumber = whatsappNumber.replace(/\D/g, '');
                    await supabase
                        .from("tenants")
                        .update({ whatsapp_number: cleanNumber })
                        .eq("id", tenantId);

                    // Also update store_settings
                    await supabase
                        .from("store_settings")
                        .upsert({
                            tenant_id: tenantId,
                            contact: { whatsapp_number: cleanNumber }
                        }, { onConflict: 'tenant_id' });

                    toast.success("WhatsApp configurado!");
                } catch (error) {
                    console.error(error);
                }
                setIsLoading(false);
            }
        }

        if (currentStep === 4) {
            // Save primary color
            setIsLoading(true);
            try {
                await supabase
                    .from("tenants")
                    .update({ primary_color: primaryColor })
                    .eq("id", tenantId);
                toast.success("Cor primária salva!");
            } catch (error) {
                console.error(error);
            }
            setIsLoading(false);
        }

        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        } else {
            // Complete onboarding with confetti!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            toast.success("🎉 Parabéns! Sua loja está pronta!");
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold">Vamos configurar sua loja</h3>
                            <p className="text-muted-foreground mt-2">
                                Como sua loja se chama?
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="storeName">Nome da Loja</Label>
                                <Input
                                    id="storeName"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    placeholder="Ex: Minha Loja Virtual"
                                    className="mt-1.5 text-lg py-6"
                                />
                            </div>

                            <div>
                                <Label>Logo da Loja (opcional)</Label>
                                <div
                                    className="mt-1.5 border-2 border-dashed rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer relative"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const file = e.dataTransfer.files[0];
                                        if (file && file.type.startsWith('image/')) {
                                            setStoreLogo(file);
                                        }
                                    }}
                                >
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setStoreLogo(file);
                                            }
                                        }}
                                    />
                                    {storeLogo ? (
                                        <div className="flex flex-col items-center">
                                            <img
                                                src={URL.createObjectURL(storeLogo)}
                                                alt="Preview do logo"
                                                className="w-20 h-20 object-contain rounded-lg mb-2"
                                            />
                                            <p className="text-sm text-green-600 font-medium">
                                                ✓ {storeLogo.name}
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setStoreLogo(null);
                                                }}
                                                className="text-xs text-red-500 mt-1 hover:underline"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                Arraste ou clique para enviar
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PNG, JPG até 5MB
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                <Package className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold">Adicione seu primeiro produto</h3>
                            <p className="text-muted-foreground mt-2">
                                Você pode adicionar mais produtos depois
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="productName">Nome do Produto</Label>
                                <Input
                                    id="productName"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder="Ex: Camiseta Estampada"
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="productPrice">Preço (R$)</Label>
                                <Input
                                    id="productPrice"
                                    type="number"
                                    value={productPrice}
                                    onChange={(e) => setProductPrice(e.target.value)}
                                    placeholder="99.90"
                                    className="mt-1.5"
                                />
                            </div>
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <MessageCircle className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold">Configure seu WhatsApp</h3>
                            <p className="text-muted-foreground mt-2">
                                Os clientes enviarão orçamentos para este número
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="whatsapp">Número do WhatsApp</Label>
                            <div className="relative mt-1.5">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="whatsapp"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="pl-10 text-lg py-6"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Inclua o DDD. Ex: 11999999999
                            </p>
                        </div>
                    </motion.div>
                );

            case 4:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                                <Palette className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold">Escolha sua cor principal</h3>
                            <p className="text-muted-foreground mt-2">
                                Esta cor será usada nos botões e destaques
                            </p>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            {[
                                "#7c3aed", // Violet
                                "#2563eb", // Blue
                                "#059669", // Green
                                "#dc2626", // Red
                                "#ea580c", // Orange
                                "#0891b2", // Cyan
                                "#7c2d12", // Brown
                                "#4f46e5", // Indigo
                                "#be185d", // Pink
                                "#1f2937", // Gray
                            ].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setPrimaryColor(color)}
                                    className={`w-12 h-12 rounded-xl transition-transform hover:scale-110 ${primaryColor === color ? 'ring-4 ring-offset-2 ring-primary scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>

                        <div className="mt-6">
                            <Label>Cor personalizada</Label>
                            <div className="flex gap-2 mt-1.5">
                                <Input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </motion.div>
                );

            case 5:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                <Share2 className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold">Sua loja está pronta!</h3>
                            <p className="text-muted-foreground mt-2">
                                Compartilhe sua vitrine com seus clientes
                            </p>
                        </div>

                        <Card className="border-2 border-dashed">
                            <CardContent className="p-6 text-center">
                                <Sparkles className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                                <p className="font-medium mb-2">Link da sua vitrine:</p>
                                <code className="bg-secondary px-4 py-2 rounded-lg text-sm block break-all">
                                    agencia062.com/loja/{tenantSlug}
                                </code>
                            </CardContent>
                        </Card>


                        <Button
                            variant="outline"
                            className="w-full h-12"
                            onClick={() => {
                                const link = `https://agencia062.com/loja/${tenantSlug}`;
                                navigator.clipboard.writeText(link).then(() => {
                                    toast.success("Link copiado para a área de transferência!");
                                }).catch(() => {
                                    toast.error("Não foi possível copiar o link");
                                });
                            }}
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            Copiar Link
                        </Button>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-background border rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Configurar sua loja</h2>
                        <Button variant="ghost" size="icon" onClick={onSkip}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Progress */}
                    <Progress value={progress} className="h-2" />

                    {/* Steps indicator */}
                    <div className="flex justify-between mt-4">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`flex flex-col items-center ${step.id === currentStep
                                    ? 'text-primary'
                                    : step.id < currentStep
                                        ? 'text-green-500'
                                        : 'text-muted-foreground'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.id === currentStep
                                    ? 'bg-primary text-white'
                                    : step.id < currentStep
                                        ? 'bg-green-500 text-white'
                                        : 'bg-secondary'
                                    }`}>
                                    {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {renderStepContent()}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-secondary/30 flex justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    >
                        {isLoading ? (
                            "Salvando..."
                        ) : currentStep === steps.length ? (
                            <>
                                Concluir
                                <Sparkles className="ml-2 h-4 w-4" />
                            </>
                        ) : (
                            <>
                                Próximo
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingWizard;
