/**
 * Vista del Formulario de Estudiante - Sociograma UTP
 * Carga preguntas reales desde backend y envía respuestas del alumno.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../../store';
import { studentService } from '../../services';
import {
  SurveyHeader,
  SurveyForm,
  DecorativeCircles,
  SuccessMessage,
} from '../components';
import type { Question, QuestionAnswer, Student } from '../../types/studentForm.types';
import type { StudentQuestion } from '../../types';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: Record<string, unknown> } };
    const data = axiosError.response?.data;
    if (data) {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.detail === 'string') return data.detail;
      if (typeof data.message === 'string') return data.message;
    }
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

function createInitialAnswers(questions: Question[]): Record<number, QuestionAnswer> {
  return questions.reduce<Record<number, QuestionAnswer>>((acc, question) => {
    acc[question.id] = {
      firstPlace: null,
      secondPlace: null,
      thirdPlace: null,
    };
    return acc;
  }, {});
}

export const StudentFormView = () => {
  const navigate = useNavigate();
  const { cuestionarioId } = useParams<{ cuestionarioId?: string }>();
  const { user } = useAuthStore();

  const [groupName, setGroupName] = useState('');
  const [questionnaireTitle, setQuestionnaireTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [rawQuestions, setRawQuestions] = useState<StudentQuestion[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [unsupportedError, setUnsupportedError] = useState<string | null>(null);

  const questionnaireId = useMemo(() => {
    const parsed = Number(cuestionarioId);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  }, [cuestionarioId]);

  // Bloquear cierre/recarga de la pestaña mientras el formulario esté en progreso
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Solo bloquear si no se ha enviado exitosamente y hay al menos una respuesta
      if (submitSuccess) return;

      const hasAnyAnswer = Object.values(answers).some(
        (a) => a.firstPlace || a.secondPlace || a.thirdPlace
      );
      if (!hasAnyAnswer) return;

      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, submitSuccess]);

  useEffect(() => {
    let cancelled = false;

    const fetchQuestionnaire = async () => {
      if (!questionnaireId) {
        setError('No se recibió un cuestionario válido para responder.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setUnsupportedError(null);
      setSubmitSuccess(false);

      try {
        const response = await studentService.getQuestionnaireQuestions(questionnaireId);
        if (cancelled) return;

        const mappedQuestions: Question[] = response.preguntas.map((question) => ({
          id: question.id,
          text: question.texto,
          // El diseño actual no usa esta propiedad para renderizar lógica.
          type: 'positive',
        }));

        const mappedStudents: Student[] = response.companeros
          .map((classmate) => ({
            id: String(classmate.id),
            name: classmate.nombre,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'es'));

        const hasUnsupportedQuestion = response.preguntas.some(
          (question) => question.tipo !== 'SELECCION_ALUMNO' || question.max_elecciones !== 3
        );

        setGroupName(response.grupo_clave);
        setQuestionnaireTitle(response.cuestionario_titulo);
        setRawQuestions(response.preguntas);
        setQuestions(mappedQuestions);
        setStudents(mappedStudents);
        setAnswers(createInitialAnswers(mappedQuestions));

        if (hasUnsupportedQuestion) {
          setUnsupportedError(
            'Este cuestionario incluye preguntas que esta pantalla aún no soporta (distintas a selección de 3 compañeros).'
          );
        }
      } catch (fetchError) {
        if (cancelled) return;
        setError(
          extractErrorMessage(
            fetchError,
            'No se pudo cargar el cuestionario. Regresa al panel e inténtalo de nuevo.'
          )
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchQuestionnaire();

    return () => {
      cancelled = true;
    };
  }, [questionnaireId]);

  const setAnswer = useCallback(
    (
      questionId: number,
      place: 'firstPlace' | 'secondPlace' | 'thirdPlace',
      studentIdValue: string | null
    ) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          ...(prev[questionId] ?? {
            firstPlace: null,
            secondPlace: null,
            thirdPlace: null,
          }),
          [place]: studentIdValue,
        },
      }));
    },
    []
  );

  const submitSurvey = useCallback(async () => {
    if (!questionnaireId || isSubmitting || unsupportedError) return;

    const hasMissingAnswers = questions.some((question) => {
      const answer = answers[question.id];
      return !answer?.firstPlace || !answer?.secondPlace || !answer?.thirdPlace;
    });

    if (hasMissingAnswers) {
      setError('Debes completar todas las preguntas antes de enviar.');
      return;
    }

    if (rawQuestions.length !== questions.length) {
      setError('La estructura del cuestionario cambió. Recarga e inténtalo de nuevo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        respuestas: questions.map((question) => {
          const answer = answers[question.id];
          return {
            pregunta_id: question.id,
            seleccionados: [
              { alumno_id: Number(answer.firstPlace), orden: 1 },
              { alumno_id: Number(answer.secondPlace), orden: 2 },
              { alumno_id: Number(answer.thirdPlace), orden: 3 },
            ],
          };
        }),
      };

      const response = await studentService.submitQuestionnaire(questionnaireId, payload);
      if (!response.success) {
        setError(response.error || response.message || 'No se pudo enviar el cuestionario.');
        return;
      }

      setSubmitSuccess(true);
    } catch (submitError) {
      setError(
        extractErrorMessage(
          submitError,
          'No se pudo enviar tu cuestionario en este momento. Intenta nuevamente.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, isSubmitting, questions, questionnaireId, rawQuestions.length, unsupportedError]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md p-8 bg-white border border-[#0F7E3C]/30 rounded-2xl text-center shadow-sm">
          <h2 className="text-[#0F7E3C] text-2xl font-bold font-lato mb-4">Cargando</h2>
          <p className="text-[#245C52] text-lg font-medium">Preparando tu cuestionario...</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
        <DecorativeCircles />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <SuccessMessage
            studentName={user?.nombre_completo || ''}
            redirectSeconds={5}
            onRedirect={() => navigate('/student')}
          />
        </div>
      </div>
    );
  }

  if (!questionnaireId) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-lg p-8 bg-red-50 border-2 border-red-200 rounded-2xl text-center space-y-4">
          <h2 className="text-red-700 text-2xl font-bold font-lato">No se puede abrir el formulario</h2>
          <p className="text-red-600 text-base">{error ?? 'Falta el identificador del cuestionario.'}</p>
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="rounded-lg bg-[#0F7E3C] px-6 py-2.5 text-white font-semibold hover:bg-[#0c6a33] transition-colors"
          >
            Regresar al panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen relative bg-white overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <DecorativeCircles />
    
      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 py-8 sm:py-12 md:py-16 lg:py-20 flex flex-col items-center gap-6 sm:gap-8">
        {/* Header con logos, título e instrucciones */}
        <SurveyHeader groupName={groupName || questionnaireTitle} questionnaireTitle={questionnaireTitle} />

        {error && (
          <div className="w-full max-w-5xl rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm sm:text-base">
            {error}
          </div>
        )}

        {unsupportedError && (
          <div className="w-full max-w-5xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 text-sm sm:text-base">
            {unsupportedError}
          </div>
        )}

        {/* Formulario con preguntas */}
        <SurveyForm
          studentName={user?.nombre_completo || ''}
          studentId={String(user?.alumno?.id ?? '')}
          questions={questions}
          students={students}
          answers={answers}
          onAnswerChange={setAnswer}
          onSubmit={submitSurvey}
          isSubmitting={isSubmitting || !!unsupportedError}
        />
      </div>
    </div>
  );
};
