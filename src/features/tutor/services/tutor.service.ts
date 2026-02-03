/**
 * Servicio de Tutor
 * 
 * Maneja las operaciones para tutores/docentes
 */

import { api } from '../../../core/api/axios';

export interface Group {
  id: number;
  nombre: string;
  periodo: string;
  alumnos_count: number;
  sociogramas_count: number;
}

export interface Sociogram {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_creacion: string;
  fecha_limite?: string;
  estado: 'pendiente' | 'activo' | 'finalizado';
  grupo: number;
  respuestas_count: number;
  total_alumnos: number;
}

export interface AssignSociogramData {
  titulo: string;
  descripcion?: string;
  grupo_id: number;
  fecha_limite?: string;
  preguntas: number[];
}

export const tutorService = {
  /**
   * Obtener grupos asignados al tutor
   */
  async getMyGroups(): Promise<Group[]> {
    const response = await api.get('/academic/my-groups/');
    return response.data;
  },

  /**
   * Obtener detalle de un grupo
   */
  async getGroupById(id: number): Promise<Group> {
    const response = await api.get(`/academic/groups/${id}/`);
    return response.data;
  },

  /**
   * Obtener sociogramas del tutor
   */
  async getMySociograms(): Promise<Sociogram[]> {
    const response = await api.get('/sociograms/my-sociograms/');
    return response.data;
  },

  /**
   * Obtener detalle de un sociograma
   */
  async getSociogramById(id: number): Promise<Sociogram> {
    const response = await api.get(`/sociograms/${id}/`);
    return response.data;
  },

  /**
   * Asignar sociograma a un grupo
   */
  async assignSociogram(data: AssignSociogramData): Promise<Sociogram> {
    const response = await api.post('/sociograms/', data);
    return response.data;
  },

  /**
   * Finalizar sociograma
   */
  async finalizeSociogram(id: number): Promise<Sociogram> {
    const response = await api.post(`/sociograms/${id}/finalize/`);
    return response.data;
  },

  /**
   * Obtener resultados de un sociograma
   */
  async getSociogramResults(id: number): Promise<unknown> {
    const response = await api.get(`/sociograms/${id}/results/`);
    return response.data;
  },

  /**
   * Obtener alumnos de un grupo
   */
  async getGroupStudents(groupId: number): Promise<unknown[]> {
    const response = await api.get(`/academic/groups/${groupId}/students/`);
    return response.data;
  },
};

export default tutorService;
