/**
 * Vista de Acceso al Formulario - Sociograma
 * Vista donde los estudiantes, maestros o admin acceden al formulario
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store';

export const StudentFormAccessView = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [groupCode, setGroupCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validaciones
    if (!groupCode.trim()) {
      setError('Por favor ingresa el código del grupo');
      return;
    }

    if (!studentId.trim()) {
      setError('Por favor ingresa tu matrícula');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Aquí validarías con el backend si el código y matrícula son válidos
      // Por ahora solo navegamos a la vista del formulario
      navigate(`/student-form/${groupCode}/${studentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Círculos decorativos */}
      <div className="absolute w-64 h-64 -left-20 -top-20 bg-gradient-radial from-[#245C52] to-[#06322B] rounded-full opacity-20 pointer-events-none" />
      <div className="absolute w-96 h-96 -right-32 -bottom-32 bg-gradient-radial from-[#245C52] to-[#06322B] rounded-full opacity-20 pointer-events-none" />
      
      {/* Contenedor principal */}
      <div className="w-full max-w-2xl relative z-10">
        {/* Card de acceso */}
        <div className="bg-white/90 backdrop-blur-sm shadow-[0px_8px_24px_rgba(0,0,0,0.24)] rounded-2xl border-t-8 border-t-[#0F7E3C] border-x border-b border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F7E3C] to-[#245C52] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold font-lato mb-2">
                  Acceso al Sociograma
                </h1>
                <p className="text-white/90 text-sm sm:text-base">
                  Bienvenido/a, <span className="font-bold">{user?.nombre_completo}</span>
                </p>
                <p className="text-white/80 text-xs sm:text-sm mt-1">
                  Rol: {user?.rol}
                </p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 sm:p-8 md:p-10">
            {/* Instrucciones */}
            <div className="mb-8 p-4 bg-[#0F7E3C]/5 border-l-4 border-[#0F7E3C] rounded">
              <p className="text-[#245C52] text-sm sm:text-base">
                Para acceder al formulario del sociograma, por favor ingresa el código de tu grupo y tu matrícula.
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Código del grupo */}
              <div>
                <label 
                  htmlFor="groupCode" 
                  className="block text-[#245C52] text-lg sm:text-xl font-bold font-lato mb-2"
                >
                  Código del Grupo
                </label>
                <input
                  id="groupCode"
                  type="text"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  placeholder="Ej: 10A, 11B, 12C"
                  className="w-full px-4 py-3 text-base sm:text-lg bg-white border-2 border-[#0F7E3C]/30 rounded-lg focus:outline-none focus:border-[#0F7E3C] focus:ring-2 focus:ring-[#0F7E3C]/20 transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* Matrícula del estudiante */}
              <div>
                <label 
                  htmlFor="studentId" 
                  className="block text-[#245C52] text-lg sm:text-xl font-bold font-lato mb-2"
                >
                  Matrícula
                </label>
                <input
                  id="studentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Ej: 2021123456"
                  className="w-full px-4 py-3 text-base sm:text-lg bg-white border-2 border-[#0F7E3C]/30 rounded-lg focus:outline-none focus:border-[#0F7E3C] focus:ring-2 focus:ring-[#0F7E3C]/20 transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-red-700 text-sm sm:text-base">{error}</p>
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0F7E3C] to-[#245C52] text-white rounded-lg font-bold text-base sm:text-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Validando...
                    </span>
                  ) : (
                    'Acceder al Formulario'
                  )}
                </button>
              </div>
            </form>

            {/* Nota informativa */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-xs sm:text-sm">
                <strong>Nota:</strong> Si no conoces el código de tu grupo, consulta con tu profesor/a o tutor/a.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Universidad Tecnológica de Panamá
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Sistema de Sociograma - Análisis de Grupos
          </p>
        </div>
      </div>
    </div>
  );
};
