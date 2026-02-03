/**
 * Tipos relacionados con respuestas de la API
 */

// Respuesta de Login
export interface LoginResponse {
  access: string;
  refresh: string;
  user?: UserResponse;
  first_login?: boolean;
}

// Información del alumno (si el usuario es alumno)
export interface AlumnoInfo {
  id: number;
  matricula: string;
  semestre_actual: number;
  promedio: number | null;
  estatus: string;
  programa: string;
}

// Información del docente (si el usuario es docente/tutor)
export interface DocenteInfo {
  id: number;
  profesor_id: string;
  es_tutor: boolean;
  division: string;
}

// Respuesta de usuario (GET /auth/me/ o login)
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  first_name: string;
  last_name: string;
  rol: 'ALUMNO' | 'DOCENTE' | 'ACADEMICO' | 'ADMIN';
  genero: 'Masculino' | 'Femenino' | 'Otro';
  is_staff: boolean;
  alumno?: AlumnoInfo;
  docente?: DocenteInfo;
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
  rol: 'ALUMNO' | 'DOCENTE' | 'ACADEMICO' | 'ADMIN';
  genero: 'Masculino' | 'Femenino' | 'Otro';
}

// Cambio de contraseña (usuario autenticado normal)
export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password2: string;
}

// Cambio de contraseña en primer login (sin old_password)
export interface FirstLoginChangePasswordData {
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
