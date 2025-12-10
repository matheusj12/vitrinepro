import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tenant, StoreSettings } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface SettingsManagerProps {
  tenant: Tenant;
}

const DEFAULT_WHATSAPP_ICON = "/images/whatsapp/whta.png";

const SettingsManager = ({ tenant }: SettingsManagerProps) => {
  const queryClient = useQueryClient();
  const [whatsapp, setWhatsapp] = useState("");
  const [showWhatsappButton, setShowWhatsappButton] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [domainVerified, setDomainVerified] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [whatsIconFile, setWhatsIconFile] = useState<File | null>(null);
  const [whatsIconUrl, setWhatsIconUrl] = useState<string>("");
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Links de redes sociais (cliente)
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pinterestUrl, setPinterestUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["store-settings", tenant.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("tenant_id", tenant.id)
        .single();

      if (error && (error as any).code !== "PGRST116") throw error;

      if (data) {
        const contact = (data as StoreSettings).contact || {};
        const branding = (data as StoreSettings).branding || {};
        const storefront = (data as StoreSettings).storefront || {};
        setWhatsapp(contact.whatsapp_number || "");
        setInstagramUrl(contact.instagram_url || "");
        setFacebookUrl(contact.facebook_url || "");
        setTiktokUrl(contact.tiktok_url || "");
        setYoutubeUrl(contact.youtube_url || "");
        setPinterestUrl(contact.pinterest_url || "");
        setLinkedinUrl(contact.linkedin_url || "");
        setTwitterUrl(contact.twitter_url || "");
        setShowWhatsappButton(storefront.show_whatsapp_button !== false);
        setLogoUrl(branding.logo_url || "");
        setAboutText(branding.about_text || "");
        setWhatsIconUrl((data as any)?.floating_button_icon_url || "");
      }

      return data as StoreSettings | null;
    },
  });

  const { data: tenantData } = useQuery({
    queryKey: ["tenant-data", tenant.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("store_name, custom_domain, custom_domain_verified")
        .eq("id", tenant.id)
        .single();

      if (error) throw error;

      setStoreName(data.store_name || tenant.company_name);
      setCustomDomain(data.custom_domain || "");
      setDomainVerified(data.custom_domain_verified || false);

      return data;
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async (data: {
      whatsapp: string;
      instagram: string;
      facebook: string;
      tiktok: string;
      youtube: string;
      pinterest: string;
      linkedin: string;
      twitter: string;
      showWhatsappButton: boolean;
    }) => {
      const contact = {
        whatsapp_number: data.whatsapp,
        instagram_url: data.instagram,
        facebook_url: data.facebook,
        tiktok_url: data.tiktok,
        youtube_url: data.youtube,
        pinterest_url: data.pinterest,
        linkedin_url: data.linkedin,
        twitter_url: data.twitter,
      };
      const currentStorefront = (settings?.storefront as any) || {};
      const storefront = {
        ...currentStorefront,
        show_whatsapp_button: data.showWhatsappButton,
      };

      if (settings) {
        const { error } = await supabase
          .from("store_settings")
          .update({ contact, storefront })
          .eq("tenant_id", tenant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_settings").insert({
          tenant_id: tenant.id,
          contact,
          storefront,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings", tenant.id] });
      toast.success("Contato atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateBrandingMutation = useMutation({
    mutationFn: async (data: { logoUrl: string; aboutText: string }) => {
      const currentBranding = (settings?.branding as any) || {};
      const branding = {
        ...currentBranding,
        logo_url: data.logoUrl,
        about_text: data.aboutText,
      };

      if (settings) {
        const { error } = await supabase
          .from("store_settings")
          .update({ branding })
          .eq("tenant_id", tenant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_settings").insert({
          tenant_id: tenant.id,
          branding,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings", tenant.id] });
      toast.success("Identidade visual atualizada!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenant_id", tenant.id);

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-logo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fazer upload");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      const newUrl = data.logo_url;
      setLogoUrl(newUrl);
      // branding já foi salvo pela Edge Function; apenas reflete na UI e revalida cache
      queryClient.invalidateQueries({ queryKey: ["store-settings", tenant.id] });
      toast.success("Logo atualizada com sucesso!");
      setLogoFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao fazer upload da logo");
    },
  });

  const uploadWhatsIcon = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tenantId", tenant.id);

    const { data, error } = await supabase.functions.invoke(
      "upload-floating-icon",
      { body: formData }
    );

    if (error) {
      throw new Error("Erro ao fazer upload do ícone");
    }

    const url = (data as any)?.url as string | undefined;
    if (!url) {
      throw new Error("URL do ícone não retornada");
    }

    const { error: updErr } = await supabase
      .from("store_settings")
      .update({ floating_button_icon_url: url } as any)
      .eq("tenant_id", tenant.id);

    if (updErr) throw updErr;

    return url;
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      toast.error("Selecione um arquivo");
      return;
    }
    setUploadingLogo(true);
    try {
      await uploadLogoMutation.mutateAsync(logoFile);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleWhatsIconUpload = async () => {
    if (!whatsIconFile) {
      toast.error("Selecione um arquivo PNG");
      return;
    }
    if (whatsIconFile.type !== "image/png") {
      toast.error("Apenas arquivos PNG são aceitos.");
      return;
    }
    if (whatsIconFile.size > 200 * 1024) {
      toast.error("Arquivo muito grande. Máximo 200 KB.");
      return;
    }

    setUploadingIcon(true);
    try {
      const url = await uploadWhatsIcon(whatsIconFile);
      setWhatsIconUrl(url);
      queryClient.invalidateQueries({ queryKey: ["store-settings", tenant.id] });
      toast.success("Ícone do WhatsApp atualizado!");
      setWhatsIconFile(null);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao fazer upload do ícone");
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleUseDefaultWhatsIcon = async () => {
    setUploadingIcon(true);
    try {
      const { error: updErr } = await supabase
        .from("store_settings")
        .update({ floating_button_icon_url: DEFAULT_WHATSAPP_ICON } as any)
        .eq("tenant_id", tenant.id);

      if (updErr) throw updErr;

      setWhatsIconUrl(DEFAULT_WHATSAPP_ICON);
      queryClient.invalidateQueries({ queryKey: ["store-settings", tenant.id] });
      toast.success("Ícone padrão do WhatsApp aplicado!");
      setWhatsIconFile(null);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao aplicar ícone padrão");
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateContactMutation.mutate({
      whatsapp,
      instagram: instagramUrl,
      facebook: facebookUrl,
      tiktok: tiktokUrl,
      youtube: youtubeUrl,
      pinterest: pinterestUrl,
      linkedin: linkedinUrl,
      twitter: twitterUrl,
      showWhatsappButton,
    });
  };

  const handleBrandingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandingMutation.mutate({ logoUrl, aboutText });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Loja</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="contact">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contact">Contato</TabsTrigger>
            <TabsTrigger value="branding">Identidade</TabsTrigger>
            <TabsTrigger value="domain">Domínio</TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="space-y-4">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div>
                <Label>WhatsApp da Loja (com código do país)</Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="5511999999999"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Exemplo: 5511999999999 (sem + ou espaços)
                </p>
              </div>

              {/* Redes sociais (links do cliente) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Instagram (URL)</Label>
                  <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/sualoja" />
                </div>
                <div>
                  <Label>Facebook (URL)</Label>
                  <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/sualoja" />
                </div>
                <div>
                  <Label>TikTok (URL)</Label>
                  <Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://www.tiktok.com/@sualoja" />
                </div>
                <div>
                  <Label>YouTube (URL)</Label>
                  <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/@sualoja" />
                </div>
                <div>
                  <Label>Pinterest (URL)</Label>
                  <Input value={pinterestUrl} onChange={(e) => setPinterestUrl(e.target.value)} placeholder="https://pinterest.com/sualoja" />
                </div>
                <div>
                  <Label>LinkedIn (URL)</Label>
                  <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/company/sualoja" />
                </div>
                <div>
                  <Label>X / Twitter (URL)</Label>
                  <Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/sualoja" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="show-whatsapp" className="text-base">
                    Botão Flutuante de WhatsApp
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe um botão flutuante no canto inferior direito da vitrine pública
                  </p>
                </div>
                <Switch id="show-whatsapp" checked={showWhatsappButton} onCheckedChange={setShowWhatsappButton} />
              </div>

              {/* Upload do ícone do WhatsApp */}
              <div className="rounded-lg border p-4 space-y-3">
                <Label className="text-base">Ícone do Botão Flutuante (PNG, 64×64 recomendado)</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {whatsIconUrl ? (
                      <img src={whatsIconUrl} alt="Ícone atual do WhatsApp" className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Padrão</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input id="whats-icon-file" type="file" accept="image/png" onChange={(e) => setWhatsIconFile(e.target.files?.[0] || null)} />
                    <p className="text-xs text-muted-foreground mt-1">Apenas PNG, tamanho máx. 200 KB</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleWhatsIconUpload} disabled={!whatsIconFile || uploadingIcon}>
                      {uploadingIcon ? "Enviando..." : "Upload Ícone"}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleUseDefaultWhatsIcon} disabled={uploadingIcon || whatsIconUrl === DEFAULT_WHATSAPP_ICON}>
                      Usar Padrão
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>URL da Vitrine</Label>
                <Input value={`${window.location.origin}/loja/${tenant.slug}`} readOnly />
              </div>

              <Button type="submit" disabled={updateContactMutation.isPending}>
                {updateContactMutation.isPending ? "Salvando..." : "Salvar Contato"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sobre a Loja</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); updateBrandingMutation.mutate({ logoUrl, aboutText }); }} className="space-y-4">
                  <div>
                    <Label>Texto sobre a loja</Label>
                    <Textarea placeholder="Conte sobre sua loja, missão e produtos..." rows={4} value={aboutText} onChange={(e) => setAboutText(e.target.value)} />
                  </div>
                  <Button type="submit">Salvar</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Logo da Loja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {logoUrl && (
                  <div className="flex items-center gap-4">
                    <img src={logoUrl} alt="Logo atual" className="w-24 h-24 object-contain border rounded" />
                    <p className="text-sm text-muted-foreground">Logo atual</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="logo-file">Fazer upload de nova logo</Label>
                  <Input id="logo-file" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou WebP • Máximo 2MB</p>
                </div>
                <Button onClick={handleLogoUpload} disabled={!logoFile || uploadingLogo}>
                  {uploadingLogo ? "Fazendo upload..." : "Fazer Upload"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Domínio Customizado</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Seu Domínio</Label>
                  <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="loja.exemplo.com.br" />
                  {domainVerified ? (
                    <p className="text-sm text-green-600 mt-1">🟢 Domínio ativo</p>
                  ) : customDomain ? (
                    <p className="text-sm text-amber-600 mt-1">🟡 Aguardando configuração DNS</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">🔴 Sem domínio configurado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SettingsManager;