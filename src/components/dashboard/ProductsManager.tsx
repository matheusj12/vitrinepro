
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, Plus, Link as LinkIcon, Video, Copy, Sparkles, Loader2 } from "lucide-react";
import { generateProductDescription } from "@/services/ai-product-service";
import { UpgradeAlert } from "./UpgradeAlert";

const DEFAULT_PRODUCT_IMAGE = "/images/default-product-512.png";
const MAX_IMAGES = 5;

interface ProductsManagerProps {
  tenantId: string;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .replace(/-{2,}/g, "-");
};

const generateUniqueSlug = async (tenantId: string, baseSlug: string, excludeProductId?: string) => {
  const { data: rows, error } = await supabase
    .from("products")
    .select("id, slug")
    .eq("tenant_id", tenantId)
    .ilike("slug", `${baseSlug}%`);

  if (error) {
    console.error("Erro buscando slugs existentes:", error);
    return `${baseSlug}-${Date.now()}`;
  }

  const existing = new Set(
    (rows || [])
      .filter((r) => (excludeProductId ? r.id !== excludeProductId : true))
      .map((r) => r.slug)
  );

  if (!existing.has(baseSlug)) return baseSlug;

  let n = 2;
  while (existing.has(`${baseSlug}-${n}`)) {
    n += 1;
    if (n > 9999) break;
  }
  return `${baseSlug}-${n}`;
};

const normalizePriceToNumber = (raw: string): number | null => {
  if (raw == null) return null;
  let s = String(raw).trim().replace(/\s/g, "");
  if (!s) return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    s = s.replace(",", ".");
  } else if (hasDot) {
    const lastDot = s.lastIndexOf(".");
    const decimals = s.length - lastDot - 1;
    const isThousandPattern = /^\d{1,3}(\.\d{3})+$/.test(s);
    if (isThousandPattern || decimals === 3) {
      s = s.replace(/\./g, "");
    }
  }

  const num = Number(s);
  if (Number.isNaN(num)) {
    throw new Error("Preço inválido. Use números, '.', ',' e separadores de milhar válidos.");
  }
  return num;
};

