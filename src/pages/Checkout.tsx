import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    ShoppingCart,
    User,
    MapPin,
    CreditCard,
    Truck,
    Check,
    Loader2,
    Copy,
    QrCode,
    Clock,
    CheckCircle2,
    Phone,
    Smartphone
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    variation?: string;
}

interface CheckoutData {
    name: string;
    email: string;
    whatsapp: string;
    cpf: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    paymentMethod: "pix" | "card" | "boleto";
    notes: string;
}

const Checkout = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderCreated, setOrderCreated] = useState(false);
    const [pixCode, setPixCode] = useState("");
    const [orderId, setOrderId] = useState("");

    // Cart from localStorage
    const [cart, setCart] = useState<CartItem[]>([]);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [shippingCost, setShippingCost] = useState(0);

    // Form data
    const [formData, setFormData] = useState<CheckoutData>({
        name: "",
        email: "",
        whatsapp: "",
        cpf: "",
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        paymentMethod: "pix",
        notes: "",
    });

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem(`cart-${slug}`);
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Erro ao carregar carrinho:", e);
            }
        }
    }, [slug]);

    // Fetch tenant
    const { data: tenant } = useQuery({
        queryKey: ["tenant", slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tenants")
                .select("*")
                .eq("slug", slug)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!slug,
    });

    // Calculate totals
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discount = appliedCoupon?.discount || 0;
    const total = subtotal + shippingCost - discount;

    // Apply coupon
    const applyCouponMutation = useMutation({
        mutationFn: async (code: string) => {
            const { data, error } = await supabase.rpc("validate_coupon", {
                p_tenant_id: tenant?.id,
                p_code: code,
                p_cart_total: subtotal,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (data: any) => {
            if (data.valid) {
                setAppliedCoupon(data);
                toast.success(`Cupom aplicado! Desconto de R$ ${data.discount.toFixed(2)}`);
            } else {
                toast.error(data.error);
            }
        },
        onError: () => {
            toast.error("Erro ao validar cupom");
        },
    });

    // Create order
    const createOrderMutation = useMutation({
        mutationFn: async () => {
            // Create customer first
            const { data: customer, error: customerError } = await supabase
                .from("customers")
                .insert({
                    tenant_id: tenant?.id,
                    name: formData.name,
                    email: formData.email,
                    whatsapp: formData.whatsapp,
                    document: formData.cpf,
                    address: {
                        street: formData.street,
                        number: formData.number,
                        complement: formData.complement,
                        neighborhood: formData.neighborhood,
                        city: formData.city,
                        state: formData.state,
                        zip: formData.cep,
                    },
                    source: "website",
                })
                .select()
                .single();

            if (customerError) console.error("Erro ao criar cliente:", customerError);

            // Create order
            const orderItems = cart.map((item) => ({
                product_id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image_url: item.image_url,
                variation: item.variation,
            }));

            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    tenant_id: tenant?.id,
                    customer_id: customer?.id,
                    items: orderItems,
                    subtotal,
                    shipping_cost: shippingCost,
                    discount,
                    coupon_id: appliedCoupon?.coupon_id,
                    coupon_code: appliedCoupon?.code,
                    total,
                    payment_method: formData.paymentMethod,
                    payment_status: "pending",
                    shipping_status: "pending",
                    shipping_address: {
                        street: formData.street,
                        number: formData.number,
                        complement: formData.complement,
                        neighborhood: formData.neighborhood,
                        city: formData.city,
                        state: formData.state,
                        zip: formData.cep,
                    },
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_whatsapp: formData.whatsapp,
                    notes: formData.notes,
                    source: "website",
                })
                .select()
                .single();

            if (orderError) throw orderError;
            return order;
        },
        onSuccess: (order) => {
            setOrderId(order.id);
            setOrderCreated(true);

            // Generate PIX code (mock - em produção usar API de pagamento)
            const mockPixCode = `00020126580014br.gov.bcb.pix0136${order.id}520400005303986540${total.toFixed(
                2
            )}5802BR5925${tenant?.company_name?.substring(0, 25) || "Loja"}6009SAO PAULO62070503***6304`;
            setPixCode(mockPixCode);

            // Clear cart
            localStorage.removeItem(`cart-${slug}`);

            toast.success("Pedido criado com sucesso!");
        },
        onError: (error: any) => {
            console.error("Erro ao criar pedido:", error);
            toast.error("Erro ao criar pedido. Tente novamente.");
        },
    });

    // CEP lookup
    const handleCepBlur = async () => {
        const cep = formData.cep.replace(/\D/g, "");
        if (cep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData((prev) => ({
                    ...prev,
                    street: data.logradouro || prev.street,
                    neighborhood: data.bairro || prev.neighborhood,
                    city: data.localidade || prev.city,
                    state: data.uf || prev.state,
                }));
            }
        } catch (e) {
            console.error("Erro ao buscar CEP:", e);
        }
    };

    const handleSubmit = async () => {
        // Validações
        if (!formData.name || !formData.whatsapp || !formData.email) {
            toast.error("Preencha seus dados de contato");
            setStep(1);
            return;
        }

        if (!formData.cep || !formData.street || !formData.number || !formData.city) {
            toast.error("Preencha o endereço de entrega");
            setStep(2);
            return;
        }

        setIsProcessing(true);
        await createOrderMutation.mutateAsync();
        setIsProcessing(false);
    };

    const copyPixCode = () => {
        navigator.clipboard.writeText(pixCode);
        toast.success("Código PIX copiado!");
    };

    const handleWhatsAppConfirm = () => {
        const message = encodeURIComponent(
            `Olá! Acabei de fazer o pedido #${orderId?.substring(0, 8).toUpperCase()} no valor de R$ ${total.toFixed(
                2
            )}. ${formData.paymentMethod === "pix" ? "Vou enviar o comprovante PIX." : ""}`
        );
        window.open(`https://wa.me/55${tenant?.whatsapp_number?.replace(/\D/g, "")}?text=${message}`, "_blank");
    };

    if (cart.length === 0 && !orderCreated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Carrinho vazio</h2>
                        <p className="text-muted-foreground mb-6">
                            Adicione produtos para continuar com a compra
                        </p>
                        <Button onClick={() => navigate(`/loja/${slug}`)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar para a loja
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Order success screen
    if (orderCreated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card className="max-w-lg w-full">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl">Pedido Confirmado!</CardTitle>
                            <CardDescription>
                                Pedido #{orderId?.substring(0, 8).toUpperCase()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {formData.paymentMethod === "pix" && (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Escaneie o QR Code ou copie o código PIX
                                        </p>
                                        <div className="inline-block p-4 bg-white rounded-xl border-2 border-gray-200">
                                            <QRCodeSVG value={pixCode} size={180} />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Input value={pixCode} readOnly className="text-xs" />
                                        <Button variant="outline" onClick={copyPixCode}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-sm">
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                        <span className="text-yellow-800">
                                            O PIX expira em 30 minutos
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium mb-2">Resumo do Pedido</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    {shippingCost > 0 && (
                                        <div className="flex justify-between">
                                            <span>Frete</span>
                                            <span>R$ {shippingCost.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Desconto</span>
                                            <span>- R$ {discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold">
                                        <span>Total</span>
                                        <span>R$ {total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={handleWhatsAppConfirm}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Confirmar via WhatsApp
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/loja/${slug}`)}
                                    className="w-full"
                                >
                                    Voltar para a loja
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen pb-8"
            style={{ backgroundColor: tenant?.primary_color + "10" || "#f5f5f5" }}
        >
            {/* Header */}
            <header
                className="sticky top-0 z-50 p-4 text-white"
                style={{ backgroundColor: tenant?.primary_color || "#7c3aed" }}
            >
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => navigate(`/loja/${slug}`)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold">Finalizar Pedido</h1>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-4">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Steps */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center">
                                    <button
                                        onClick={() => setStep(s)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${step >= s
                                                ? "bg-violet-600 text-white"
                                                : "bg-gray-200 text-gray-500"
                                            }`}
                                    >
                                        {step > s ? <Check className="h-5 w-5" /> : s}
                                    </button>
                                    {s < 3 && (
                                        <div
                                            className={`w-12 h-1 mx-1 rounded ${step > s ? "bg-violet-600" : "bg-gray-200"
                                                }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Contact */}
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Seus Dados
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Nome completo *</Label>
                                            <Input
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, name: e.target.value })
                                                }
                                                placeholder="Seu nome"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Email *</Label>
                                                <Input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, email: e.target.value })
                                                    }
                                                    placeholder="seu@email.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>WhatsApp *</Label>
                                                <Input
                                                    value={formData.whatsapp}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, whatsapp: e.target.value })
                                                    }
                                                    placeholder="(00) 00000-0000"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>CPF</Label>
                                            <Input
                                                value={formData.cpf}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, cpf: e.target.value })
                                                }
                                                placeholder="000.000.000-00"
                                            />
                                        </div>
                                        <Button
                                            className="w-full"
                                            onClick={() => setStep(2)}
                                            style={{ backgroundColor: tenant?.primary_color }}
                                        >
                                            Continuar
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 2: Address */}
                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Endereço de Entrega
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>CEP *</Label>
                                                <Input
                                                    value={formData.cep}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, cep: e.target.value })
                                                    }
                                                    onBlur={handleCepBlur}
                                                    placeholder="00000-000"
                                                />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Rua *</Label>
                                                <Input
                                                    value={formData.street}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, street: e.target.value })
                                                    }
                                                    placeholder="Nome da rua"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Número *</Label>
                                                <Input
                                                    value={formData.number}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, number: e.target.value })
                                                    }
                                                    placeholder="123"
                                                />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Complemento</Label>
                                                <Input
                                                    value={formData.complement}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, complement: e.target.value })
                                                    }
                                                    placeholder="Apto, bloco..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Bairro *</Label>
                                                <Input
                                                    value={formData.neighborhood}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, neighborhood: e.target.value })
                                                    }
                                                    placeholder="Bairro"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Cidade *</Label>
                                                <Input
                                                    value={formData.city}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, city: e.target.value })
                                                    }
                                                    placeholder="Cidade"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Estado *</Label>
                                                <Input
                                                    value={formData.state}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, state: e.target.value })
                                                    }
                                                    placeholder="UF"
                                                    maxLength={2}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setStep(1)}
                                                className="flex-1"
                                            >
                                                Voltar
                                            </Button>
                                            <Button
                                                onClick={() => setStep(3)}
                                                className="flex-1"
                                                style={{ backgroundColor: tenant?.primary_color }}
                                            >
                                                Continuar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Forma de Pagamento
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <RadioGroup
                                            value={formData.paymentMethod}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    paymentMethod: value as "pix" | "card" | "boleto",
                                                })
                                            }
                                            className="space-y-3"
                                        >
                                            <div
                                                className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.paymentMethod === "pix"
                                                        ? "border-green-500 bg-green-50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                                onClick={() =>
                                                    setFormData({ ...formData, paymentMethod: "pix" })
                                                }
                                            >
                                                <RadioGroupItem value="pix" id="pix" />
                                                <QrCode className="h-6 w-6 text-green-600" />
                                                <div className="flex-1">
                                                    <Label htmlFor="pix" className="font-medium cursor-pointer">
                                                        PIX
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Aprovação instantânea
                                                    </p>
                                                </div>
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                    Recomendado
                                                </span>
                                            </div>

                                            <div
                                                className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.paymentMethod === "card"
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                                onClick={() =>
                                                    setFormData({ ...formData, paymentMethod: "card" })
                                                }
                                            >
                                                <RadioGroupItem value="card" id="card" />
                                                <CreditCard className="h-6 w-6 text-blue-600" />
                                                <div className="flex-1">
                                                    <Label htmlFor="card" className="font-medium cursor-pointer">
                                                        Cartão de Crédito
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Em até 12x sem juros
                                                    </p>
                                                </div>
                                            </div>
                                        </RadioGroup>

                                        <div className="space-y-2">
                                            <Label>Observações do pedido</Label>
                                            <Textarea
                                                value={formData.notes}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, notes: e.target.value })
                                                }
                                                placeholder="Alguma observação especial?"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setStep(2)}
                                                className="flex-1"
                                            >
                                                Voltar
                                            </Button>
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isProcessing}
                                                className="flex-1"
                                                style={{ backgroundColor: tenant?.primary_color }}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Processando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="h-4 w-4 mr-2" />
                                                        Finalizar Pedido
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Resumo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Cart Items */}
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <img
                                                src={item.image_url || "/images/default-product-512.png"}
                                                alt={item.name}
                                                className="w-14 h-14 object-cover rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{item.name}</p>
                                                {item.variation && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.variation}
                                                    </p>
                                                )}
                                                <p className="text-sm">
                                                    {item.quantity}x R$ {item.price.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                {/* Coupon */}
                                <div className="flex gap-2">
                                    <Input
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="Cupom de desconto"
                                        className="flex-1"
                                        disabled={!!appliedCoupon}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => applyCouponMutation.mutate(couponCode)}
                                        disabled={!couponCode || !!appliedCoupon || applyCouponMutation.isPending}
                                    >
                                        {applyCouponMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : appliedCoupon ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            "Aplicar"
                                        )}
                                    </Button>
                                </div>

                                <Separator />

                                {/* Totals */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    {shippingCost > 0 && (
                                        <div className="flex justify-between">
                                            <span>Frete</span>
                                            <span>R$ {shippingCost.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Desconto ({appliedCoupon?.code})</span>
                                            <span>- R$ {discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>R$ {total.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
