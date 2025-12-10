import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Banner } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, X, ChevronUp, ChevronDown } from "lucide-react";

const DEFAULT_BANNER_IMAGE = "/images/default-banner-2560x1440.png";

interface BannersManagerProps {
  tenantId: string;
}

const BannersManager = ({ tenantId }: BannersManagerProps) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link: "",
    active: true,
    order_position: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: banners = [] } = useQuery({
    queryKey: ["banners", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("order_position");

      if (error) throw error;
      return data as Banner[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Se não tiver imagem, usar banner padrão
      const finalImageUrl = data.image_url || DEFAULT_BANNER_IMAGE;
      
      const { error } = await supabase.from("banners").insert({
        tenant_id: tenantId,
        ...data,
        image_url: finalImageUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners", tenantId] });
      toast.success("Banner criado!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Se não tiver imagem, usar banner padrão
      const finalImageUrl = data.image_url || DEFAULT_BANNER_IMAGE;
      
      const { error } = await supabase.from("banners").update({
        ...data,
        image_url: finalImageUrl,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners", tenantId] });
      toast.success("Banner atualizado!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners", tenantId] });
      toast.success("Banner deletado!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      link: "",
      active: true,
      order_position: 0,
    });
    setImageFile(null);
    setImagePreview("");
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (banner: Banner) => {
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      image_url: banner.image_url || "",
      link: banner.link || "",
      active: banner.active,
      order_position: banner.order_position,
    });
    setImagePreview(banner.image_url || DEFAULT_BANNER_IMAGE);
    setImageFile(null);
    setEditingId(banner.id);
    setIsCreating(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData({ ...formData, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, image_url: "" });
  };

  const handleMoveUp = async (banner: Banner) => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    if (currentIndex > 0) {
      const previousBanner = banners[currentIndex - 1];
      await Promise.all([
        supabase.from("banners").update({ order_position: previousBanner.order_position }).eq("id", banner.id),
        supabase.from("banners").update({ order_position: banner.order_position }).eq("id", previousBanner.id),
      ]);
      queryClient.invalidateQueries({ queryKey: ["banners", tenantId] });
      toast.success("Posição atualizada!");
    }
  };

  const handleMoveDown = async (banner: Banner) => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    if (currentIndex < banners.length - 1) {
      const nextBanner = banners[currentIndex + 1];
      await Promise.all([
        supabase.from("banners").update({ order_position: nextBanner.order_position }).eq("id", banner.id),
        supabase.from("banners").update({ order_position: banner.order_position }).eq("id", nextBanner.id),
      ]);
      queryClient.invalidateQueries({ queryKey: ["banners", tenantId] });
      toast.success("Posição atualizada!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Banners ({banners.length})</h2>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? "Cancelar" : "Novo Banner"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar" : "Novo"} Banner</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Imagem do Banner</Label>
                <div className="space-y-3">
                  {/* Preview da Imagem */}
                  <div className="relative w-full h-32 border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imagePreview || DEFAULT_BANNER_IMAGE}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    {imagePreview && imagePreview !== DEFAULT_BANNER_IMAGE && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:scale-110 transition-transform"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Upload de Arquivo */}
                  <div>
                    <Input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="banner-upload"
                      className="flex items-center gap-2 cursor-pointer border border-input rounded-md px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors w-fit"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Escolher Imagem</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {imageFile ? imageFile.name : "Nenhuma imagem selecionada (usará banner padrão)"}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <Label>Link (opcional)</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Banner ativo</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Salvar</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {banners.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Nenhum banner cadastrado. Será exibido o banner padrão na vitrine.</p>
              <div className="mt-4">
                <img 
                  src={DEFAULT_BANNER_IMAGE} 
                  alt="Banner padrão" 
                  className="w-full max-w-md mx-auto rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        )}
        {banners.map((banner, index) => (
          <Card key={banner.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <img 
                  src={banner.image_url || DEFAULT_BANNER_IMAGE} 
                  alt={banner.title || ""} 
                  className="w-40 h-24 object-cover rounded" 
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{banner.title || "Sem título"}</h3>
                  <p className="text-sm text-muted-foreground">{banner.subtitle || "Sem subtítulo"}</p>
                  <p className="text-xs text-muted-foreground">Posição: {banner.order_position}</p>
                  <p className="text-xs">{banner.active ? "✓ Ativo" : "✗ Inativo"}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleMoveUp(banner)}
                      disabled={index === 0}
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleMoveDown(banner)}
                      disabled={index === banners.length - 1}
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Deletar este banner?")) {
                        deleteMutation.mutate(banner.id);
                      }
                    }}
                  >
                    Deletar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BannersManager;
