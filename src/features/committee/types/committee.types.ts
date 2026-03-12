/**
 * Tipos del modulo Committee
 * Basados en endpoints reales de /api/comite/*
 */

import type { SociogramConexion, SociogramNodo } from '../../sociogram/types';

export interface CommitteeFilters {
  periodo_id?: number;
  cuestionario_id?: number;
  division_id?: number;
  tutor_id?: number;
  grupo_id?: number;
}

export interface DivisionOption {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

export interface DivisionesResponse {
  divisiones: DivisionOption[];
}

export interface TutorOption {
  id: number;
  username: string;
  nombre_completo: string;
  email: string;
  rol: string;
  is_active: boolean;
  is_staff: boolean;
}

export interface TutoresResponse {
  usuarios: TutorOption[];
  total: number;
}

export interface CommitteeQuestionnaireFilters {
  periodo_id?: number;
  todos?: boolean;
}

export interface CommitteeQuestionnaireGroupFilters {
  division_id?: number;
  programa_id?: number;
  grupo_id?: number;
}

export interface CommitteePeriodRef {
  id: number;
  codigo: string;
  nombre: string;
  activo?: boolean;
}

export interface CommitteeQuestionnaireRef {
  id: number;
  titulo: string;
  activo: boolean;
}

export interface CommitteeQuestionnaireListItem {
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

export interface CommitteeQuestionnairesResponse {
  periodo: CommitteePeriodRef | null;
  total: number;
  cuestionarios: CommitteeQuestionnaireListItem[];
}

export interface CommitteeQuestionItem {
  id: number;
  texto: string;
  tipo: 'SELECCION_ALUMNO' | 'OPCION' | 'TEXTO';
  polaridad: 'POSITIVA' | 'NEGATIVA';
  max_elecciones: number;
  descripcion: string | null;
  es_sociometrica: boolean;
}

export interface CommitteeQuestionRelationItem {
  id: number;
  orden: number;
  pregunta: CommitteeQuestionItem;
}

export interface CommitteeQuestionnaireDetail {
  id: number;
  titulo: string;
  descripcion: string | null;
  periodo: number;
  periodo_codigo: string;
  periodo_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  esta_activo: boolean;
  preguntas: CommitteeQuestionRelationItem[];
  total_preguntas: number;
  total_respuestas: number;
  total_grupos: number;
  creado_en: string;
}

export interface CommitteeQuestionnaireDetailResponse {
  cuestionario: CommitteeQuestionnaireDetail;
}

export interface CommitteeAlertByDivision {
  division_id: number | null;
  division: string;
  total_aislados: number;
}

export interface CommitteeAlertByGroup {
  grupo_id: number;
  grupo_clave: string;
  division: string;
  total_aislados: number;
}

export interface CommitteeAlertsPayload {
  total_global: number;
  por_division: CommitteeAlertByDivision[];
  por_grupo: CommitteeAlertByGroup[];
}

export interface CommitteeCentralityStudent {
  alumno_id: number;
  nombre: string;
  matricula: string;
  elecciones_positivas: number;
  grupo?: string;
}

export interface CommitteeCentralityByDivision {
  division_id: number | null;
  division: string;
  top: CommitteeCentralityStudent[];
}

export interface CommitteeCentralityByGroup {
  grupo_id: number;
  grupo_clave: string;
  top: CommitteeCentralityStudent[];
}

export interface CommitteeCentralityPayload {
  por_division: CommitteeCentralityByDivision[];
  por_grupo: CommitteeCentralityByGroup[];
}

export interface CommitteeOverviewResponse {
  cuestionario: CommitteeQuestionnaireRef;
  periodo: CommitteePeriodRef;
  filtros_aplicados: Record<string, string>;
  total_grupos: number;
  porcentaje_completado_global: number;
  alertas_aislados: CommitteeAlertsPayload;
  top_centralidad: CommitteeCentralityPayload;
}

export interface CommitteeOverviewProgressResponse {
  cuestionario: CommitteeQuestionnaireRef;
  periodo: CommitteePeriodRef;
  filtros_aplicados: Record<string, string>;
  total_grupos: number;
  total_alumnos: number;
  total_completados: number;
  porcentaje_completado_global: number;
}

export interface CommitteeOverviewAlertsResponse {
  cuestionario: CommitteeQuestionnaireRef;
  periodo: CommitteePeriodRef;
  filtros_aplicados: Record<string, string>;
  alertas_aislados: CommitteeAlertsPayload;
}

export interface CommitteeOverviewCentralityResponse {
  cuestionario: CommitteeQuestionnaireRef;
  periodo: CommitteePeriodRef;
  filtros_aplicados: Record<string, string>;
  top_centralidad: CommitteeCentralityPayload;
}

export interface CommitteeGraphDistributionItem {
  grupo_id: number;
  grupo_clave: string;
  division: string | null;
  programa: string | null;
  ACEPTADO: number;
  RECHAZADO: number;
  INVISIBLE: number;
  total: number;
}

export interface CommitteeGraphsResponse {
  cuestionario: CommitteeQuestionnaireRef;
  periodo: CommitteePeriodRef;
  filtros_aplicados: Record<string, string>;
  distribucion_por_grupo: CommitteeGraphDistributionItem[];
}

export interface CommitteeQuestionnaireProgressGroup {
  grupo_id: number;
  grupo_clave: string;
  division: string | null;
  programa: string | null;
  total_alumnos: number;
  completados: number;
  en_progreso: number;
  pendientes: number;
  porcentaje_completado: number;
}

export interface CommitteeQuestionnaireProgressResponse {
  cuestionario_id: number;
  cuestionario_titulo: string;
  periodo: string;
  filtros_aplicados: Record<string, string>;
  total_grupos: number;
  grupos: CommitteeQuestionnaireProgressGroup[];
}

export interface CommitteeQuestionnaireStatsGroup {
  grupo_id: number;
  grupo_clave: string;
  division: string | null;
  programa: string | null;
  total_alumnos: number;
  respuestas_completas: number;
  nodos: SociogramNodo[];
  conexiones: SociogramConexion[];
}

export interface CommitteeQuestionnaireStatsResponse {
  cuestionario_id: number;
  cuestionario_titulo: string;
  periodo: string;
  filtros_aplicados: Record<string, string>;
  total_grupos: number;
  grupos: CommitteeQuestionnaireStatsGroup[];
}
