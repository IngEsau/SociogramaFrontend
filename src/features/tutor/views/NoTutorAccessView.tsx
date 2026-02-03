/**
 * Vista cuando un docente no tiene acceso de tutor
 * 
 * Se muestra cuando el usuario es DOCENTE pero no tiene el rol de tutor asignado.
 */

import { useAuthStore } from '../../../store';

export function NoTutorAccessView() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-lg w-full text-center">
        <div className="opacity-60 mb-6">
          {/* Placeholder para logo UTP */}
          <div className="w-40 h-40 mx-auto rounded-full bg-black/5 flex items-center justify-center">
            <span className="text-4xl text-gray-300">🎓</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-[#313131] mb-4">
          Acceso restringido
        </h2>

        <p className="text-[#245C52] text-base mb-6">
          ¡No tienes un rol de tutor asignado! Si crees que se trata de un error,
          ponte en contacto con el administrador.
        </p>

        <button
          onClick={() => logout()}
          className="bg-[#0F7E3C] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default NoTutorAccessView;
