import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { getHomePath } from '../core/routing/roleRouting';

export default function RootRedirect() {
  const { isAuthenticated, me, fetchMe } = useAuthStore();

  useEffect(() => {    
    if (isAuthenticated && !me) fetchMe();
  }, [isAuthenticated, me, fetchMe]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!me) return null;

  return <Navigate to={getHomePath(me)} replace />;
}