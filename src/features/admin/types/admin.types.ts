/**
 * Tipos del módulo Admin
 */

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  nombre_completo?: string;
  rol: 'ADMIN' | 'DOCENTE' | 'ALUMNO' | 'ACADEMICO' | 'COMITE';
  genero: 'Masculino' | 'Femenino' | 'Otro';
  is_active: boolean;
  is_staff: boolean;
}

export interface Group {
  id: number;
  nombre: string;
  clave?: string;
  periodo: string;
  division?: string;
  tutor?: {
    id: number;
    nombre: string;
    email?: string;
  };
  alumnos_count: number;
  created_at?: string;
}

export interface SystemLog {
  id: number;
  action: string;
  user: string;
  user_id?: number;
  timestamp: string;
  ip_address?: string;
  details?: string;
  level: 'info' | 'warning' | 'error';
}

export interface ImportResult {
  success: boolean;
  message: string;
  records_imported?: number;
  errors?: string[];
}

export interface Period {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}
