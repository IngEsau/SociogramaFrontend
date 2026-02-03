/**
 * Store para el formulario de estudiante - Sociograma
 * Maneja el estado global del formulario usando Zustand
 */

import { create } from 'zustand';
import type { Question, QuestionAnswer } from '../types/studentForm.types';

// Preguntas de ejemplo del sociograma
const EXAMPLE_QUESTIONS: Question[] = [
  { id: 1, text: '¿A quién elegirías para realizar un proyecto de programación?', type: 'positive' },
  { id: 2, text: '¿A quién descartarías por que te diiera asesorías de programación?', type: 'negative' },
  { id: 3, text: '¿Si se descompondriu tu computadora a quién recurririas para que te ayude a repararla?', type: 'positive' },
  { id: 4, text: '¿A cuál de sus compañeros evitarías si el equipo de cómputo tuviera alguna falla?', type: 'negative' },
  { id: 5, text: '¿Si vas a presentar un proyecto a un cliente, ¿A quién elegirías para que te acompañe?', type: 'positive' },
  { id: 6, text: '¿Si un cliente llega a tu empresa y pide que expliquen un método de trabajo, ¿A quién no le pedirías que hablara con el cliente?', type: 'negative' },
  { id: 7, text: '¿A cuál de tus compañeros elegirías para documentar trabajos?', type: 'positive' },
  { id: 8, text: '¿A quién evitarías preguntarle cuando tienes dudas de ortografía o redacción?', type: 'negative' },
  { id: 9, text: '¿A quienes elegirías para que se agroup en un trabajo como freelance?', type: 'positive' },
  { id: 10, text: '¿A quién no le pedirías ayuda para un puesto de trabajo?', type: 'negative' },
  { id: 11, text: '¿Si vas a un congreso fuera de tu estado, ¿Con quién te gustaría compartir habitación?', type: 'positive' },
  { id: 12, text: '¿Si vas a un evento fuera de tu ciudad, ¿Con quién evitarías compartir habitación?', type: 'negative' },
  { id: 13, text: '¿A quién le pedirías que te ayude a organizar una fiesta?', type: 'positive' },
  { id: 14, text: '¿Quién sería personas menos adecuada para organizar un evento?', type: 'negative' },
  { id: 15, text: '¿A quién compartirías un secreto?', type: 'positive' },
  { id: 16, text: '¿A quién evitarías contarle algo importante para ti?', type: 'negative' },
  { id: 17, text: '¿A quién encargarías un secreto pero con la seguridad de que es enterado todo el salón?', type: 'negative' },
  { id: 18, text: '¿A quién necesitarías un consejo?', type: 'positive' },
  { id: 19, text: '¿Si tuviera un conflicto legal, ¿A quién le pedirías que te invite a resolver tu caso?', type: 'negative' },
  { id: 20, text: '¿Si tuviera un problema en la política, ¿A quién NO le pedirías ayuda?', type: 'negative' },
];

interface StudentFormState {
  // Respuestas del formulario
  answers: Record<number, QuestionAnswer>;
  
  // Estados de carga
  isSubmitting: boolean;
  error: string | null;
  submitSuccess: boolean;
  
  // Acciones
  initializeForm: () => void;
  setAnswer: (questionId: number, place: 'firstPlace' | 'secondPlace' | 'thirdPlace', studentId: string | null) => void;
  submitSurvey: () => Promise<void>;
  resetForm: () => void;
  clearError: () => void;
  
  // Getters
  getQuestions: () => Question[];
}

const initialAnswers: QuestionAnswer = {
  firstPlace: null,
  secondPlace: null,
  thirdPlace: null,
};

export const useStudentFormStore = create<StudentFormState>((set, get) => ({
  // Estado inicial
  answers: {},
  isSubmitting: false,
  error: null,
  submitSuccess: false,

  // Inicializar el formulario con preguntas
  initializeForm: () => {
    const initialAnswersMap: Record<number, QuestionAnswer> = {};
    EXAMPLE_QUESTIONS.forEach(q => {
      initialAnswersMap[q.id] = { ...initialAnswers };
    });
    
    set({
      answers: initialAnswersMap,
      error: null,
      submitSuccess: false,
    });
  },

  // Establecer respuesta para una pregunta
  setAnswer: (questionId, place, studentId) => {
    const { answers } = get();
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...answers[questionId],
          [place]: studentId,
        },
      },
    });
  },

  // Enviar encuesta
  submitSurvey: async () => {
    const { answers } = get();
    set({ isSubmitting: true, error: null });

    try {
      // TODO: Aquí se enviarían los datos al backend
      const formattedAnswers = EXAMPLE_QUESTIONS.map(q => ({
        questionId: q.id,
        firstPlace: answers[q.id]?.firstPlace || '',
        secondPlace: answers[q.id]?.secondPlace || '',
        thirdPlace: answers[q.id]?.thirdPlace || '',
      }));

      console.log('Enviando respuestas:', formattedAnswers);

      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 1000));

      set({ isSubmitting: false, submitSuccess: true });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al enviar la encuesta',
        isSubmitting: false,
      });
    }
  },

  // Resetear formulario
  resetForm: () => {
    set({
      answers: {},
      isSubmitting: false,
      error: null,
      submitSuccess: false,
    });
  },

  // Limpiar error
  clearError: () => set({ error: null }),
  
  // Obtener preguntas
  getQuestions: () => EXAMPLE_QUESTIONS,
}));
