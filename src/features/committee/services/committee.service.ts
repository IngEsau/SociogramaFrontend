/**
 * Servicio de Committee
 * 
 * Maneja las operaciones para el comité de supervisión
 */

import { api } from '../../../core/api/axios';

export interface GlobalStats {
  total_sociogramas: number;
  sociogramas_activos: number;
  sociogramas_finalizados: number;
  total_respuestas: number;
  tasa_respuesta: number;
}

export interface TutorOverview {
  id: number;
  nombre: string;
  grupos_count: number;
  sociogramas_activos: number;
  ultima_actividad?: string;
}

export interface GroupOverview {
  id: number;
  nombre: string;
  tutor: string;
  periodo: string;
  sociograma_estado?: string;
  respuestas_porcentaje: number;
}

export const committeeService = {
  /**
   * Obtener estadísticas globales
   */
  async getGlobalStats(): Promise<GlobalStats> {
    const response = await api.get('/committee/stats/');
    return response.data;
  },

  /**
   * Obtener vista general de tutores
   */
  async getTutorsOverview(): Promise<TutorOverview[]> {
    const response = await api.get('/committee/tutors/');
    return response.data;
  },

  /**
   * Obtener vista general de grupos
   */
  async getGroupsOverview(): Promise<GroupOverview[]> {
    const response = await api.get('/committee/groups/');
    return response.data;
  },

  /**
   * Obtener sociogramas por estado
   */
  async getSociogramsByStatus(status: 'activo' | 'finalizado' | 'pendiente'): Promise<unknown[]> {
    const response = await api.get(`/committee/sociograms/?status=${status}`);
    return response.data;
  },

  /**
   * Obtener detalle de sociograma para supervisión
   */
  async getSociogramDetail(id: number): Promise<unknown> {
    const response = await api.get(`/committee/sociograms/${id}/`);
    return response.data;
  },

  /**
   * Obtener reportes agregados
   */
  async getAggregatedReports(filters?: {
    periodo?: string;
    division?: string;
  }): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters?.periodo) params.append('periodo', filters.periodo);
    if (filters?.division) params.append('division', filters.division);
    
    const response = await api.get(`/committee/reports/?${params.toString()}`);
    return response.data;
  },
};

export default committeeService;
