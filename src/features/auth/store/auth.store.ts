/**
 * Store de Autenticación
 *
 * Maneja el estado global del usuario autenticado
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';
import type { UserResponse, LoginCredentials } from '../../../core/types/api.types';

interface AuthState {
  // Estado
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
  setUser: (user: UserResponse | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          // Llamar al servicio de login
          await authService.login(credentials);

          // Obtener perfil del usuario
          const user = await authService.getProfile();

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          const error = err as { response?: { data?: { detail?: string; non_field_errors?: string[] } } };

          let errorMessage = 'Error al iniciar sesión';

          if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response?.data?.non_field_errors) {
            errorMessage = error.response.data.non_field_errors[0];
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw new Error(errorMessage);
        }
      },

      // Logout
      logout: async () => {
        set({ isLoading: true });

        try {
          await authService.logout();
        } catch {
          // Ignorar errores de logout
          console.warn('Error durante logout');
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Obtener perfil
      fetchProfile: async () => {
        if (!authService.isAuthenticated()) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });

        try {
          const user = await authService.getProfile();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Token inválido o expirado
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Limpiar error
      clearError: () => set({ error: null }),

      // Establecer usuario manualmente (Tests o casos especiales)
      setUser: (user) => set({
        user,
        isAuthenticated: !!user
      }),
    }),
    {
      name: 'auth-storage', // Nombre en localStorage
      partialize: (state) => ({
        // Solo persistir estos campos
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectores útiles (Para evitar re-renders innecesarios)
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
export const selectUserRole = (state: AuthState) => state.user?.rol;
