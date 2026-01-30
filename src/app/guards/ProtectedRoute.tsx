/**
 * Guard para rutas protegidas
 * Verifica que el usuario esté autenticado antes de permitir el acceso
 */

import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user, fetchProfile } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Si ya tenemos usuario en el estado (persistido), no necesitamos verificar
      if (isAuthenticated && user) {
        setIsChecking(false);
        return;
      }

      // Si hay token en localStorage pero no hay usuario en el estado,
      // intentar recuperar el perfil
      if (localStorage.getItem('access_token') && !user) {
        try {
          await fetchProfile();
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
        }
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [user, fetchProfile, isAuthenticated]);

  // Mientras verifica, mostrar pantalla de carga minimalista (sin texto)
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEFEFF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0F7E3C]"></div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si tiene children, mostrarlos; sino usar Outlet para rutas anidadas
  return children ? <>{children}</> : <Outlet />;
};
