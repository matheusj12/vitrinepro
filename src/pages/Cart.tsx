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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { StoreSettings, Category } from "@/types/database";
import { FloatingWhatsAppButton } from "@/components/storefront/FloatingWhatsAppButton";
import { PublicHeader } from "@/components/storefront/PublicHeader";

const Cart = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: tenant } = useTenantBySlug(slug);
  const { items, updateQuantity, removeItem, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [observations, setObservations] = useState("");

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

  // Links globais (Super Admin)
  const { data: globalSocial } = useQuery({
    queryKey: ["system-settings-social"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("social")
        .limit(1)
        .maybeSingle();
      if (error) return {};
      return (data?.social as Record<string, string>) || {};
    },
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
          `- ${item.product.name} (Qtd: ${item.quantity})`
      )
      .join("\n");

    const lojaLink = `${window.location.origin}/loja/${slug}`;
    const emailVal = customerEmail || "Não informado";
    const obsVal = observations || "Nenhuma";

    // Links globais
    const instagramLink = (globalSocial as any)?.instagram || "-";
    const facebookLink = (globalSocial as any)?.facebook || "-";
    const tikTokLink = (globalSocial as any)?.tiktok || "-";

    const message =
`🚀 *Orçamento enviado com sucesso!*

${customerName}, recebemos seu pedido e estamos preparando uma oferta especial para você 👇

🛒 *Produtos selecionados:*  
${listaProdutos}

📱 *Seus dados:*  
WhatsApp: ${customerWhatsapp}  
Email: ${emailVal}

💭 *Observação:*  
${obsVal}

🔗 *Link da loja:* ${lojaLink}

📣 *Siga a gente nas redes sociais:*  
Instagram: ${instagramLink}  
Facebook: ${facebookLink}  
TikTok: ${tikTokLink}

Em alguns instantes enviaremos seu valor final.  
Se preferir agilizar, envie *"Quero fechar"* por aqui! 😉`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${storeWhatsapp}&text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
    toast.info("Abrindo WhatsApp com seu orçamento...");
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
    <div className="min-h-screen bg-background">
      <PublicHeader
        storeName={tenant?.company_name || "Loja"}
        logoUrl={(settings as any)?.branding?.logo_url}
        whatsappNumber={(settings as any)?.contact?.whatsapp_number}
        // Redes sociais agora vêm do Super Admin no header via Storefront (Cart não precisa mostrá-las no topo)
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(`/loja/${slug}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a loja
        </Button>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Produtos</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.product.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{item.product.name}</h3>
                        {item.product.price && <p className="text-sm text-muted-foreground">R$ {item.product.price.toFixed(2)}</p>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item.product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= item.product.min_quantity}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Seus Dados</h2>
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label>WhatsApp *</Label>
                    <Input value={customerWhatsapp} onChange={(e) => setCustomerWhatsapp(e.target.value)} placeholder="5511999999999" required />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Alguma informação adicional?" />
                  </div>
                  <Button type="submit" className="w-full">
                    Enviar Orçamento via WhatsApp
                  </Button>
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