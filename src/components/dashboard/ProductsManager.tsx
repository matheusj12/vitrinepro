
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Upload, X, Plus, Link as LinkIcon, Video, Copy, Sparkles, Loader2,
  MoreHorizontal, Search, Filter, ArrowUpDown, Pencil, Trash2, Tag, Image as ImageIcon
} from "lucide-react";
import { generateProductDescription } from "@/services/ai-product-service";
// Removed UpgradeAlert to prevent crash

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
  if (Number.isNaN(num)) throw new Error("Preço inválido.");
  return num;
};

const ProductsManager = ({ tenantId }: ProductsManagerProps) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Removed showUpgradeAlert state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

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
        .select(`
            *,
            categories (name)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]).map((p) => ({
        ...p,
        images: Array.isArray(p.images) ? p.images : [],
        video_url: p.video_url ?? null,
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!Array.isArray(data.images) || data.images.length === 0) {
        throw new Error("Adicione pelo menos uma imagem ao produto");
      }

      if (products.length >= 50) {
        throw new Error("Limite atingido (50 produtos).");
      }

      const baseSlug = slugify(data.name);
      const uniqueSlug = await generateUniqueSlug(tenantId, baseSlug);
      const images: string[] = data.images.slice(0, MAX_IMAGES);
      const firstImage = images[0] || null;
      const priceNumber = data.price ? normalizePriceToNumber(data.price) : null;

      const payload = {
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
      };

      try {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      } catch (err: any) {
        if (err.message && (err.message.includes("images") || err.message.includes("schema"))) {
          const { images, ...legacyPayload } = payload;
          const { error: retryError } = await supabase.from("products").insert(legacyPayload);
          if (retryError) throw retryError;
          toast.info("Salvo em modo de compatibilidade");
        } else {
          throw err;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      toast.success("Produto criado!");
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const baseSlug = slugify(data.name);
      const uniqueSlug = await generateUniqueSlug(tenantId, baseSlug, id);
      const images: string[] = data.images.slice(0, MAX_IMAGES);
      const firstImage = images[0] || null;
      const priceNumber = data.price ? normalizePriceToNumber(data.price) : null;

      const payload = {
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
      };

      try {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        if (err.message && (err.message.includes("images") || err.message.includes("schema"))) {
          const { images, ...legacyPayload } = payload;
          const { error: retryError } = await supabase.from("products").update(legacyPayload).eq("id", id);
          if (retryError) throw retryError;
        } else {
          throw err;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      toast.success("Produto atualizado!");
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      toast.success("Produto excluído.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (product: Product) => {
      const newName = `${product.name} (Cópia)`;
      const baseSlug = slugify(newName);
      const uniqueSlug = await generateUniqueSlug(tenantId, baseSlug);

      const payload = {
        tenant_id: tenantId,
        name: newName,
        slug: uniqueSlug,
        sku: product.sku,
        description: product.description,
        price: product.price,
        min_quantity: product.min_quantity,
        category_id: product.category_id,
        active: true,
        image_url: product.image_url,
        images: product.images,
        video_url: product.video_url
      };

      try {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      } catch (err: any) {
        if (err.message && (err.message.includes("images") || err.message.includes("schema"))) {
          const { images, ...legacyPayload } = payload;
          const { error: retryError } = await supabase.from("products").insert(legacyPayload);
          if (retryError) throw retryError;
          toast.info("Copy: Modo compatibilidade");
        } else {
          throw err;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      toast.success("Produto duplicado!");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("products").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      toast.success("Status atualizado.");
    },
    onError: (err: any) => toast.error("Erro status"),
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
      price: product.price ? product.price.toString() : "",
      min_quantity: product.min_quantity.toString(),
      category_id: product.category_id || "",
      active: product.active,
      images: Array.isArray(product.images) ? product.images : (product.image_url ? [product.image_url] : []),
      video_url: product.video_url || "",
    });
    setEditingId(product.id);
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleImagesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remainingSlots = MAX_IMAGES - formData.images.length;
    const selected = files.slice(0, remainingSlots);
    const readers = selected.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then((dataUrls) => {
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...dataUrls].slice(0, MAX_IMAGES) }));
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (productToDelete) {
                  deleteMutation.mutate(productToDelete, {
                    onSuccess: () => setProductToDelete(null)
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground">
            Gerencie seu catálogo, estoque e preços.
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="gap-2 shadow-lg hover:shadow-primary/25 transition-all">
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">{editingId ? "Editar Produto" : "Novo Produto"}</CardTitle>
                <CardDescription>Preencha os detalhes do produto para exibi-lo na vitrine.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => resetForm()}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Produto *</Label>
                    <Input placeholder="Ex: Camiseta Básica" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="text-lg font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Preço (R$)</Label>
                      <Input placeholder="0,00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                    </div>
                    <div>
                      <Label>Qtd Mínima</Label>
                      <Input type="number" min="1" value={formData.min_quantity} onChange={e => setFormData({ ...formData, min_quantity: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={formData.category_id} onValueChange={v => setFormData({ ...formData, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea className="min-h-[120px]" placeholder="Detalhes do produto..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Imagens ({formData.images.length}/{MAX_IMAGES})</Label>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {formData.images.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-md overflow-hidden border group">
                          <img src={src} className="w-full h-full object-cover" alt="" />
                          <button type="button" onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {formData.images.length < MAX_IMAGES && (
                        <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer bg-muted/10 transition-colors">
                          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground">Upload</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagesFileChange} />
                        </label>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="URL da imagem (http://...)" value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} className="text-sm h-9" />
                      <Button type="button" size="sm" variant="outline" onClick={() => {
                        if (imageUrlInput && formData.images.length < MAX_IMAGES) {
                          setFormData(p => ({ ...p, images: [...p.images, imageUrlInput] }));
                          setImageUrlInput("");
                        }
                      }}>Add</Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                    <span className="text-sm font-medium">Produto Ativo?</span>
                    <Switch checked={formData.active} onCheckedChange={c => setFormData({ ...formData, active: c })} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Produto
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm bg-transparent">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-card p-4 rounded-xl border shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto ou SKU..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[80px]">Imagem</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Nenhum produto encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id} className="group">
                        <TableCell>
                          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted border">
                            <img
                              src={(Array.isArray(product.images) && product.images[0]) || product.image_url || DEFAULT_PRODUCT_IMAGE}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE; }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-base">{product.name}</div>
                          {product.sku && <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>}
                        </TableCell>
                        <TableCell>
                          {(product as any).categories?.name ? (
                            <Badge variant="outline" className="font-normal">{(product as any).categories.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {product.price ? `R$ ${product.price.toFixed(2)}` : "R$ 0,00"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.active}
                              onCheckedChange={(c) => toggleActiveMutation.mutate({ id: product.id, active: c })}
                              className="scale-75 data-[state=checked]:bg-green-500"
                            />
                            <span className={`text-xs font-medium ${product.active ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {product.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateMutation.mutate(product)}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setProductToDelete(product.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="text-xs text-muted-foreground mt-4 text-center">
              Mostrando {filteredProducts.length} de {products.length} produtos
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductsManager;