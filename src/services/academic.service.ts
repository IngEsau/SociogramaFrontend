/**
 * Servicio Académico
 * Endpoints: /api/academic/
 */

import { api } from '../core/api/axios';
import type { Group } from '../core/types/api.types';

export const academicService = {
  /**
   * Obtener grupos del usuario actual
   * GET /academic/my-groups/
   */
  async getMyGroups(): Promise<Group[]> {
    const { data } = await api.get<Group[]>('/academic/my-groups/');
    return data;
  },
};
