import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, selectIsAuthenticated } from '../store';
import { getHomePath } from '../core/routing/roleRouting';

export function PublicRoute() {
  const isAuth = useAuthStore(selectIsAuthenticated);
  const me = useAuthStore((s) => s.me);

  if (isAuth && me) return <Navigate to={getHomePath(me)} replace />;
  return <Outlet />;
}