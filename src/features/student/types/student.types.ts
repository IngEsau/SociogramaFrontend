/**
 * Tipos del módulo Student (alineados con /api/student/cuestionarios/*)
 */

export type CuestionarioEstado = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADO';

export interface StudentQuestionnaire {
  id: number;
  titulo: string;
  periodo: number;
  periodo_codigo: string;
  periodo_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  esta_activo: boolean;
  total_preguntas: number;
  total_respuestas: number;
  total_grupos: number;
  creado_en: string;
}

export interface StudentCurrentGroup {
  id: number;
  clave: string;
}

export interface StudentAvailableQuestionnairesResponse {
  cuestionarios: StudentQuestionnaire[];
  grupo_actual?: StudentCurrentGroup;
  message?: string;
}

export interface StudentQuestionnaireDetailResponse {
  cuestionario: StudentQuestionnaire & {
    descripcion?: string | null;
  };
}

export interface StudentQuestion {
  id: number;
  texto: string;
  tipo: 'SELECCION_ALUMNO' | 'OPCION' | 'TEXTO';
  max_elecciones: number;
  descripcion: string | null;
  orden: number;
  ya_respondida: boolean;
}

export interface StudentClassmate {
  id: number;
  matricula: string;
  nombre: string;
}

export interface StudentQuestionnaireQuestionsResponse {
  cuestionario_id: number;
  cuestionario_titulo: string;
  grupo_id: number;
  grupo_clave: string;
  preguntas: StudentQuestion[];
  companeros: StudentClassmate[];
}

export interface StudentSelectedAlumno {
  alumno_id: number;
  orden: number;
}

export interface StudentAnswerPayload {
  pregunta_id: number;
  seleccionados?: StudentSelectedAlumno[];
  opcion_id?: number | null;
  texto_respuesta?: string;
}

export interface StudentSubmitAnswersRequest {
  respuestas: StudentAnswerPayload[];
}

export interface StudentSubmitAnswersResponse {
  success: boolean;
  respuestas_guardadas?: number;
  progreso?: number;
  message?: string;
  error?: string;
  errores?: Array<{
    pregunta_id: number;
    error: string;
  }>;
}

export interface StudentQuestionnaireProgressResponse {
  cuestionario_id: number;
  cuestionario_titulo: string;
  grupo_id: number;
  grupo_clave: string;
  total_preguntas: number;
  preguntas_respondidas: number;
  progreso: number;
  estado: CuestionarioEstado;
  fecha_inicio: string | null;
  fecha_completado: string | null;
}

export interface StudentQuestionnaireWithProgress extends StudentQuestionnaire {
  estado: CuestionarioEstado;
  progreso: number;
  preguntas_respondidas: number;
  estado_fecha_inicio: string | null;
  fecha_completado: string | null;
}
