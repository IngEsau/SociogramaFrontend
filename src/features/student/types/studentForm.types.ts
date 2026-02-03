/**
 * Tipos para el formulario de estudiante - Sociograma
 */

export interface Student {
  id: string;
  name: string;
}

export interface QuestionAnswer {
  firstPlace: string | null;
  secondPlace: string | null;
  thirdPlace: string | null;
}

export interface Question {
  id: number;
  text: string;
  type: 'positive' | 'negative';
}

export interface SurveyFormData {
  studentId: string;
  studentName: string;
  groupCode: string;
  answers: Record<number, QuestionAnswer>;
}

export interface SurveyInfo {
  groupName: string;
  groupCode: string;
  students: Student[];
  questions: Question[];
}

export interface SubmitSurveyRequest {
  studentId: string;
  groupCode: string;
  answers: {
    questionId: number;
    firstPlace: string;
    secondPlace: string;
    thirdPlace: string;
  }[];
}

export interface SubmitSurveyResponse {
  success: boolean;
  message: string;
}
