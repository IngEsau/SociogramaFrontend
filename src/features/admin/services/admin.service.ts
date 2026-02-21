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
  Cuestionario,
  CrearCuestionarioRequest,
  CrearCuestionarioResponse,
  ListarCuestionariosResponse,
  ActivarCuestionarioResponse,
  AgregarPreguntaResponse,
  CuestionarioActionResponse,
  PreguntaInput,
  PreguntaBanco,
  ListarBancoResponse,
  CrearPreguntaBancoRequest,
  CrearPreguntaBancoResponse,
  CrearPreguntasBulkResponse,
  ActualizarPreguntaBancoRequest,
  ActualizarPreguntaBancoResponse,
  EditarCopiaPreguntaRequest,
  BancoActionResponse,
  AsociarPreguntaRequest,
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
  clave?: string;
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
  // Importación Excel
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

  // ==========================================
  // Cuestionarios
  // ==========================================

  /** Listar todos los cuestionarios, opcionalmente filtrar por periodo */
  async getCuestionarios(periodoId?: number): Promise<ListarCuestionariosResponse> {
    const params = periodoId ? { periodo: periodoId } : {};
    const response = await api.get<ListarCuestionariosResponse>('/admin/cuestionarios/', { params });
    return response.data;
  },

  /** Obtener detalle de un cuestionario con sus preguntas */
  async getCuestionario(id: number): Promise<Cuestionario> {
    const response = await api.get<{ cuestionario: Cuestionario }>(`/admin/cuestionarios/${id}/`);
    return response.data.cuestionario;
  },

  /** Crear cuestionario con preguntas inline */
  async crearCuestionario(data: CrearCuestionarioRequest): Promise<CrearCuestionarioResponse> {
    const response = await api.post<CrearCuestionarioResponse>('/admin/cuestionarios/crear/', data);
    return response.data;
  },

  /** Actualizar titulo y/o fechas de un cuestionario */
  async actualizarCuestionario(id: number, data: { titulo?: string; fecha_inicio?: string; fecha_fin?: string }): Promise<CrearCuestionarioResponse> {
    const response = await api.put<CrearCuestionarioResponse>(`/admin/cuestionarios/${id}/actualizar/`, data);
    return response.data;
  },

  /** Activar cuestionario (crea estados para todos los grupos del periodo) */
  async activarCuestionario(id: number): Promise<ActivarCuestionarioResponse> {
    const response = await api.post<ActivarCuestionarioResponse>(`/admin/cuestionarios/${id}/activar/`);
    return response.data;
  },

  /** Desactivar cuestionario */
  async desactivarCuestionario(id: number): Promise<CrearCuestionarioResponse> {
    const response = await api.post<CrearCuestionarioResponse>(`/admin/cuestionarios/${id}/desactivar/`);
    return response.data;
  },

  /** Agregar una pregunta adicional a un cuestionario */
  async agregarPregunta(cuestionarioId: number, pregunta: PreguntaInput): Promise<AgregarPreguntaResponse> {
    const response = await api.post<AgregarPreguntaResponse>(
      `/admin/cuestionarios/${cuestionarioId}/agregar-pregunta/`,
      pregunta
    );
    return response.data;
  },

  /** Remover pregunta de un cuestionario */
  async removerPregunta(cuestionarioId: number, preguntaId: number): Promise<CuestionarioActionResponse> {
    const response = await api.delete<CuestionarioActionResponse>(
      `/admin/cuestionarios/${cuestionarioId}/remover-pregunta/${preguntaId}/`
    );
    return response.data;
  },

  /** Eliminar cuestionario completo */
  async eliminarCuestionario(id: number): Promise<CuestionarioActionResponse> {
    const response = await api.delete<CuestionarioActionResponse>(`/admin/cuestionarios/${id}/eliminar/`);
    return response.data;
  },

  /** Asociar pregunta existente del banco a un cuestionario (clona la pregunta) */
  async asociarPregunta(cuestionarioId: number, data: AsociarPreguntaRequest): Promise<AgregarPreguntaResponse> {
    const response = await api.post<AgregarPreguntaResponse>(
      `/admin/cuestionarios/${cuestionarioId}/asociar-pregunta/`,
      data
    );
    return response.data;
  },

  // ==========================================
  // Banco de Preguntas
  // ==========================================

  /** Listar todas las preguntas del banco, opcionalmente filtrar por polaridad o tipo */
  async getBancoPreguntas(filtros?: { polaridad?: 'POSITIVA' | 'NEGATIVA'; tipo?: string }): Promise<ListarBancoResponse> {
    const response = await api.get<ListarBancoResponse>('/admin/preguntas/', { params: filtros });
    return response.data;
  },

  /** Obtener detalle de una pregunta del banco */
  async getBancoPregunta(id: number): Promise<PreguntaBanco> {
    const response = await api.get<{ pregunta: PreguntaBanco }>(`/admin/preguntas/${id}/`);
    return response.data.pregunta;
  },

  /** Crear una pregunta en el banco */
  async crearBancoPregunta(data: CrearPreguntaBancoRequest): Promise<CrearPreguntaBancoResponse> {
    const response = await api.post<CrearPreguntaBancoResponse>('/admin/preguntas/crear/', data);
    return response.data;
  },

  /** Crear varias preguntas en el banco (bulk) */
  async crearBancoPreguntasBulk(data: CrearPreguntaBancoRequest[]): Promise<CrearPreguntasBulkResponse> {
    const response = await api.post<CrearPreguntasBulkResponse>('/admin/preguntas/crear/', data);
    return response.data;
  },

  /** Actualizar una pregunta del banco */
  async actualizarBancoPregunta(id: number, data: ActualizarPreguntaBancoRequest): Promise<ActualizarPreguntaBancoResponse> {
    const response = await api.put<ActualizarPreguntaBancoResponse>(`/admin/preguntas/${id}/actualizar/`, data);
    return response.data;
  },

  /** Editar una pregunta copia (clonada dentro de un cuestionario) */
  async editarCopiaPregunta(id: number, data: EditarCopiaPreguntaRequest): Promise<ActualizarPreguntaBancoResponse> {
    const response = await api.put<ActualizarPreguntaBancoResponse>(`/admin/preguntas/${id}/editar-copia/`, data);
    return response.data;
  },

  /** Eliminar una pregunta del banco */
  async eliminarBancoPregunta(id: number): Promise<BancoActionResponse> {
    const response = await api.delete<BancoActionResponse>(`/admin/preguntas/${id}/eliminar/`);
    return response.data;
  },
};
