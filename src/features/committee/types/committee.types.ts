/**
 * Tipos del módulo Committee
 */

export interface GlobalStats {
  total_sociogramas: number;
  sociogramas_activos: number;
  sociogramas_finalizados: number;
  sociogramas_pendientes: number;
  total_respuestas: number;
  total_alumnos: number;
  tasa_respuesta_global: number;
  total_tutores: number;
  total_grupos: number;
}

export interface TutorOverview {
  id: number;
  nombre: string;
  email: string;
  division?: string;
  grupos_count: number;
  sociogramas_activos: number;
  sociogramas_finalizados: number;
  ultima_actividad?: string;
  tasa_respuesta_promedio: number;
}

export interface GroupOverview {
  id: number;
  nombre: string;
  clave?: string;
  tutor_nombre: string;
  tutor_id: number;
  periodo: string;
  division?: string;
  alumnos_count: number;
  sociograma_estado?: 'sin_asignar' | 'activo' | 'finalizado';
  respuestas_porcentaje: number;
}

export interface SociogramOverview {
  id: number;
  titulo: string;
  grupo_nombre: string;
  tutor_nombre: string;
  fecha_creacion: string;
  fecha_finalizacion?: string;
  estado: 'borrador' | 'activo' | 'pausado' | 'finalizado';
  respuestas_count: number;
  total_alumnos: number;
  porcentaje: number;
}

export interface AggregatedReport {
  periodo: string;
  division?: string;
  total_grupos: number;
  total_sociogramas: number;
  tasa_respuesta_promedio: number;
  metricas_agregadas: {
    indice_cohesion_promedio: number;
    casos_aislamiento: number;
    casos_rechazo_alto: number;
  };
}

export interface SupervisionFilters {
  periodo?: string;
  division?: string;
  estado?: string;
  tutor_id?: number;
}
