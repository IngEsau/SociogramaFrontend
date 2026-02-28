/**
 * Tipos del módulo Tutor
 */

export interface TutorGroup {
  id: number;
  nombre: string;
  clave?: string;
  periodo: string;
  division?: string;
  alumnos_count: number;
  sociogramas_count: number;
  sociograma_activo?: boolean;
}

export interface Sociogram {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_creacion: string;
  fecha_limite?: string;
  estado: 'borrador' | 'activo' | 'pausado' | 'finalizado';
  grupo_id: number;
  grupo_nombre?: string;
  respuestas_count: number;
  total_alumnos: number;
  porcentaje_respuestas: number;
}

export interface SociogramQuestion {
  id: number;
  texto: string;
  tipo: 'eleccion' | 'rechazo';
  categoria?: string;
  orden: number;
  max_selecciones?: number;
}

export interface AssignSociogramData {
  titulo: string;
  descripcion?: string;
  grupo_id: number;
  fecha_limite?: string;
  preguntas_ids: number[];
}

export interface StudentProgress {
  alumno_id: number;
  nombre_completo: string;
  matricula: string;
  estado: 'pendiente' | 'en_progreso' | 'completado';
  fecha_inicio?: string;
  fecha_completado?: string;
}

export interface SociogramResult {
  sociogram_id: number;
  titulo: string;
  fecha_finalizacion: string;
  total_respuestas: number;
  nodes: SociogramNode[];
  edges: SociogramEdge[];
  metrics: SociogramMetrics;
}

export interface SociogramNode {
  id: number;
  label: string;
  matricula: string;
  genero: string;
  metrics: {
    elecciones_recibidas: number;
    rechazos_recibidos: number;
    indice_popularidad: number;
  };
}

export interface SociogramEdge {
  source: number;
  target: number;
  type: 'eleccion' | 'rechazo';
  pregunta_id: number;
  weight?: number;
}

export interface SociogramMetrics {
  indice_cohesion: number;
  densidad: number;
  reciprocidad: number;
  lideres: number[];
  aislados: number[];
  rechazados: number[];
}

// --- Registro de actividades por cuestionario ---

export interface RegistroAlumno {
  numero_lista: number;
  alumno_id: number;
  matricula: string;
  nombre: string;
  estado: 'COMPLETADO' | 'EN_PROGRESO' | 'PENDIENTE';
  fecha_inicio: string | null;
  fecha_completado: string | null;
  tiempo_transcurrido: string | null;
}

export interface RegistroResumen {
  total: number;
  completados: number;
  en_progreso: number;
  pendientes: number;
  porcentaje_completado: number;
}

export interface RegistroResponse {
  cuestionario_id: number;
  cuestionario_titulo: string;
  grupo_id: number;
  grupo_clave: string;
  resumen: RegistroResumen;
  alumnos: RegistroAlumno[];
}

// --- Clasificacion por pregunta ---

export interface ClasificacionAlumno {
  rank: number;
  numero_lista: number;
  alumno_id: number;
  matricula: string;
  nombre: string;
  puntaje_recibido: number;
}

export interface ClasificacionPreguntaResponse {
  cuestionario_id: number;
  cuestionario_titulo: string;
  grupo_id: number;
  grupo_clave: string;
  pregunta_id: number;
  pregunta_texto: string;
  pregunta_polaridad: 'POSITIVA' | 'NEGATIVA';
  ranking: ClasificacionAlumno[];
}
