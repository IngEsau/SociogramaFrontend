import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store";

export const RootRedirect = () => {
  const bypass = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";
  if (bypass) return <Navigate to="/dashboard" replace />;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};
