/**
 * Servicio de Student
 * 
 * Maneja las operaciones para estudiantes/alumnos
 */

import { api } from '../../../core/api/axios';

export interface AssignedSurvey {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_asignacion: string;
  fecha_limite?: string;
  estado: 'pendiente' | 'en_progreso' | 'completado';
  grupo: {
    id: number;
    nombre: string;
  };
}

export interface SurveyQuestion {
  id: number;
  texto: string;
  tipo: 'eleccion' | 'rechazo' | 'neutral';
  orden: number;
}

export interface SurveyResponse {
  pregunta_id: number;
  seleccionados: number[]; // IDs de compañeros seleccionados
}

export interface Classmate {
  id: number;
  nombre_completo: string;
  matricula: string;
}

export const studentService = {
  /**
   * Obtener encuestas asignadas al estudiante
   */
  async getAssignedSurveys(): Promise<AssignedSurvey[]> {
    const response = await api.get('/sociograms/my-surveys/');
    return response.data;
  },

  /**
   * Obtener detalle de una encuesta
   */
  async getSurveyById(id: number): Promise<AssignedSurvey & { preguntas: SurveyQuestion[] }> {
    const response = await api.get(`/sociograms/surveys/${id}/`);
    return response.data;
  },

  /**
   * Obtener compañeros del grupo para la encuesta
   */
  async getClassmates(surveyId: number): Promise<Classmate[]> {
    const response = await api.get(`/sociograms/surveys/${surveyId}/classmates/`);
    return response.data;
  },

  /**
   * Guardar respuesta parcial (progreso)
   */
  async saveProgress(surveyId: number, responses: SurveyResponse[]): Promise<void> {
    await api.post(`/sociograms/surveys/${surveyId}/save-progress/`, { responses });
  },

  /**
   * Enviar respuestas finales
   */
  async submitSurvey(surveyId: number, responses: SurveyResponse[]): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/sociograms/surveys/${surveyId}/submit/`, { responses });
    return response.data;
  },

  /**
   * Obtener progreso guardado
   */
  async getSavedProgress(surveyId: number): Promise<SurveyResponse[]> {
    const response = await api.get(`/sociograms/surveys/${surveyId}/progress/`);
    return response.data;
  },
};

export default studentService;
