import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type NetworkKey = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'pinterest' | 'linkedin' | 'twitter';

const NETWORKS: { key: NetworkKey; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'X / Twitter' },
];

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<NetworkKey | null>(null);
  const [icons, setIcons] = useState<Record<NetworkKey, string | undefined>>({
    instagram: undefined,
    facebook: undefined,
    tiktok: undefined,
    youtube: undefined,
    pinterest: undefined,
    linkedin: undefined,
    twitter: undefined,
  });
  const [files, setFiles] = useState<Record<NetworkKey, File | null>>({
    instagram: null,
    facebook: null,
    tiktok: null,
    youtube: null,
    pinterest: null,
    linkedin: null,
    twitter: null,
  });

  // Carregar ícones a partir de system_settings.social.icons
  const loadIcons = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("social")
        .limit(1)
        .maybeSingle();
      if (error) {
        throw error;
      }
      const iconsObj = (data?.social as any)?.icons || {};
      setIcons((prev) => ({
        instagram: iconsObj.instagram || prev.instagram,
        facebook: iconsObj.facebook || prev.facebook,
        tiktok: iconsObj.tiktok || prev.tiktok,
        youtube: iconsObj.youtube || prev.youtube,
        pinterest: iconsObj.pinterest || prev.pinterest,
        linkedin: iconsObj.linkedin || prev.linkedin,
        twitter: iconsObj.twitter || prev.twitter,
      }));
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIcons();
  }, []);

  const onUpload = async (key: NetworkKey) => {
    const file = files[key];
    if (!file) {
      toast.error("Selecione um arquivo SVG ou PNG (máx 512KB)");
      return;
    }
    setUploadingKey(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const form = new FormData();
      form.append("file", file);
      // NOTE: aceitamos 'twitter' como chave; a função aceita 'x' também, mas aqui padronizamos 'twitter'
      form.append("network", key);

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-social-icon`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: form,
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e?.error || "Falha no upload");
      }

      const json = await res.json();
      setIcons(prev => ({ ...prev, [key]: json.url as string }));
      toast.success("Ícone atualizado!");
      setFiles(prev => ({ ...prev, [key]: null }));
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar ícone");
    } finally {
      setUploadingKey(null);
    }
  };

  const Field = ({ keyName, label }: { keyName: NetworkKey; label: string }) => (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-medium">{label}</Label>
        <div className="w-8 h-8 flex items-center justify-center rounded bg-muted overflow-hidden">
          {icons[keyName] ? (
            <img src={icons[keyName]} alt={label} className="w-6 h-6 object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>
      <Input
        type="file"
        accept="image/svg+xml,image/png"
        onChange={(e) => setFiles(prev => ({ ...prev, [keyName]: e.target.files?.[0] || null }))}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => onUpload(keyName)}
          disabled={!files[keyName] || uploadingKey === keyName}
        >
          {uploadingKey === keyName ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</> : 'Enviar Ícone'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Formatos aceitos: SVG ou PNG (máx 512KB). Os links permanecem no painel do cliente.</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Globais do Sistema — Ícones das Redes Sociais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Envie aqui os ícones oficiais (SVG/PNG). Os links continuam configurados por cada loja no painel do cliente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NETWORKS.map(n => (
            <Field key={n.key} keyName={n.key} label={n.label} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemSettings;