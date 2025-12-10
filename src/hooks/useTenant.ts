import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tenant, TenantMembership } from "@/types/database";

export const useTenant = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["tenant", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Buscar tenant pelo user_id ou membership
      const { data: membership, error: membershipError } = await supabase
        .from("tenant_memberships")
        .select("tenant_id, role")
        .eq("user_id", userId)
        .single();

      if (membershipError) {
        console.error("Error fetching membership:", membershipError);
        return null;
      }

      if (!membership) return null;

      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", membership.tenant_id)
        .single();

      if (error) {
        console.error("Error fetching tenant:", error);
        return null;
      }

      return { tenant: tenant as Tenant, role: membership.role };
    },
    enabled: !!userId,
  });
};

export const useTenantBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["tenant-by-slug", slug],
    queryFn: async () => {
      if (!slug) return null;

      // Normalizar slug: lowercase e trim
      const normalizedSlug = slug.toLowerCase().trim();

      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .ilike("slug", normalizedSlug)
        .eq("active", true)
        .single();

      if (error) {
        console.error("Error fetching tenant by slug:", error);
        return null;
      }

      return data as Tenant;
    },
    enabled: !!slug,
  });
};