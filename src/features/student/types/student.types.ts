/**
 * Tipos del módulo Student
 */

export interface AssignedSurvey {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_asignacion: string;
  fecha_limite?: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'vencido';
  grupo: {
    id: number;
    nombre: string;
  };
  preguntas_count: number;
  progreso?: number; // 0-100
}

export interface SurveyQuestion {
  id: number;
  texto: string;
  tipo: 'eleccion' | 'rechazo';
  categoria?: string;
  orden: number;
  max_selecciones: number;
  min_selecciones?: number;
}

export interface Classmate {
  id: number;
  nombre_completo: string;
  matricula: string;
  genero: 'Masculino' | 'Femenino' | 'Otro';
  foto_url?: string;
}

export interface SurveyResponse {
  pregunta_id: number;
  seleccionados: number[]; // IDs de compañeros seleccionados
}

export interface SurveyProgress {
  survey_id: number;
  respuestas: SurveyResponse[];
  ultima_actualizacion: string;
  completado: boolean;
}

export interface SurveySubmitResult {
  success: boolean;
  message: string;
  fecha_completado?: string;
}
