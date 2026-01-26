/**
 * Servicio de Autenticación
 * Endpoints: /api/auth/
 *
 * Basado en la colección Postman del proyecto
 */

import { api } from '../../../core/api/axios';
import type {
  LoginCredentials,
  LoginResponse,
  RegisterData,
  UserResponse,
  ChangePasswordData,
  VerifyTokenData,
  RefreshTokenData,
  RefreshTokenResponse,
  LogoutData,
} from '../../../core/types/api.types';

export const authService = {
  /**
   * Iniciar sesión
   * POST /auth/login/
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login/', credentials);

    // Guardar tokens en localStorage
    if (data.access) {
      localStorage.setItem('access_token', data.access);
    }
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh);
    }
    // Guardar usuario si viene en la respuesta
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  /**
   * Cerrar sesión
   * POST /auth/logout/
   */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      try {
        await api.post('/auth/logout/', { refresh: refreshToken } as LogoutData);
      } catch (error) {
        // Ignorar error si el token ya expiró
        console.warn('Logout request failed:', error);
      }
    }

    // Limpiar localStorage siempre
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  /**
   * Registrar nuevo usuario
   * POST /auth/register/
   */
  async register(userData: RegisterData): Promise<UserResponse> {
    const { data } = await api.post<UserResponse>('/auth/register/', userData);
    return data;
  },

  /**
   * Obtener perfil del usuario actual
   * GET /auth/me/
   */
  async getProfile(): Promise<UserResponse> {
    const { data } = await api.get<UserResponse>('/auth/me/');

    // Guardar usuario en localStorage
    localStorage.setItem('user', JSON.stringify(data));

    return data;
  },

  /**
   * Verificar si un token es válido
   * POST /auth/verify-token/
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      await api.post('/auth/verify-token/', { token } as VerifyTokenData);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Refrescar access token
   * POST /auth/token/refresh/
   */
  async refreshToken(refresh: string): Promise<RefreshTokenResponse> {
    const { data } = await api.post<RefreshTokenResponse>(
      '/auth/token/refresh/',
      { refresh } as RefreshTokenData
    );

    // Actualizar access token en localStorage
    if (data.access) {
      localStorage.setItem('access_token', data.access);
    }

    return data;
  },

  /**
   * Cambiar contraseña
   * POST /auth/change-password/
   */
  async changePassword(passwordData: ChangePasswordData): Promise<void> {
    await api.post('/auth/change-password/', passwordData);
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Obtener el token de acceso actual
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  /**
   * Obtener el usuario guardado en localStorage
   */
  getStoredUser(): UserResponse | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};
