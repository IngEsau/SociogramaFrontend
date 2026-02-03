/**
 * Componente Selector de Estudiante - Sociograma
 * Dropdown compacto para seleccionar compañeros
 */

import type { Student } from '../../types/studentForm.types';

interface StudentSelectorProps {
  label: string;
  value: string | null;
  students: Student[];
  excludeIds: string[];
  currentStudentId: string;
  onChange: (studentId: string | null) => void;
  disabled?: boolean;
}

export const StudentSelector = ({
  label,
  value,
  students,
  excludeIds,
  currentStudentId,
  onChange,
  disabled = false,
}: StudentSelectorProps) => {
  // Filtrar estudiantes que ya fueron seleccionados en otros lugares y el estudiante actual
  const availableStudents = students.filter(
    (student) => 
      !excludeIds.includes(student.id) && 
      student.id !== currentStudentId &&
      student.id !== value
  );

  // Incluir el estudiante actualmente seleccionado en las opciones
  const selectedStudent = students.find((s) => s.id === value);

  return (
    <div className="flex flex-col justify-start items-center gap-1 min-w-0">
      {/* Label */}
      <span className="text-[#245C52] text-xs sm:text-sm md:text-base lg:text-xl font-bold font-lato text-center">
        {label}
      </span>
      
      {/* Select Dropdown */}
      <div className="relative w-full">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className="w-full h-8 sm:h-9 md:h-10 px-2 pr-6 bg-white border border-[rgba(15,126,60,0.50)] rounded-lg appearance-none cursor-pointer text-xs sm:text-sm font-medium font-lato disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-[#0F7E3C]/30 transition-all truncate"
          style={{
            color: value ? '#245C52' : 'rgba(36, 92, 82, 0.60)',
          }}
        >
          <option value="">Elige el nombre de un compañero</option>
          {selectedStudent && (
            <option key={selectedStudent.id} value={selectedStudent.id}>
              {selectedStudent.name}
            </option>
          )}
          {availableStudents.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
        
        {/* Chevron Icon */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#0F7E3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
