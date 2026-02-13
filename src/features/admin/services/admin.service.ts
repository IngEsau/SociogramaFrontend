/**
 * Servicio de Admin
 * 
 * Maneja todas las operaciones administrativas del sistema
 */

import { api } from '../../../core/api/axios';
import type {
  ExcelAnalysisResponse,
  ExcelExecuteRequest,
  ExcelExecuteResponse,
  CsvImportResponse,
  Period,
  SystemLog,
} from '../types';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  rol: string;
  is_active: boolean;
}

export interface Group {
  id: number;
  nombre: string;
  periodo: string;
  tutor?: {
    id: number;
    nombre: string;
  };
  alumnos_count: number;
}

export const adminService = {
  // ==========================================
  // Usuarios
  // ==========================================

  async getUsers(): Promise<User[]> {
    const response = await api.get('/admin/users/');
    return response.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await api.get(`/admin/users/${id}/`);
    return response.data;
  },

  async createUser(data: Partial<User>): Promise<User> {
    const response = await api.post('/admin/users/', data);
    return response.data;
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await api.patch(`/admin/users/${id}/`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/admin/users/${id}/`);
  },

  // ==========================================
  // Grupos
  // ==========================================

  async getGroups(): Promise<Group[]> {
    const response = await api.get('/admin/groups/');
    return response.data;
  },

  // ==========================================
  // Periodos Académicos
  // ==========================================

  async getPeriodos(): Promise<Period[]> {
    const response = await api.get('/admin/periodos/');
    return response.data.periodos;
  },

  async getPeriodoActivo(): Promise<Period | null> {
    const response = await api.get('/periodos/activo/');
    return response.data.periodo ?? null;
  },

  // ==========================================
  // Importación Excel (flujo de 2 pasos)
  // ==========================================

  /**
   * Paso 1: Analizar archivo Excel
   * Sube el archivo y devuelve resumen + periodos disponibles
   */
  async analyzeExcel(file: File): Promise<ExcelAnalysisResponse> {
    const formData = new FormData();
    formData.append('archivo', file);
    const response = await api.post('/admin/importacion/analizar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Paso 2: Ejecutar importación con la configuración seleccionada
   */
  async executeExcelImport(data: ExcelExecuteRequest): Promise<ExcelExecuteResponse> {
    const response = await api.post('/admin/importacion/ejecutar/', data);
    return response.data;
  },

  // ==========================================
  // Importación CSV (endpoints individuales)
  // ==========================================

  /**
   * Importar CSV general
   */
  async importCsv(file: File): Promise<CsvImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/import-csv/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Importar docentes desde CSV
   */
  async importDocentes(file: File): Promise<CsvImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/import-docentes/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Importar alumnos desde CSV
   */
  async importAlumnos(file: File): Promise<CsvImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/import-alumnos/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ==========================================
  // Logs
  // ==========================================

  async getSystemLogs(): Promise<SystemLog[]> {
    const response = await api.get('/admin/logs/');
    return response.data;
  },
};
