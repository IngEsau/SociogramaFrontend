/**
 * Servicio de Committee
 *
 * Consume endpoints de solo lectura del backend:
 * /api/comite/*
 */

import { api } from '../../../core/api/axios';
import type {
  CommitteeFilters,
  CommitteeGraphsResponse,
  CommitteeOverviewAlertsResponse,
  CommitteeOverviewCentralityResponse,
  CommitteeOverviewProgressResponse,
  CommitteeOverviewResponse,
  CommitteeQuestionnaireDetailResponse,
  CommitteeQuestionnaireGroupFilters,
  CommitteeQuestionnaireProgressResponse,
  CommitteeQuestionnaireStatsResponse,
  CommitteeQuestionnaireFilters,
  CommitteeQuestionnairesResponse,
  DivisionesResponse,
  TutoresResponse,
} from '../types';

function cleanParams<T extends object>(params?: T): Record<string, unknown> | undefined {
  if (!params) return undefined;

  const cleaned = Object.entries(params as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    acc[key] = value;
    return acc;
  }, {});

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export const committeeService = {
  // ==========================================
  // COMITE - CUESTIONARIOS
  // ==========================================

  async getCuestionarios(
    params?: CommitteeQuestionnaireFilters
  ): Promise<CommitteeQuestionnairesResponse> {
    const response = await api.get<CommitteeQuestionnairesResponse>('/comite/cuestionarios/', {
      params: cleanParams(params),
    });
    return response.data;
  },

  async getCuestionarioDetalle(cuestionarioId: number): Promise<CommitteeQuestionnaireDetailResponse> {
    const response = await api.get<CommitteeQuestionnaireDetailResponse>(
      `/comite/cuestionarios/${cuestionarioId}/`
    );
    return response.data;
  },

  async getCuestionarioProgreso(
    cuestionarioId: number,
    params?: CommitteeQuestionnaireGroupFilters
  ): Promise<CommitteeQuestionnaireProgressResponse> {
    const response = await api.get<CommitteeQuestionnaireProgressResponse>(
      `/comite/cuestionarios/${cuestionarioId}/progreso/`,
      { params: cleanParams(params) }
    );
    return response.data;
  },

  async getCuestionarioEstadisticas(
    cuestionarioId: number,
    params?: CommitteeQuestionnaireGroupFilters
  ): Promise<CommitteeQuestionnaireStatsResponse> {
    const response = await api.get<CommitteeQuestionnaireStatsResponse>(
      `/comite/cuestionarios/${cuestionarioId}/estadisticas/`,
      { params: cleanParams(params) }
    );
    return response.data;
  },

  // ==========================================
  // COMITE - DASHBOARD GLOBAL
  // ==========================================

  async getOverview(params?: CommitteeFilters): Promise<CommitteeOverviewResponse> {
    const response = await api.get<CommitteeOverviewResponse>('/comite/overview/', {
      params: cleanParams(params),
    });
    return response.data;
  },

  async getOverviewProgreso(params?: CommitteeFilters): Promise<CommitteeOverviewProgressResponse> {
    const response = await api.get<CommitteeOverviewProgressResponse>('/comite/overview/progreso/', {
      params: cleanParams(params),
    });
    return response.data;
  },

  async getOverviewAlertas(params?: CommitteeFilters): Promise<CommitteeOverviewAlertsResponse> {
    const response = await api.get<CommitteeOverviewAlertsResponse>('/comite/overview/alertas/', {
      params: cleanParams(params),
    });
    return response.data;
  },

  async getOverviewCentralidad(params?: CommitteeFilters): Promise<CommitteeOverviewCentralityResponse> {
    const response = await api.get<CommitteeOverviewCentralityResponse>('/comite/overview/centralidad/', {
      params: cleanParams(params),
    });
    return response.data;
  },

  async getGraphs(params?: CommitteeFilters): Promise<CommitteeGraphsResponse> {
    const response = await api.get<CommitteeGraphsResponse>('/comite/graphs/', {
      params: cleanParams(params),
    });
    return response.data;
  },

  // ==========================================
  // CATALOGOS - DIVISIONES Y TUTORES
  // ==========================================

  async getDivisiones(): Promise<DivisionesResponse> {
    const response = await api.get<DivisionesResponse>('/admin/catalogos/divisiones/');
    return response.data;
  },

  async getTutores(): Promise<TutoresResponse> {
    const response = await api.get<TutoresResponse>('/admin/usuarios/', {
      params: { rol: 'DOCENTE', activo: 'true' },
    });
    return response.data;
  },
};

export default committeeService;
