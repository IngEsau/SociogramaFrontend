/**
 * Componente Formulario de Encuesta - Sociograma
 * Contiene todas las preguntas del formulario según diseño Figma
 */

import { QuestionCard } from './QuestionCard';
import type { Question, QuestionAnswer, Student } from '../../types/studentForm.types';

interface SurveyFormProps {
  studentName: string;
  studentId: string;
  questions: Question[];
  students: Student[];
  answers: Record<number, QuestionAnswer>;
  onAnswerChange: (questionId: number, place: 'firstPlace' | 'secondPlace' | 'thirdPlace', studentId: string | null) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const SurveyForm = ({
  studentName,
  studentId,
  questions,
  students,
  answers,
  onAnswerChange,
  onSubmit,
  isSubmitting,
}: SurveyFormProps) => {
  // Verificar si todas las preguntas están completas
  const isFormComplete = questions.every((q) => {
    const answer = answers[q.id];
    return answer?.firstPlace && answer?.secondPlace && answer?.thirdPlace;
  });

  return (
    <div 
      className="w-full p-4 sm:p-6 md:p-8 lg:p-10 rounded-2xl border-l border-r border-b border-[#0F7E3C] border-t-[16px] flex flex-col justify-start items-start gap-4 sm:gap-6 lg:gap-8 backdrop-blur-[50px]"
      style={{
        background: 'rgba(255, 255, 255, 0.60)',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.24)',
      }}
    >
      {/* Nombre del estudiante */}
      <div className="w-full overflow-hidden flex flex-col justify-start items-start gap-3 sm:gap-4 lg:gap-6">
        <h2 className="w-full text-[#0B9624] text-base sm:text-lg md:text-xl lg:text-2xl xl:text-[32px] font-bold font-lato break-words">
          Nombre: {studentName || '[Nombre]'}
        </h2>
        <div className="w-full h-px bg-[rgba(15,126,60,0.40)]" />
      </div>

      {/* Lista de preguntas */}
      <div className="w-full flex flex-col justify-start items-start gap-4 sm:gap-5 lg:gap-6">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            questionNumber={index + 1}
            answer={answers[question.id] || { firstPlace: null, secondPlace: null, thirdPlace: null }}
            students={students}
            currentStudentId={studentId}
            onAnswerChange={(place, studentIdValue) => onAnswerChange(question.id, place, studentIdValue)}
          />
        ))}
      </div>

      {/* Botón de envío */}
      <div className="w-full flex justify-center items-center pt-2 sm:pt-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isFormComplete || isSubmitting}
          className="w-full sm:w-auto px-6 sm:px-10 lg:px-12 py-2.5 sm:py-3 lg:py-4 bg-[#0F7E3C] hover:bg-[#0a6630] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold font-lato rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.24)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </span>
          ) : (
            'Enviar Encuesta'
          )}
        </button>
      </div>

      {/* Mensaje de campos incompletos */}
      {!isFormComplete && (
        <p className="w-full text-center text-amber-600 text-xs sm:text-sm font-medium">
          Por favor, completa todas las preguntas antes de enviar.
        </p>
      )}
    </div>
  );
};
