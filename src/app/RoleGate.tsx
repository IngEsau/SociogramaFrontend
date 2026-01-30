import { Navigate, Outlet } from 'react-router-dom';
import type { AppRole } from '../core/routing/roleRouting';
import { getHomePath, normalizeRole } from '../core/routing/roleRouting';
import { useAuthStore } from '../store';

export function RoleGate({ allow }: { allow: AppRole[] }) {
  const me = useAuthStore((s) => s.me);
  const role = normalizeRole(me?.user?.rol);

  if (!me) return null;
  if (!role) return <Navigate to="/login" replace />;

  if (!allow.includes(role)) {
    return <Navigate to={getHomePath(me)} replace />;
  }

  return <Outlet />;
}
