/**
 * Servicio para el formulario de estudiante - Sociograma
 */

import { api } from '../../../core/api/axios';
import type { SurveyInfo, SubmitSurveyRequest, SubmitSurveyResponse } from '../types/studentForm.types';

export const studentFormService = {
  /**
   * Obtener información de la encuesta (preguntas, estudiantes, grupo)
   */
  getSurveyInfo: async (groupCode: string, studentId: string): Promise<SurveyInfo> => {
    const response = await api.get<SurveyInfo>(`/survey/${groupCode}/${studentId}`);
    return response.data;
  },

  /**
   * Enviar respuestas de la encuesta
   */
  submitSurvey: async (data: SubmitSurveyRequest): Promise<SubmitSurveyResponse> => {
    const response = await api.post<SubmitSurveyResponse>('/survey/submit', data);
    return response.data;
  },

  /**
   * Validar si el estudiante ya completó la encuesta
   */
  checkSurveyStatus: async (groupCode: string, studentId: string): Promise<{ completed: boolean }> => {
    const response = await api.get<{ completed: boolean }>(`/survey/status/${groupCode}/${studentId}`);
    return response.data;
  },
};
