import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type { LoginCredentials, MeResponse } from '../../../core/types/api.types';
import { normalizeRole } from '../../../core/routing/roleRouting';

interface AuthState {
  me: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  me: authService.getStoredMe(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  async login(credentials) {
    set({ isLoading: true, error: null });

    try {
      await authService.login(credentials);
      const me = await authService.getMe();

      set({
        me,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Error al iniciar sesión';
      set({ error: msg, isLoading: false, isAuthenticated: false, me: null });
      throw err;
    }
  },

  async logout() {
    set({ isLoading: true, error: null });
    try {
      await authService.logout();
    } finally {
      set({ me: null, isAuthenticated: false, isLoading: false });
    }
  },

  async fetchMe() {    
    if (!authService.isAuthenticated()) {
      set({ me: null, isAuthenticated: false });
      return;
    }

    if (get().me) return;

    set({ isLoading: true, error: null });
    try {
      const me = await authService.getMe();
      set({ me, isAuthenticated: true, isLoading: false });
    } catch (err: any) {

      await authService.logout();
      set({ me: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError() {
    set({ error: null });
  },
}));


export const selectMe = (s: AuthState) => s.me;
export const selectUser = (s: AuthState) => s.me?.user ?? null;
export const selectIsAuthenticated = (s: AuthState) => s.isAuthenticated;
export const selectIsLoading = (s: AuthState) => s.isLoading;
export const selectError = (s: AuthState) => s.error;
export const selectUserRole = (s: AuthState) => normalizeRole(s.me?.user?.rol) ?? null;
