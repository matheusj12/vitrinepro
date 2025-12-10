import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";

export const useSuperAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: tenantData, isLoading: tenantLoading } = useTenant(user?.id);

  useEffect(() => {
    if (!authLoading && !tenantLoading) {
      if (!user) {
        console.log("No user, redirecting to auth");
        navigate("/auth");
        return;
      }

      if (!tenantData || tenantData.role !== 3) {
        console.log("Not super admin, redirecting to dashboard. Role:", tenantData?.role);
        navigate("/dashboard");
      }
    }
  }, [user, tenantData, authLoading, tenantLoading, navigate]);

  return {
    isSuperAdmin: tenantData?.role === 3,
    loading: authLoading || tenantLoading,
  };
};
