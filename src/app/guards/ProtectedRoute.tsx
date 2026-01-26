/**
 * Guard para rutas protegidas
 * Verifica que el usuario esté autenticado antes de permitir el acceso
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
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
          <p className="text-[#313131] font-['Roboto']">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
};
