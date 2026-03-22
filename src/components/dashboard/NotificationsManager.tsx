import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Notification } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";

interface NotificationsManagerProps {
  tenantId: string;
}

const NOTIFICATION_CONFIG: Record<string, { label: string; color: string }> = {
  trial_expiring:    { label: "Trial expirando",       color: "bg-yellow-100 text-yellow-800" },
  store_suspended:   { label: "Loja suspensa",         color: "bg-red-100 text-red-800" },
  payment_confirmed: { label: "Pagamento confirmado",  color: "bg-green-100 text-green-800" },
  product_limit:     { label: "Limite de produtos",    color: "bg-orange-100 text-orange-800" },
  new_quote:         { label: "Novo orçamento",        color: "bg-blue-100 text-blue-800" },
  low_stock:         { label: "Estoque baixo",         color: "bg-yellow-100 text-yellow-800" },
  out_of_stock:      { label: "Sem estoque",           color: "bg-red-100 text-red-800" },
};

const getNotifConfig = (type: string) =>
  NOTIFICATION_CONFIG[type] || { label: type, color: "bg-gray-100 text-gray-800" };

const PAGE_SIZE = 20;

const NotificationsManager = ({ tenantId }: NotificationsManagerProps) => {
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", tenantId] });
      toast.success("Notificação marcada como lida");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("tenant_id", tenantId)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", tenantId] });
      toast.success("Todas as notificações marcadas como lidas");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = showUnreadOnly
    ? notifications.filter((n) => !n.read)
    : notifications;

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleShowUnreadToggle = (checked: boolean) => {
    setShowUnreadOnly(checked);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold">Notificações</h2>
          {unreadCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch
              id="unread-only"
              checked={showUnreadOnly}
              onCheckedChange={handleShowUnreadToggle}
            />
            <Label htmlFor="unread-only" className="text-sm cursor-pointer">
              Apenas não lidas
            </Label>
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tudo em dia!</h3>
            <p className="text-muted-foreground max-w-sm">
              Você receberá alertas sobre novos orçamentos, estoque baixo e eventos da sua conta.
            </p>
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma notificação não lida.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {paginatedNotifications.map((notification) => {
              const config = getNotifConfig(notification.type);
              return (
                <Card
                  key={notification.id}
                  className={notification.read ? "opacity-60" : ""}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <Badge className={`${config.color} hover:${config.color} font-medium`}>
                          {config.label}
                        </Badge>
                      </div>
                      {!notification.read && (
                        <span className="text-xs text-primary font-normal">Nova</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{notification.message}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString("pt-BR")}
                      </span>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          Marcar como lida
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

export default NotificationsManager;
