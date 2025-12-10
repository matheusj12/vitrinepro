import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Quote, QuoteItem } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuotesManagerProps {
  tenantId: string;
}

const QuotesManager = ({ tenantId }: QuotesManagerProps) => {
  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Quote[];
    },
  });

  const { data: quoteItems = {} } = useQuery({
    queryKey: ["quote-items", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_items")
        .select("*")
        .in("quote_id", quotes.map((q) => q.id));

      if (error) throw error;

      // Group items by quote_id
      const grouped: Record<string, QuoteItem[]> = {};
      (data as QuoteItem[]).forEach((item) => {
        if (!grouped[item.quote_id]) {
          grouped[item.quote_id] = [];
        }
        grouped[item.quote_id].push(item);
      });

      return grouped;
    },
    enabled: quotes.length > 0,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Orçamentos Recebidos ({quotes.length})</h2>

      <div className="grid gap-4">
        {quotes.map((quote) => (
          <Card key={quote.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {quote.customer_name} - {new Date(quote.created_at).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>WhatsApp:</strong> {quote.customer_whatsapp}
                </p>
                {quote.customer_email && (
                  <p>
                    <strong>Email:</strong> {quote.customer_email}
                  </p>
                )}
                {quote.observations && (
                  <p>
                    <strong>Observações:</strong> {quote.observations}
                  </p>
                )}
                
                <div className="mt-4">
                  <strong>Produtos:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {(quoteItems[quote.id] || []).map((item) => (
                      <li key={item.id}>
                        {item.product_name} - Qtd: {item.quantity}
                        {item.price && ` - R$ ${item.price.toFixed(2)}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuotesManager;
