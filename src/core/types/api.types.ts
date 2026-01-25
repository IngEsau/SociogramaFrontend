/**
 * Tipos relacionados con respuestas de la API
 */

// Respuesta de Login
export interface LoginResponse {
  access: string;
  refresh: string;
  user?: UserResponse;
}

// Respuesta de usuario (GET /auth/me/)
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: 'ALUMNO' | 'ACADEMICO' | 'ADMIN';
  genero: 'Masculino' | 'Femenino' | 'Otro';
}

// Credenciales de login
export interface LoginCredentials {
  username: string;
  password: string;
  recaptcha_token?: string;
}

// Datos de registro
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  rol: 'ALUMNO' | 'ACADEMICO' | 'ADMIN';
  genero: 'Masculino' | 'Femenino' | 'Otro';
}

// Cambio de contraseña
export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password2: string;
}

// Verificar token
export interface VerifyTokenData {
  token: string;
}

// Refresh token
export interface RefreshTokenData {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

// Logout
export interface LogoutData {
  refresh: string;
}

// Error de API
export interface ApiError {
  detail?: string;
  message?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
}

// Grupo académico
export interface Group {
  id: number;
  nombre: string;
  codigo: string;
  periodo: string;
  // Agregar más campos según respuesta real
}
