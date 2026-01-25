/**
 * Servicio de Administración
 * Endpoints: /api/admin/
 */

import { api } from '../core/api/axios';

export interface ImportCSVResponse {
  message: string;
  created: number;
  errors?: string[];
}

export const adminService = {
  /**
   * Importar datos desde archivo CSV
   * POST /admin/import-csv/
   */
  async importCSV(file: File): Promise<ImportCSVResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<ImportCSVResponse>(
      '/admin/import-csv/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return data;
  },
};
