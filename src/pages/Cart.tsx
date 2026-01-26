
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantBySlug } from "@/hooks/useTenant";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Minus, Plus, Trash2, ArrowLeft, Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StoreSettings, Category } from "@/types/database";
import { FloatingWhatsAppButton } from "@/components/storefront/FloatingWhatsAppButton";
import { PublicHeader } from "@/components/storefront/PublicHeader";
import { Separator } from "@/components/ui/separator";

const Cart = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: tenant } = useTenantBySlug(slug);
  const { items, updateQuantity, removeItem, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [observations, setObservations] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["store-settings", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("tenant_id", tenant.id)
        .single();

      if (error && (error as any).code !== "PGRST116") throw error;
      return data as StoreSettings | null;
    },
    enabled: !!tenant?.id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["storefront-categories", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("active", true);

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!tenant?.id,
  });

  // Calculate Totals
  const subtotal = items.reduce((acc, item) => acc + (item.product.price || 0) * item.quantity, 0);

  const discountAmount = appliedCoupon
    ? (appliedCoupon.type === "percentage"
      ? (subtotal * (appliedCoupon.value / 100))
      : appliedCoupon.value)
    : 0;

  // Apply limits
  let finalDiscount = discountAmount;
  if (appliedCoupon && appliedCoupon.max_discount && finalDiscount > appliedCoupon.max_discount) {
    finalDiscount = appliedCoupon.max_discount;
  }
  finalDiscount = Math.min(finalDiscount, subtotal); // Cannot be more than subtotal

  const total = Math.max(0, subtotal - finalDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    setAppliedCoupon(null);

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("tenant_id", tenant?.id)
        .eq("code", couponCode.toUpperCase().trim())
        .eq("active", true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setCouponError("Cupom inválido ou não encontrado.");
        return;
      }

      // Validations
      const now = new Date();
      if (data.valid_until && new Date(data.valid_until) < now) {
        setCouponError("Este cupom expirou.");
        return;
      }

      if (data.max_uses && data.used_count >= data.max_uses) {
        setCouponError("Limite de uso deste cupom atingido.");
        return;
      }

      if (data.min_purchase && subtotal < data.min_purchase) {
        setCouponError(`Compra mínima de R$ ${data.min_purchase.toFixed(2)} para este cupom.`);
        return;
      }

      setAppliedCoupon(data);
      toast.success("Cupom aplicado com sucesso!");
    } catch (err) {
      console.error(err);
      setCouponError("Erro ao validar cupom.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Cupom removido.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Carrinho vazio!");
      return;
    }

    if (!tenant) {
      toast.error("Loja não encontrada!");
      return;
    }

    const storeWhatsapp = (settings as any)?.contact?.whatsapp_number || tenant.whatsapp_number;

    if (!storeWhatsapp) {
      toast.error("WhatsApp da loja não configurado!");
      return;
    }

    const listaProdutos = items
      .map(
        (item) =>
          `- ${item.product.name} (Qtd: ${item.quantity}) | R$ ${(item.product.price * item.quantity).toFixed(2)}`
      )
      .join("\n");

    const lojaLink = `${window.location.origin}/loja/${slug}`;
    const emailVal = customerEmail || "Não informado";
    const obsVal = observations || "Nenhuma";

    const discountText = appliedCoupon ? `\n🎁 *Cupom:* ${appliedCoupon.code}\n💰 *Desconto:* -R$ ${finalDiscount.toFixed(2)}` : "";

    const message =
      `🚀 *Novo Pedido - VitrinePro*
--------------------------------
👤 *Cliente:* ${customerName}
📞 *WhatsApp:* ${customerWhatsapp}
📧 *Email:* ${emailVal}

🛒 *RESUMO DO PEDIDO:*
${listaProdutos}

💵 *Subtotal:* R$ ${subtotal.toFixed(2)}${discountText}
✅ *TOTAL A PAGAR:* R$ ${total.toFixed(2)}
--------------------------------
💭 *Observações:*
${obsVal}

🔗 Link da loja: ${lojaLink}

Aguardando confirmação de pagamento/entrega.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${storeWhatsapp}&text=${encodedMessage}`;

    // Increment coupon usage (fire and forget)
    if (appliedCoupon) {
      try {
        await supabase.from("coupons").update({ used_count: appliedCoupon.used_count + 1 }).eq("id", appliedCoupon.id);
      } catch (err) {
        console.error("Erro ao incrementar uso do cupom", err);
      }
    }

    window.open(whatsappUrl, "_blank");
    toast.success("Pedido enviado para o WhatsApp!");
    clearCart();

    setTimeout(() => {
      navigate(`/loja/${slug}`);
    }, 1000);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Carrinho Vazio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Seu carrinho está vazio.</p>
            <Button onClick={() => navigate(`/loja/${slug}`)}>Voltar para loja</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const floatingIconUrl = (settings as any)?.floating_button_icon_url as string | undefined;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PublicHeader
        storeName={tenant?.company_name || "Loja"}
        logoUrl={(settings as any)?.branding?.logo_url}
        whatsappNumber={(settings as any)?.contact?.whatsapp_number}
        instagramUrl={undefined}
        facebookUrl={undefined}
        tiktokUrl={undefined}
        youtubeUrl={undefined}
        whatsappBusinessUrl={undefined}
        pinterestUrl={undefined}
        twitterUrl={undefined}
        linkedinUrl={undefined}
        categories={categories || []}
        slug={slug!}
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" className="mb-6 hover:bg-transparent pl-0" onClick={() => navigate(`/loja/${slug}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a loja
        </Button>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Coluna da Esquerda: Produtos */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Seu Carrinho</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.product.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex gap-4 items-center">
                    <div className="h-20 w-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">Sem img</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{item.product.name}</h3>
                          <p className="text-sm text-gray-500">{item.product.sku}</p>
                        </div>
                        <p className="font-bold text-lg">R$ {(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= item.product.min_quantity}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(item.product.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Remover
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Coluna da Direita: Resumo e Dados */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Resumo do Pedido</h2>

            <Card className="border-none shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Valores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span className="flex items-center gap-1"><Ticket className="w-3 h-3" /> Desconto ({appliedCoupon.code})</span>
                    <span>- R$ {finalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>

                {/* Área de Cupom */}
                <div className="pt-4">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Cupom de Desconto</Label>
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Código"
                        className="uppercase"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                      />
                      <Button onClick={handleApplyCoupon} disabled={isValidatingCoupon || !couponCode}>
                        {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 flex justify-between items-center text-green-700 text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <Ticket className="w-4 h-4" /> {appliedCoupon.code} aplicado
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-700 hover:text-green-900" onClick={handleRemoveCoupon}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Finalizar Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="Seu nome" />
                  </div>
                  <div>
                    <Label>WhatsApp *</Label>
                    <Input value={customerWhatsapp} onChange={(e) => setCustomerWhatsapp(e.target.value)} placeholder="DDD + Número" required />
                  </div>
                  <div>
                    <Label>Email (Opcional)</Label>
                    <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="seu@email.com" />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Endereço de entrega, tamanho, cor..." />
                  </div>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold shadow-lg shadow-green-600/20">
                    Enviar Pedido no WhatsApp
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Ao enviar, você será redirecionado para o WhatsApp da loja para finalizar o pagamento e combinar a entrega.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {(settings as any)?.contact?.whatsapp_number && (settings as any)?.storefront?.show_whatsapp_button !== false && (
        <FloatingWhatsAppButton
          whatsappNumber={(settings as any).contact.whatsapp_number}
          tenantName={tenant?.company_name}
          iconUrl={floatingIconUrl}
        />
      )}
    </div>
  );
};

export default Cart;