import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, MessageCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

interface QuotesManagerProps {
  tenantId: string;
}

const PAGE_SIZE = 10;

type StatusFilter = "all" | "pending" | "responded" | "archived";

const QuotesManager = ({ tenantId }: QuotesManagerProps) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, quote_items(*)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("quotes")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", tenantId] });
      toast.success("Status do orçamento atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  // Stats
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter((q) => q.status === "pending" || !q.status).length;
  const respondedQuotes = quotes.filter((q) => q.status === "responded").length;

  // Filter
  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      !searchQuery ||
      quote.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (quote.status === "pending" || !quote.status)) ||
      quote.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE));
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "responded":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Respondido</Badge>;
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Arquivado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
    }
  };

  const calcTotal = (items: any[]) =>
    (items || []).reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Orçamentos Recebidos</h2>
        <p className="text-muted-foreground">
          Gerencie os pedidos de orçamento dos seus clientes
        </p>
      </div>

      {/* Mini-stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalQuotes}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{pendingQuotes}</div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{respondedQuotes}</div>
            <div className="text-sm text-muted-foreground">Respondidos</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => handleStatusFilterChange(v as StatusFilter)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="responded">Respondido</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {quotes.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum orçamento ainda</h3>
            <p className="text-muted-foreground max-w-sm">
              Quando clientes solicitarem orçamentos pela sua vitrine, eles aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum orçamento encontrado para esta busca.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* List */}
          <div className="grid gap-4">
            {paginatedQuotes.map((quote) => {
              const items: any[] = quote.quote_items || [];
              const total = calcTotal(items);
              const isPending = quote.status === "pending" || !quote.status;
              const phone = (quote.customer_whatsapp || "").replace(/\D/g, "");
              const waText = encodeURIComponent(
                `Olá ${quote.customer_name}, sobre seu orçamento solicitado em nossa loja...`
              );

              return (
                <Card key={quote.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{quote.customer_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(quote.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {getStatusBadge(quote.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {quote.customer_email && (
                        <div>
                          <span className="font-medium">Email: </span>
                          {quote.customer_email}
                        </div>
                      )}
                      {quote.customer_whatsapp && (
                        <div>
                          <span className="font-medium">WhatsApp: </span>
                          {quote.customer_whatsapp}
                        </div>
                      )}
                    </div>

                    {quote.observations && (
                      <div className="text-sm">
                        <span className="font-medium">Observações: </span>
                        {quote.observations}
                      </div>
                    )}

                    {items.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Produtos:</p>
                        <ul className="list-disc list-inside text-sm space-y-0.5">
                          {items.map((item: any) => (
                            <li key={item.id}>
                              {item.product_name} — Qtd: {item.quantity || 1}
                              {item.price
                                ? ` — R$ ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`
                                : ""}
                            </li>
                          ))}
                        </ul>
                        {total > 0 && (
                          <p className="text-sm font-semibold mt-2">
                            Total estimado: R$ {total.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1 flex-wrap">
                      {phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-green-700 border-green-300 hover:bg-green-50"
                          asChild
                        >
                          <a
                            href={`https://wa.me/55${phone}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </a>
                        </Button>
                      )}
                      {isPending && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: quote.id, status: "responded" })
                          }
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Marcar como respondido
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-9"
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuotesManager;
