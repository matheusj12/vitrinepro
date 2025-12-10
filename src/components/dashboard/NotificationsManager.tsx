import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Notification } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NotificationsManagerProps {
  tenantId: string;
}

const NotificationsManager = ({ tenantId }: NotificationsManagerProps) => {
  const queryClient = useQueryClient();

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Notificações</h2>
        {unreadCount > 0 && (
          <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
            {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="grid gap-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">Nenhuma notificação</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className={notification.read ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="text-sm flex justify-between items-center">
                  <span>{notification.type}</span>
                  {!notification.read && <span className="text-xs text-primary">Nova</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{notification.message}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                    >
                      Marcar como lida
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsManager;
