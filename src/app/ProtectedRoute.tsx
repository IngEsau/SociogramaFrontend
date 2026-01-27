import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";

export const ProtectedRoute = () => {
  const bypass = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";
  if (bypass) return <Outlet />;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
};
