/**
 * Servicio de Tutor
 *
 * Maneja las operaciones para tutores/docentes.
 * Consume endpoints de /api/academic/ que requieren autenticacion de tutor.
 */

import { api } from '../../../core/api/axios';
import type { EstadisticasResponse } from '../../sociogram/types';
import type { Cuestionario } from '../../admin/types';
import type {
  RegistroResponse,
  ClasificacionPreguntaResponse,
  ArchivosListResponse,
  SociogramaDataResponse,
} from '../types';

export interface Group {
  id: number;
  nombre: string;
  periodo: string;
  alumnos_count: number;
  sociogramas_count: number;
}

/** Alumno asignado al tutor dentro de un grupo */
export interface TutorStudent {
  id: number;
  matricula: string;
  nombre_completo: string;
  email: string;
  grupo_id: number;
  grupo_clave: string;
}

export interface TutorGroupSummary {
  id: number;
  clave: string;
  grado?: string;
  grupo?: string;
  programa_codigo?: string;
  periodo_codigo?: string;
  periodo_nombre?: string;
  total_alumnos: number;
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
   * GET /academic/my-groups/
   */
  async getMyGroups(): Promise<Group[]> {
    const response = await api.get('/academic/my-groups/');
    return response.data;
  },

  /**
   * Obtener resumen de grupos asignados al tutor (para selectores)
   * GET /academic/my-groups/
   */
  async getMyGroupsSummary(): Promise<TutorGroupSummary[]> {
    const response = await api.get<{
      success: boolean;
      grupos: TutorGroupSummary[];
    }>('/academic/my-groups/');
    return response.data.grupos ?? [];
  },

  /**
   * Obtener detalle de un grupo
   * GET /academic/groups/:id/
   */
  async getGroupById(id: number): Promise<Group> {
    const response = await api.get(`/academic/groups/${id}/`);
    return response.data;
  },

  /**
   * Listar cuestionarios disponibles para el tutor
   * GET /academic/cuestionarios/
   */
  async getCuestionarios(): Promise<{ cuestionarios: Array<{ id: number; titulo: string; esta_activo: boolean }> }> {
    const response = await api.get('/academic/cuestionarios/');
    return response.data;
  },

  /**
   * Obtener el detalle de un cuestionario por ID, incluyendo sus preguntas.
   * Se usa para cargar las preguntas del selector de clasificacion independientemente
   * de si el cuestionario esta activo o ya venció.
   * GET /admin/cuestionarios/:id/
   */
  async getCuestionarioDetalle(cuestionarioId: number): Promise<Cuestionario | null> {
    const response = await api.get<{ cuestionario: Cuestionario }>(
      `/admin/cuestionarios/${cuestionarioId}/`
    );
    return response.data.cuestionario ?? null;
  },

