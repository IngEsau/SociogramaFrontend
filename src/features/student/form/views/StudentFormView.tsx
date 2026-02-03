/**
 * Vista del Formulario de Estudiante - Sociograma UTP
 * Diseño responsivo (PC, Tablet, Mobile)
 */

import { useEffect } from 'react';
import { useAuthStore } from '../../../../store';
import { useStudentFormStore } from '../../store/studentForm.store';
import {
  SurveyHeader,
  SurveyForm,
  DecorativeCircles,
  SuccessMessage,
} from '../components';
import type { Student } from '../../types/studentForm.types';

// Estudiantes de ejemplo
const EXAMPLE_STUDENTS: Student[] = [
  { id: '1', name: 'Ana Martínez Sánchez' },
  { id: '2', name: 'Carlos Ramírez López' },
  { id: '3', name: 'Luis Hernández García' },
  { id: '4', name: 'María González Torres' },
  { id: '5', name: 'Pedro López Ramírez' },
  { id: '6', name: 'Sofía Díaz Morales' },
  { id: '7', name: 'José García Ruiz' },
  { id: '8', name: 'Laura Fernández Castro' },
  { id: '9', name: 'Miguel Sánchez Pérez' },
  { id: '10', name: 'Carmen Rodríguez Silva' },
  { id: '11', name: 'Roberto Jiménez Ortiz' },
  { id: '12', name: 'Patricia Torres Vega' },
  { id: '13', name: 'Fernando Álvarez Rojas' },
  { id: '14', name: 'Isabel Romero Navarro' },
  { id: '15', name: 'Andrés Muñoz Castillo' },
  { id: '16', name: 'Gabriela Cruz Mendoza' },
  { id: '17', name: 'Diego Vargas Herrera' },
  { id: '18', name: 'Valentina Reyes Campos' },
  { id: '19', name: 'Ricardo Flores Guerrero' },
  { id: '20', name: 'Daniela Medina Aguilar' },
  { id: '21', name: 'Javier Molina Ríos' },
  { id: '22', name: 'Andrea Gutiérrez León' },
  { id: '23', name: 'Alejandro Castro Ramos' },
  { id: '24', name: 'Natalia Ortiz Delgado' },
  { id: '25', name: 'Emilio Peña Carrillo' },
  { id: '26', name: 'Carolina Vázquez Salazar' },
  { id: '27', name: 'Sergio Mendez Cortés' },
  { id: '28', name: 'Paola Ruiz Montero' },
  { id: '29', name: 'Raúl Domínguez Paredes' },
  { id: '30', name: 'Lucía Herrera Espinoza' },
];

export const StudentFormView = () => {
  const { user } = useAuthStore();
  
  const {
    answers,
    isSubmitting,
    error,
    submitSuccess,
    initializeForm,
    setAnswer,
    submitSurvey,
    getQuestions,
  } = useStudentFormStore();

  const questions = getQuestions();

  // Inicializar el formulario al montar
  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  // Estado de error
  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md p-8 bg-red-50 border-2 border-red-200 rounded-2xl text-center">
          <h2 className="text-red-600 text-2xl font-bold font-lato mb-4">Error</h2>
          <p className="text-red-500 text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Estado de éxito
  if (submitSuccess) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
        <DecorativeCircles />
        <SuccessMessage studentName={user?.nombre_completo || ''} />
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
        <SurveyHeader groupName="" />
        
        {/* Formulario con preguntas */}
        <SurveyForm
          studentName={user?.nombre_completo || ''}
          studentId={user?.alumno?.matricula || user?.username || ''}
          questions={questions}
          students={EXAMPLE_STUDENTS}
          answers={answers}
          onAnswerChange={setAnswer}
          onSubmit={submitSurvey}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};
