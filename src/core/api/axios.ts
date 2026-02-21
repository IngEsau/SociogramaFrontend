/**
 * Configuración de Axios para peticiones HTTP
 *
 * Incluye manejo de refresh token con cola de peticiones pendientes
 * para evitar múltiples llamadas concurrentes al endpoint de refresh.
 */

import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';

// Instancia de Axios configurada
export const api = axios.create({
  baseURL: env.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Control de refresh token con cola ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Procesa la cola de peticiones pendientes después de un refresh.
 * Si el refresh fue exitoso, reintenta todas con el nuevo token.
 * Si falló, rechaza todas.
 */
function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

/**
 * Limpia toda la sesión del usuario y redirige al login.
 */
function clearSessionAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('first_login');
  // Limpiar el estado persistido de Zustand
  localStorage.removeItem('auth-storage');
  window.location.href = '/login';
}

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores 401 y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Solo manejar errores 401 que no sean del propio endpoint de refresh o login
    const isRefreshRequest = originalRequest.url?.includes('/auth/token/refresh/');
    const isLoginRequest = originalRequest.url?.includes('/auth/login/');

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isRefreshRequest ||
      isLoginRequest
    ) {
      return Promise.reject(error);
    }

    // Marcar como retry para evitar bucles
    originalRequest._retry = true;

    const refreshToken = localStorage.getItem('refresh_token');

    // Sin refresh token, no hay nada que intentar
    if (!refreshToken) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar esta petición
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest as AxiosRequestConfig);
      });
    }

    // Primera petición que detecta 401: iniciar el refresh
    isRefreshing = true;

    try {
      // Usar axios directo (no la instancia api) para evitar interceptores
      const response = await axios.post(
        `${env.API_URL}/auth/token/refresh/`,
        { refresh: refreshToken }
      );

      const { access } = response.data;
      localStorage.setItem('access_token', access);

      // Resolver todas las peticiones encoladas con el nuevo token
      processQueue(null, access);

      // Reintentar la petición original
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return api(originalRequest as AxiosRequestConfig);
    } catch (refreshError) {
      // El refresh token también expiró o es inválido
      processQueue(refreshError, null);
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);