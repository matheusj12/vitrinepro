
import { useRef } from "react";
import { Category } from "@/types/database";
import { cn } from "@/lib/utils";

interface StorefrontCategoryScrollProps {
    categories: Category[];
    selectedCategoryIds: string[];
    onSelectCategory: (id: string) => void;
}

export const StorefrontCategoryScroll = ({
    categories,
    selectedCategoryIds,
    onSelectCategory,
}: StorefrontCategoryScrollProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!categories || categories.length === 0) return null;

    return (
        <div className="w-full overflow-hidden py-6 bg-background/50 backdrop-blur-sm sticky top-[60px] z-30 border-b border-border/40 mb-6">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-bold text-lg tracking-tight">Categorias</h3>
                    <span className="text-xs text-muted-foreground">Deslize para ver mais &rarr;</span>
                </div>

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x"
                    style={{ scrollBehavior: "smooth" }}
                >
                    <button
                        onClick={() => onSelectCategory("all")}
                        className="group flex flex-col items-center gap-2 min-w-[72px] snap-start"
                    >
                        <div className={cn(
                            "w-[70px] h-[70px] rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                            selectedCategoryIds.length === 0
                                ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/10 scale-105 shadow-primary/25"
                                : "border-border bg-card hover:border-primary/50 text-muted-foreground"
                        )}>
                            <span className="text-sm font-bold">Tudo</span>
                        </div>
                        <span className={cn(
                            "text-xs font-medium text-center truncate w-full transition-colors",
                            selectedCategoryIds.length === 0 ? "text-primary font-bold" : "text-muted-foreground"
                        )}>Todos</span>
                    </button>

                    {categories.map((category) => {
                        const isSelected = selectedCategoryIds.includes(category.id);
                        return (
                            <button
                                key={category.id}
                                onClick={() => onSelectCategory(category.id)}
                                className="group flex flex-col items-center gap-2 min-w-[72px] snap-start"
                            >
                                <div className={cn(
                                    "w-[70px] h-[70px] rounded-full overflow-hidden border-2 transition-all duration-300 relative shadow-sm",
                                    isSelected
                                        ? "border-primary ring-4 ring-primary/10 scale-105 shadow-primary/25"
                                        : "border-transparent bg-muted/50 hover:border-primary/50"
                                )}>
                                    <div className={cn(
                                        "absolute inset-0 flex items-center justify-center transition-colors",
                                        isSelected ? "bg-primary/5" : "bg-secondary/50"
                                    )}>
                                        <span className={cn(
                                            "text-xl font-bold uppercase",
                                            isSelected ? "text-primary" : "text-muted-foreground/40"
                                        )}>
                                            {category.name.substring(0, 1)}
                                        </span>
                                    </div>
                                </div>
                                <span className={cn(
                                    "text-xs font-medium text-center truncate w-full transition-colors max-w-[80px]",
                                    isSelected ? "text-primary font-bold" : "text-muted-foreground"
                                )}>
                                    {category.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