const ProductsManager = ({ tenantId }: ProductsManagerProps) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    min_quantity: "1",
    category_id: "",
    active: true,
    images: [] as string[],
    video_url: "",
  });

  const [imageUrlInput, setImageUrlInput] = useState("");
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as Product[]).map((p) => ({
        ...p,
        images: Array.isArray((p as any).images) ? (p as any).images : [],
        video_url: (p as any).video_url ?? null,
      }));
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      return data as Category[];
    },
  });

  const handleMutationError = (error: any) => {
    console.error("Mutation error:", error);
    const msg = error?.message || "Erro ao processar solicitação";
    if (msg.includes("Limite") || msg.includes("limit") || msg.includes("Upgrade") || msg.includes("plano")) {
      setShowUpgradeAlert(true);
    } else {
      toast.error(msg);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!Array.isArray(data.images) || data.images.length === 0) {
        throw new Error("Adicione pelo menos uma imagem ao produto");
      }

      const { data: limitCheck, error: limitError } = await supabase.functions.invoke("check-product-limit");

      if (limitError) {
        console.error("Erro check-product-limit:", limitError);
        throw new Error("Erro ao verificar limites do plano.");
      }

      if (!limitCheck?.can_create) {
        throw new Error(limitCheck?.message || "Limite de produtos atingido pelo plano atual.");
      }

      const baseSlug = slugify(data.name);
      const uniqueSlug = await generateUniqueSlug(tenantId, baseSlug);
      const images: string[] = data.images.slice(0, MAX_IMAGES);
      const firstImage = images[0] || null;

      const priceNumber = data.price ? normalizePriceToNumber(data.price) : null;

      const { error } = await supabase.from("products").insert({
        tenant_id: tenantId,
        name: data.name,
        slug: uniqueSlug,
        sku: data.sku || null,
        description: data.description || null,
        price: priceNumber !== null ? priceNumber : null,
        min_quantity: parseInt(data.min_quantity),
        category_id: data.category_id || null,
        active: data.active,
        image_url: firstImage || DEFAULT_PRODUCT_IMAGE,
        images: images,
        video_url: data.video_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      toast.success("Produto criado!");
      resetForm();
    },
    onError: handleMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!Array.isArray(data.images) || data.images.length === 0) {
        throw new Error("Adicione pelo menos uma imagem ao produto");
      }

      const baseSlug = slugify(data.name);
      const uniqueSlug = await generateUniqueSlug(tenantId, baseSlug, id);
      const images: string[] = data.images.slice(0, MAX_IMAGES);
      const firstImage = images[0] || null;

      const priceNumber = data.price ? normalizePriceToNumber(data.price) : null;

      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          slug: uniqueSlug,
          sku: data.sku || null,
          description: data.description || null,
          price: priceNumber !== null ? priceNumber : null,
          min_quantity: parseInt(data.min_quantity),
          category_id: data.category_id || null,
          active: data.active,
          image_url: firstImage || DEFAULT_PRODUCT_IMAGE,
          images: images,
          video_url: data.video_url || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      toast.success("Produto atualizado!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar produto");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      toast.success("Produto deletado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar produto");
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado.");

      const { data: limitCheck, error: limitError } = await supabase.functions.invoke("check-product-limit");

      if (limitError || !limitCheck.can_create) {
        throw new Error(limitCheck?.message || "Limite de produtos atingido.");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clone-product`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao duplicar produto");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      toast.success(`Produto "${data.newProduct.name}" duplicado!`);
    },
    onError: handleMutationError,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      price: "",
      min_quantity: "1",
      category_id: "",
      active: true,
      images: [],
      video_url: "",
    });
    setImageUrlInput("");
    setVideoUrlInput("");
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      sku: product.sku || "",
      description: product.description || "",
      price: product.price != null ? product.price.toString() : "",
      min_quantity: product.min_quantity.toString(),
      category_id: product.category_id || "",
      active: product.active,
      images: Array.isArray(product.images)
        ? product.images.slice(0, MAX_IMAGES)
        : product.image_url
          ? [product.image_url]
          : [],
      video_url: product.video_url || "",
    });
    setEditingId(product.id);
    setIsCreating(true);
  };

  const handleImagesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_IMAGES - formData.images.length;
    const selected = files.slice(0, remainingSlots);

    const readers = selected.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((dataUrls) => {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...dataUrls].slice(0, MAX_IMAGES),
      }));
    });
    e.currentTarget.value = "";
  };

  const handleAddImageByUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (formData.images.length >= MAX_IMAGES) {
      toast.error(`Máximo de ${MAX_IMAGES} imagens`);
      return;
    }
    setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
    setImageUrlInput("");
  };

  const removeImageAt = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const valid = ["video/mp4", "video/quicktime"].includes(file.type);
    if (!valid) {
      toast.error("Formato de vídeo inválido. Use MP4 ou MOV.");
      e.currentTarget.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, video_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = "";
  };

  const handleSetVideoByUrl = () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    setFormData((prev) => ({ ...prev, video_url: url }));
    setVideoUrlInput("");
  };

  const clearVideo = () => {
    setFormData((prev) => ({ ...prev, video_url: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.images || formData.images.length === 0) {
      toast.error("Adicione pelo menos uma imagem ao produto");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDuplicate = (productId: string) => {
    // Bloqueio preventivo no frontend (assumindo plano grátis se não tiver info de subscription)
    if (products.length >= 10) {
      setShowUpgradeAlert(true);
      return;
    }
    cloneMutation.mutate(productId);
  };

  return (
    <div className="space-y-4">
      <UpgradeAlert open={showUpgradeAlert} onOpenChange={setShowUpgradeAlert} />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Produtos ({products.length})</h2>
        <Button onClick={() => {
          if (!isCreating && products.length >= 10) {
            setShowUpgradeAlert(true);
            return;
          }
          setIsCreating(!isCreating);
        }}>
          {isCreating ? "Cancelar" : "Novo Produto"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar" : "Novo"} Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Descrição</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!formData.name || isGeneratingDescription}
                    onClick={async () => {
                      if (!formData.name) {
                        toast.error("Digite o nome do produto primeiro");
                        return;
                      }
                      setIsGeneratingDescription(true);
                      try {
                        const selectedCategory = categories.find(c => c.id === formData.category_id);
                        const result = await generateProductDescription(
                          formData.name,
                          selectedCategory?.name,
                          formData.description
                        );
                        setFormData(prev => ({ ...prev, description: result.description }));
                        toast.success("Descrição gerada com IA!");
                      } catch (error: any) {
                        toast.error(error.message || "Erro ao gerar descrição");
                      } finally {
                        setIsGeneratingDescription(false);
                      }
                    }}
                    className="text-xs"
                  >
                    {isGeneratingDescription ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    Gerar com IA
                  </Button>
                </div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva seu produto ou clique em 'Gerar com IA'..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Preço</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex.: 2.500,99"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Aceita: 2.500 / 25.000 / 2.50 / 2,50 / 2.500,99
                </p>
              </div>
              <div>
                <Label>Qtd Mínima *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                  required
                />
              </div>

              {/* Imagens (até 5) */}
              <div className="space-y-2">
                <Label>Imagens do Produto (até {MAX_IMAGES})</Label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {formData.images.length === 0 && (
                      <div className="w-20 h-20 border rounded-lg overflow-hidden bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        Sem imagens
                      </div>
                    )}
                    {formData.images.map((src, idx) => (
                      <div key={`${src}-${idx}`} className="relative w-20 h-20 border rounded-lg overflow-hidden bg-muted">
                        <img
                          src={src || DEFAULT_PRODUCT_IMAGE}
                          className="w-full h-full object-cover"
                          alt={`Imagem ${idx + 1}`}
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE; }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImageAt(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:scale-110 transition-transform"
                          title="Remover imagem"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div>
                      <Input
                        id="images-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesFileChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="images-upload"
                        className="flex items-center gap-2 cursor-pointer border border-input rounded-md px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors w-fit"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Adicionar Imagens</span>
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="url"
                        placeholder="Cole a URL da imagem"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="w-64"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={handleAddImageByUrl} disabled={!imageUrlInput}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vídeo */}
              <div className="space-y-2">
                <Label>Vídeo do Produto (opcional)</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <div>
                    <Input
                      id="video-upload"
                      type="file"
                      accept="video/mp4,video/quicktime"
                      onChange={handleVideoFileChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="video-upload"
                      className="flex items-center gap-2 cursor-pointer border border-input rounded-md px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors w-fit"
                    >
                      <Video className="h-4 w-4" />
                      <span className="text-sm">Enviar Vídeo (MP4/MOV)</span>
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="url"
                      placeholder="ou cole um link externo (MP4/MOV)"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      className="w-64"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleSetVideoByUrl} disabled={!videoUrlInput}>
                      <LinkIcon className="h-4 w-4 mr-1" /> Usar Link
                    </Button>
                  </div>

                  {formData.video_url && (
                    <Button type="button" variant="destructive" size="sm" onClick={clearVideo}>
                      Remover Vídeo
                    </Button>
                  )}
                </div>

                {formData.video_url && (
                  <div className="mt-3">
                    <video
                      src={formData.video_url}
                      className="w-full max-w-md rounded border"
                      controls
                      controlsList="nodownload"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Categoria</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        {products.map((product, index) => (
          <Card key={product.id} className="hover-scale transition-all duration-300 hover:shadow-lg animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <img
                    src={(Array.isArray(product.images) && product.images[0]) || product.image_url || DEFAULT_PRODUCT_IMAGE}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded hover-scale transition-transform"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE; }}
                  />
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                    <p className="text-sm">
                      {product.price ? `R$ ${product.price.toFixed(2)}` : "Preço sob consulta"}
                    </p>
                    <p className="text-sm text-muted-foreground">Min: {product.min_quantity}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="hover-scale">
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(product.id)}
                    disabled={cloneMutation.isPending}
                    className="hover-scale"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Deletar este produto?")) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                    className="hover-scale"
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

export default ProductsManager;