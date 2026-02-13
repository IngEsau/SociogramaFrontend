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
  codigo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  grupos_count?: number;
  alumnos_count?: number;
}

// Tipos para importación Excel (flujo analizar + ejecutar)

export interface ExcelAnalysisResponse {
  archivo_id: string;
  nombre_archivo: string;
  resumen: {
    total_alumnos: number;
    total_grupos: number;
    total_tutores: number;
  };
  warnings: string[];
  periodos_disponibles: Period[];
}

export interface ExcelExecuteRequest {
  archivo_id: string;
  periodo_id?: number;
  crear_periodo: boolean;
  nuevo_periodo_anio?: number;
  nuevo_periodo_numero?: number;
  desactivar_anteriores: boolean;
}

export interface ExcelExecuteResponse {
  success: boolean;
  message: string;
  detalle: {
    tutores_nuevos: number;
    grupos_creados: number;
    alumnos_nuevos: number;
    inscripciones_creadas: number;
    bajas: number;
  };
  periodo_desactivado?: boolean;
  periodo_usado: {
    id: number;
    codigo: string;
    nombre: string;
  };
  log_completo?: string[];
}

export interface CsvImportResponse {
  success: boolean;
  message: string;
  registros_procesados?: number;
  errores?: string[];
}

// Tipo de importación disponible
export type ImportType = 'excel' | 'csv' | 'docentes' | 'alumnos';
