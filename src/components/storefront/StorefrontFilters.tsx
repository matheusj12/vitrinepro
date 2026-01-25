import React, { useState } from "react";
import { Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from "lucide-react";
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

  const defaultSortValue = "recent";
  const safeSortOption = sortOption && sortOption !== "" ? sortOption : defaultSortValue;

  const SearchInput = () => (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Buscar produtos..."
        className="pl-9 bg-secondary/30 border-transparent focus:bg-background transition-colors h-11 rounded-xl"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );

  const CategoryFilters = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <SlidersHorizontal className="h-3 w-3" />
        Filtrar
      </h3>

      <div className="space-y-1">
        <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary/40 cursor-pointer transition-colors group">
          <Checkbox
            id="all-categories-modal"
            checked={selectedCategoryIds.length === 0}
            onCheckedChange={(checked) => handleCategoryChange("all", checked as boolean)}
            disabled={!!debouncedSearchQuery}
            className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-muted-foreground/30"
          />
          <Label
            htmlFor="all-categories-modal"
            className={`text-sm font-medium cursor-pointer group-hover:text-primary transition-colors ${selectedCategoryIds.length === 0 ? 'text-primary' : 'text-zinc-600'}`}
          >
            Todas as Categorias
          </Label>
        </label>

        {categories.map((category) => (
          <label key={category.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary/40 cursor-pointer transition-colors group">
            <Checkbox
              id={`category-modal-${category.id}`}
              checked={selectedCategoryIds.includes(category.id)}
              onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
              disabled={!!debouncedSearchQuery}
              className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-muted-foreground/30"
            />
            <Label
              htmlFor={`category-modal-${category.id}`}
              className={`text-sm font-medium cursor-pointer group-hover:text-primary transition-colors ${selectedCategoryIds.includes(category.id) ? 'text-primary' : 'text-zinc-600'}`}
            >
              {category.name}
            </Label>
          </label>
        ))}
      </div>
    </div>
  );

  const SortFilters = () => (
    <div className="space-y-3 mt-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <ArrowUpDown className="h-3 w-3" />
        Ordenar
      </h3>
      <Select value={safeSortOption} onValueChange={setSortOption}>
        <SelectTrigger className="w-full h-11 rounded-xl bg-background border-input/60">
          <SelectValue placeholder="Selecione a ordenação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Mais Recentes</SelectItem>
          <SelectItem value="price_asc">Preço: Menor para Maior</SelectItem>
          <SelectItem value="price_desc">Preço: Maior para Menor</SelectItem>
          <SelectItem value="best_sellers">Mais Vendidos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      {/* Sidebar de Filtros (Desktop) */}
      <aside className="hidden md:block w-64 space-y-6 sticky top-24 h-fit pr-4">
        <SearchInput />
        <CategoryFilters />
        <SortFilters />
      </aside>

      {/* Barra de Filtros (Mobile) */}
      <div className="md:hidden sticky top-[65px] z-20 bg-background/95 backdrop-blur-sm pb-4 pt-2 mb-4 border-b">
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar..."
                className="pl-9 h-10 rounded-lg bg-secondary/50 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Drawer open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-lg bg-secondary/50 border-none">
                <Filter className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-4 overflow-y-auto max-h-[80vh]">
                <DrawerHeader className="px-0 pt-0">
                  <DrawerTitle>Filtros e Busca</DrawerTitle>
                </DrawerHeader>
                <div className="mt-4 space-y-6">
                  <CategoryFilters />
                  <SortFilters />
                </div>
                <DrawerFooter className="px-0">
                  <DrawerClose asChild>
                    <Button className="w-full h-12 rounded-xl text-base">Ver Resultados</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </>
  );
};