  /**
   * Obtener estadisticas sociometricas de un cuestionario
   * GET /academic/cuestionarios/:id/estadisticas/
   */
  async getCuestionarioEstadisticas(cuestionarioId: number, grupoId?: number): Promise<EstadisticasResponse> {
    const params = grupoId ? { grupo_id: grupoId } : undefined;
    const response = await api.get<EstadisticasResponse>(
      `/academic/cuestionarios/${cuestionarioId}/estadisticas/`,
      { params }
    );
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
  async getGroupStudents(groupId: number): Promise<TutorStudent[]> {
    const response = await api.get(`/academic/groups/${groupId}/students/`);
    return response.data;
  },

  /**
   * Obtener detalle completo del cuestionario activo (con preguntas).
   * Primero obtiene la lista de cuestionarios del tutor, filtra el activo,
   * y luego obtiene su detalle con preguntas desde el endpoint admin.
   * GET /api/academic/cuestionarios/
   * GET /api/admin/cuestionarios/:id/
   */
  async getCuestionarioActivo(): Promise<Cuestionario | null> {
    const listResponse = await api.get<{
      cuestionarios: Array<{ id: number; titulo: string; esta_activo: boolean }>;
    }>('/academic/cuestionarios/');
    const activo = (listResponse.data.cuestionarios || []).find((c) => c.esta_activo);
    if (!activo) return null;
    const detalleResponse = await api.get<{ cuestionario: Cuestionario }>(
      `/admin/cuestionarios/${activo.id}/`
    );
    return detalleResponse.data.cuestionario;
  },

  /**
   * Obtener todos los alumnos asignados al tutor (de todos sus grupos).
   * El endpoint /api/academic/my-groups/ ya incluye los alumnos de cada grupo
   * en el campo `alumnos`, asi que no necesita llamadas adicionales.
   * GET /api/academic/my-groups/
   */
  async getAllMyStudents(): Promise<{ students: TutorStudent[]; groups: TutorGroupSummary[] }> {
    const groupsResponse = await api.get('/academic/my-groups/');
    const rawData = groupsResponse.data;

    // El endpoint devuelve { success, grupos: [...] }
    let grupos: Array<Record<string, unknown>> = [];
    if (Array.isArray(rawData)) {
      grupos = rawData;
    } else if (rawData && typeof rawData === 'object') {
      grupos = rawData.grupos ?? rawData.results ?? [];
    }

    if (grupos.length === 0) return { students: [], groups: [] };

    const groupsSummary: TutorGroupSummary[] = [];
    const allStudents: TutorStudent[] = [];

    for (const g of grupos) {
      const grupoId = g.id as number;
      const grupoClave = (g.clave as string) ?? '';
      const totalAlumnos = (g.total_alumnos as number) ?? 0;

      groupsSummary.push({
        id: grupoId,
        clave: grupoClave,
        total_alumnos: totalAlumnos,
        grado: g.grado as string | undefined,
        grupo: g.grupo as string | undefined,
        programa_codigo: g.programa_codigo as string | undefined,
        periodo_codigo: g.periodo_codigo as string | undefined,
        periodo_nombre: g.periodo_nombre as string | undefined,
      });

      // Los alumnos vienen directamente en el campo "alumnos" de cada grupo
      const alumnos = (g.alumnos as Array<Record<string, unknown>>) ?? [];
      for (const a of alumnos) {
        allStudents.push({
          id: (a.id as number) ?? 0,
          matricula: (a.matricula as string) ?? '',
          nombre_completo: (a.nombre_completo as string) ?? (a.nombre as string) ?? '',
          email: (a.email as string) ?? '',
          grupo_id: grupoId,
          grupo_clave: grupoClave,
        });
      }
    }

    return { students: allStudents, groups: groupsSummary };
  },

  /**
   * Obtener el registro de actividades de un cuestionario por grupo.
   * Incluye fecha de inicio, fecha de completado y estado de cada alumno.
   * GET /api/academic/cuestionarios/{cuestionarioId}/registro/?grupo_id={grupoId}
   */
  async getCuestionarioRegistro(cuestionarioId: number, grupoId: number): Promise<RegistroResponse> {
    const response = await api.get<RegistroResponse>(
      `/academic/cuestionarios/${cuestionarioId}/registro/`,
      { params: { grupo_id: grupoId } }
    );
    return response.data;
  },

  /**
   * Obtener ranking de alumnos por puntaje recibido en una pregunta especifica.
   * Solo aplica a preguntas de tipo SELECCION_ALUMNO.
   * GET /api/academic/cuestionarios/{cuestionarioId}/clasificacion-pregunta/?grupo_id={grupoId}&pregunta_id={preguntaId}
   */
  async getClasificacionPregunta(
    cuestionarioId: number,
    grupoId: number,
    preguntaId: number
  ): Promise<ClasificacionPreguntaResponse> {
    const response = await api.get<ClasificacionPreguntaResponse>(
      `/academic/cuestionarios/${cuestionarioId}/clasificacion-pregunta/`,
      { params: { grupo_id: grupoId, pregunta_id: preguntaId } }
    );
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Modulo de Archivos / Exportacion
  // -------------------------------------------------------------------------

  /**
   * Listar todos los cuestionarios historicos del tutor.
   * Sin restriccion de periodo activo — incluye todos los grupos del tutor.
   * Ordenados por fecha_cuestionario descendente.
   * GET /api/academic/archivos/cuestionarios/
   */
  async getArchivosListado(): Promise<ArchivosListResponse> {
    const response = await api.get<ArchivosListResponse>(
      '/academic/archivos/cuestionarios/'
    );
    return response.data;
  },

  /**
   * Obtener datos del sociograma para renderizar y exportar como JPG.
   * Version desbloqueada de /estadisticas/ — sin restriccion de activo.
   * GET /api/academic/archivos/cuestionarios/{cuestionarioId}/sociograma/?grupo_id={grupoId}
   */
  async getSociogramaData(
    cuestionarioId: number,
    grupoId: number
  ): Promise<SociogramaDataResponse> {
    const response = await api.get<SociogramaDataResponse>(
      `/academic/archivos/cuestionarios/${cuestionarioId}/sociograma/`,
      { params: { grupo_id: grupoId } }
    );
    return response.data;
  },

  /**
   * Descargar CSV del sociograma como Blob.
   * El backend devuelve text/csv con BOM UTF-8 (compatible con Excel).
   * Filename: sociograma_{grupo_clave}_{cuestionario_id}.csv
   * GET /api/academic/archivos/cuestionarios/{cuestionarioId}/exportar/csv/?grupo_id={grupoId}
   */
  async exportarCSV(cuestionarioId: number, grupoId: number): Promise<Blob> {
    const response = await api.get(
      `/academic/archivos/cuestionarios/${cuestionarioId}/exportar/csv/`,
      {
        params: { grupo_id: grupoId },
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  },

  /**
   * Descargar PDF del sociograma como Blob.
   * A4 horizontal con tablas coloreadas por clasificacion.
   * Filename: sociograma_{grupo_clave}_{cuestionario_id}.pdf
   * GET /api/academic/archivos/cuestionarios/{cuestionarioId}/exportar/pdf/?grupo_id={grupoId}
   */
  async exportarPDF(cuestionarioId: number, grupoId: number): Promise<Blob> {
    const response = await api.get(
      `/academic/archivos/cuestionarios/${cuestionarioId}/exportar/pdf/`,
      {
        params: { grupo_id: grupoId },
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  },

  /**
   * Descargar la imagen PNG del sociograma generada por el backend.
   * El servidor renderiza el grafo y devuelve la imagen directamente.
   * Filename: sociograma_{grupo_clave}_{cuestionario_id}.png
   * GET /api/academic/archivos/cuestionarios/{cuestionarioId}/exportar/imagen/?grupo_id={grupoId}
   */
  async exportarImagen(cuestionarioId: number, grupoId: number): Promise<Blob> {
    const response = await api.get(
      `/academic/archivos/cuestionarios/${cuestionarioId}/exportar/imagen/`,
      {
        params: { grupo_id: grupoId },
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  },
};
