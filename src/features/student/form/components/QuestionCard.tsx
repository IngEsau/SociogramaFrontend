/**
 * Componente Card de Pregunta - Sociograma
 * Muestra una pregunta con sus 3 selectores de respuesta en horizontal
 */

import { StudentSelector } from './StudentSelector';
import type { Question, QuestionAnswer, Student } from '../../types/studentForm.types';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  answer: QuestionAnswer;
  students: Student[];
  currentStudentId: string;
  onAnswerChange: (place: 'firstPlace' | 'secondPlace' | 'thirdPlace', studentId: string | null) => void;
}

export const QuestionCard = ({
  question,
  questionNumber,
  answer,
  students,
  currentStudentId,
  onAnswerChange,
}: QuestionCardProps) => {
  // Obtener IDs seleccionados para excluirlos de las otras opciones
  const selectedIds = [
    answer.firstPlace,
    answer.secondPlace,
    answer.thirdPlace,
  ].filter((id): id is string => id !== null);

  return (
    <div className="w-full flex flex-col justify-start items-start gap-1">
      {/* Número de pregunta */}
      <div className="w-full">
        <span className="text-[#0F7E3C] text-lg sm:text-xl md:text-2xl lg:text-[32px] font-bold font-lato">
          Pregunta {questionNumber}.
        </span>
      </div>
      
      {/* Texto de la pregunta con indicador */}
      <div className="w-full flex justify-start items-start gap-2">
        {/* Indicador de tipo (bolita verde) */}
        <div 
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 mt-1"
          style={{
            background: 'radial-gradient(ellipse 65.28% 62.45% at 31.07% 31.98%, #245C52 0%, #06322B 100%)',
          }}
        />
        <span className="flex-1 text-[#245C52] text-sm sm:text-base md:text-lg lg:text-2xl font-bold font-lato">
          {question.text}
        </span>
      </div>
      
      {/* Selectores de respuesta - SIEMPRE en fila horizontal */}
      <div className="w-full grid grid-cols-3 gap-2 mt-2">
        <StudentSelector
          label="1er Lugar"
          value={answer.firstPlace}
          students={students}
          excludeIds={selectedIds.filter((id) => id !== answer.firstPlace)}
          currentStudentId={currentStudentId}
          onChange={(id) => onAnswerChange('firstPlace', id)}
        />
        <StudentSelector
          label="2do Lugar"
          value={answer.secondPlace}
          students={students}
          excludeIds={selectedIds.filter((id) => id !== answer.secondPlace)}
          currentStudentId={currentStudentId}
          onChange={(id) => onAnswerChange('secondPlace', id)}
        />
        <StudentSelector
          label="3er Lugar"
          value={answer.thirdPlace}
          students={students}
          excludeIds={selectedIds.filter((id) => id !== answer.thirdPlace)}
          currentStudentId={currentStudentId}
          onChange={(id) => onAnswerChange('thirdPlace', id)}
        />
      </div>
    </div>
  );
};
