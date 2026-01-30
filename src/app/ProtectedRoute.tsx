import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, selectIsAuthenticated, selectIsLoading } from '../store';
//import { getHomePath } from '../core/routing/roleRouting';

export function ProtectedRoute() {
  const isAuth = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);
  const me = useAuthStore((s) => s.me);

  if (isLoading) return null;

  if (!isAuth) return <Navigate to="/login" replace />;

  // Si hay token pero aún no tenemos /me, dejamos que fetchMe lo resuelva (RootRedirect lo dispara)
  if (!me) return null;
  //if (!me) return getHomePath(me);
  

  return <Outlet />;
}
