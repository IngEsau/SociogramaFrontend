/**
 * Servicio de Student
 *
 * Maneja operaciones de cuestionarios para usuarios ALUMNO.
 * Endpoints: /api/student/cuestionarios/*
 */

import { api } from '../../../core/api/axios';
import type {
  StudentAvailableQuestionnairesResponse,
  StudentQuestionnaireDetailResponse,
  StudentQuestionnaireQuestionsResponse,
  StudentSubmitAnswersRequest,
  StudentSubmitAnswersResponse,
  StudentQuestionnaireProgressResponse,
} from '../types';

export const studentService = {
  /**
   * Obtener cuestionarios activos disponibles para el alumno.
   * GET /student/cuestionarios/disponibles/
   */
  async getAvailableQuestionnaires(): Promise<StudentAvailableQuestionnairesResponse> {
    const response = await api.get<StudentAvailableQuestionnairesResponse>(
      '/student/cuestionarios/disponibles/'
    );
    return response.data;
  },

  /**
   * Obtener detalle de un cuestionario.
   * GET /student/cuestionarios/{id}/
   */
  async getQuestionnaireDetail(id: number): Promise<StudentQuestionnaireDetailResponse> {
    const response = await api.get<StudentQuestionnaireDetailResponse>(
      `/student/cuestionarios/${id}/`
    );
    return response.data;
  },

  /**
   * Obtener preguntas y compañeros del cuestionario.
   * GET /student/cuestionarios/{id}/preguntas/
   */
  async getQuestionnaireQuestions(id: number): Promise<StudentQuestionnaireQuestionsResponse> {
    const response = await api.get<StudentQuestionnaireQuestionsResponse>(
      `/student/cuestionarios/${id}/preguntas/`
    );
    return response.data;
  },

  /**
   * Enviar respuestas del cuestionario.
   * POST /student/cuestionarios/{id}/responder/
   */
  async submitQuestionnaire(
    id: number,
    payload: StudentSubmitAnswersRequest
  ): Promise<StudentSubmitAnswersResponse> {
    const response = await api.post<StudentSubmitAnswersResponse>(
      `/student/cuestionarios/${id}/responder/`,
      payload
    );
    return response.data;
  },

  /**
   * Obtener progreso personal del alumno en un cuestionario.
   * GET /student/cuestionarios/{id}/mi-progreso/
   */
  async getMyProgress(id: number): Promise<StudentQuestionnaireProgressResponse> {
    const response = await api.get<StudentQuestionnaireProgressResponse>(
      `/student/cuestionarios/${id}/mi-progreso/`
    );
    return response.data;
  },
};

export default studentService;
