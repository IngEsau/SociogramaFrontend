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
  MeResponse,
} from '../../../core/types/api.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login/', credentials);

    if (data.access) localStorage.setItem('access_token', data.access);
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);

    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      try {
        localStorage.removeItem('me');
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        await api.post('/auth/logout/', { refresh: refreshToken } as LogoutData);
      } catch {
        // ignore
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user'); // legacy
    localStorage.removeItem('me');
  },

  async register(userData: RegisterData): Promise<UserResponse> {
    const { data } = await api.post<UserResponse>('/auth/register/', userData);
    return data;
  },

  async getMe(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>('/auth/me/');

    if (!data || typeof data !== 'object') {
      localStorage.removeItem('me');
      throw new Error('GET /auth/me/ devolvió una respuesta vacía o inválida');
    }

    const serialized = JSON.stringify(data);
    if (!serialized) {
      localStorage.removeItem('me');
      throw new Error('No se pudo serializar /auth/me/');
    }

    localStorage.setItem('me', serialized);
    return data;
  },


  async verifyToken(token: string): Promise<boolean> {
    try {
      await api.post('/auth/verify-token/', { token } as VerifyTokenData);
      return true;
    } catch {
      return false;
    }
  },

  async refreshToken(refresh: string): Promise<RefreshTokenResponse> {
    const { data } = await api.post<RefreshTokenResponse>(
      '/auth/token/refresh/',
      { refresh } as RefreshTokenData
    );

    if (data.access) localStorage.setItem('access_token', data.access);
    return data;
  },

  async changePassword(passwordData: ChangePasswordData): Promise<void> {
    await api.post('/auth/change-password/', passwordData);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  getStoredMe(): MeResponse | null {
    const raw = localStorage.getItem('me');

    if (!raw || raw === 'undefined' || raw === 'null') return null;

    try {
      return JSON.parse(raw) as MeResponse;
    } catch {
      localStorage.removeItem('me');
      return null;
    }
  },

};