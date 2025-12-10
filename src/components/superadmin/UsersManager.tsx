import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { UserManageDialog } from "@/components/superadmin/UserManageDialog";

type TenantInfo = {
  id?: string;
  name?: string | null;
  slug?: string | null;
  role?: number;
};

type PlanInfo = {
  id?: string;
  name?: string | null;
  price?: number;
  max_products?: number;
};

type SuperAdminUser = {
  id: string;
  email: string | null;
  display_name?: string | null;
  status: string | null;
  trial_ends_at: string | null;
  plan?: PlanInfo | null;
  tenants: TenantInfo[];
};

const UsersManager = () => {
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<SuperAdminUser | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("superadmin-users", {
          method: "GET",
        });

        if (error) throw error;

        const ok = data?.success === true && Array.isArray(data?.data?.users);
        if (!ok) {
          throw new Error("Resposta inválida da API de usuários");
        }

        setUsers(data.data.users as SuperAdminUser[]);
      } catch {
        toast.error("Erro ao carregar usuários");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Administre todas as contas do sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8 gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Carregando...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / Email</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiração</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm">{user.display_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{user.email || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.tenants?.[0]?.name || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.plan?.name || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.status || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user.trial_ends_at ? user.trial_ends_at.slice(0, 10) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setOpenDialog(true);
                          }}
                        >
                          Gerenciar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <UserManageDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          user={selectedUser as any}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default UsersManager;