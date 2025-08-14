import { useAuth } from "./useAuth";

export function useRoleFlags() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "";
  return {
    isAgent: role === "agent",
    isManager: role === "manager",
    isAdmin: role === "admin" || role === "super_admin" || role === "super admin",
  };
} 