/**
 * Guard para rutas protegidas por rol
 * Verifica que el usuario esté autenticado Y tenga uno de los roles permitidos
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { getHomePath, normalizeRole, type AppRole } from '../../core/routing';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
}

export const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const { isAuthenticated, user, fetchProfile } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Si no hay usuario pero hay token en localStorage, intentar obtener el perfil
      if (!user && localStorage.getItem('access_token')) {
        try {
          await fetchProfile();
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
        }
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [user, fetchProfile]);

  // Mientras verifica, mostrar pantalla de carga
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEFEFF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0F7E3C] mx-auto mb-4"></div>
          <p className="text-[#313131] font-['Roboto']">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Normalizar el rol del usuario
  const normalizedRole = normalizeRole(user.rol);

  // Verificar si el usuario tiene uno de los roles permitidos
  const hasPermission = normalizedRole && allowedRoles.includes(normalizedRole);

  // Si no tiene el rol adecuado, redirigir a su home
  if (!hasPermission) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  // Si está autenticado y tiene el rol correcto, mostrar el contenido
  return <>{children}</>;
};
