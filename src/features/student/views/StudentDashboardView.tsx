/**
 * Vista del Dashboard de Estudiante
 * 
 * Esta es la vista principal para usuarios con rol ALUMNO.
 * Muestra encuestas pendientes y estado de las respuestas.
 */

import { useAuthStore } from '../../../store';

export function StudentDashboardView() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header de bienvenida */}
        <div className="bg-white border border-emerald-600/35 rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-semibold text-[#0F7E3C] mb-2">
            ¡Bienvenido, {user?.first_name || 'Estudiante'}!
          </h1>
          <p className="text-gray-600">
            Aquí podrás ver y responder las encuestas sociométricas asignadas.
          </p>
        </div>

        {/* Estado de encuestas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Encuestas pendientes */}
          <div className="bg-white border border-emerald-600/35 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F7E3C] mb-4">
              Encuestas Pendientes
            </h2>
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <p>No tienes encuestas pendientes</p>
            </div>
          </div>

          {/* Encuestas completadas */}
          <div className="bg-white border border-emerald-600/35 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#0F7E3C] mb-4">
              Encuestas Completadas
            </h2>
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">✅</div>
              <p>Aún no has completado ninguna encuesta</p>
            </div>
          </div>
        </div>

        {/* Información del estudiante */}
        <div className="bg-white border border-emerald-600/35 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#0F7E3C] mb-4">
            Tu Información
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Nombre:</span>
              <p className="font-medium text-[#313131]">
                {user?.nombre_completo || `${user?.first_name} ${user?.last_name}`}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Correo:</span>
              <p className="font-medium text-[#313131]">{user?.email}</p>
            </div>
            {user?.alumno && (
              <>
                <div>
                  <span className="text-gray-500">Matrícula:</span>
                  <p className="font-medium text-[#313131]">{user.alumno.matricula}</p>
                </div>
                <div>
                  <span className="text-gray-500">Programa:</span>
                  <p className="font-medium text-[#313131]">{user.alumno.programa}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboardView;
