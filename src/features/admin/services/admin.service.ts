/**
 * Servicio de Admin
 * 
 * Maneja todas las operaciones administrativas del sistema
 */

import { api } from '../../../core/api/axios';

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

export interface SystemLog {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

export const adminService = {
  /**
   * Obtener lista de usuarios
   */
  async getUsers(): Promise<User[]> {
    const response = await api.get('/admin/users/');
    return response.data;
  },

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: number): Promise<User> {
    const response = await api.get(`/admin/users/${id}/`);
    return response.data;
  },

  /**
   * Crear usuario
   */
  async createUser(data: Partial<User>): Promise<User> {
    const response = await api.post('/admin/users/', data);
    return response.data;
  },

  /**
   * Actualizar usuario
   */
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await api.patch(`/admin/users/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar usuario
   */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/admin/users/${id}/`);
  },

  /**
   * Obtener lista de grupos
   */
  async getGroups(): Promise<Group[]> {
    const response = await api.get('/admin/groups/');
    return response.data;
  },

  /**
   * Importar base de datos
   */
  async importDatabase(file: File): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/import/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Obtener logs del sistema
   */
  async getSystemLogs(): Promise<SystemLog[]> {
    const response = await api.get('/admin/logs/');
    return response.data;
  },
};

export default adminService;
