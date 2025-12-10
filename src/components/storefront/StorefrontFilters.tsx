import React, { useState } from "react";
import { Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface StorefrontFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: React.Dispatch<React.SetStateAction<string[]>>;
  sortOption: string;
  setSortOption: (option: string) => void;
  categories: Category[];
  debouncedSearchQuery: string;
}

export const StorefrontFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategoryIds,
  setSelectedCategoryIds,
  sortOption,
  setSortOption,
  categories,
  debouncedSearchQuery,
}: StorefrontFiltersProps) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const handleCategoryChange = (categoryId: string, isChecked: boolean) => {
    if (categoryId === "all") {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds((prev: string[]) =>
        isChecked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
      );
    }
  };

  // Define um valor padrão seguro para a ordenação
  const defaultSortValue = "recent";
  const safeSortOption = sortOption && sortOption !== "" ? sortOption : defaultSortValue;

  const FilterContent = () => (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-bold mb-4">Busca</h3>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar produtos..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <h3 className="text-lg font-bold mb-4">Filtros</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="all-categories-modal"
            checked={selectedCategoryIds.length === 0}
            onCheckedChange={(checked) => handleCategoryChange("all", checked as boolean)}
            disabled={!!debouncedSearchQuery}
          />
          <Label htmlFor="all-categories-modal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Todas as Categorias
          </Label>
        </div>
        {categories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <Checkbox
              id={`category-modal-${category.id}`}
              checked={selectedCategoryIds.includes(category.id)}
              onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
              disabled={!!debouncedSearchQuery}
            />
            <Label htmlFor={`category-modal-${category.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {category.name}
            </Label>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-bold mb-4">Ordenar por</h3>
      <Select value={safeSortOption} onValueChange={setSortOption}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione a ordenação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Mais Recentes</SelectItem> {/* Valor alterado de "" para "recent" */}
          <SelectItem value="price_asc">Preço: Menor para Maior</SelectItem>
          <SelectItem value="price_desc">Preço: Maior para Menor</SelectItem>
          <SelectItem value="best_sellers">Mais Vendidos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      {/* Sidebar de Filtros (visível apenas em telas maiores) */}
      <aside className="p-4 border rounded-lg h-fit hidden md:block sticky top-20">
        {FilterContent()}
      </aside>

      {/* Botão Filtrar (visível apenas em telas pequenas) */}
      <div className="mb-4 md:hidden">
        <Drawer open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar Produtos
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filtrar Produtos</DrawerTitle>
            </DrawerHeader>
            {FilterContent()}
            <DrawerFooter>
              <DrawerClose asChild>
                <Button>Aplicar Filtros</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};