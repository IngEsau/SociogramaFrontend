import { useAuthStore } from '../../../store';

export default function NoTutorAccessView() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-lg w-full text-center">
        <div className="opacity-60 mb-6">
          {/* rplace to <img /> UTP PET */}
          <div className="w-40 h-40 mx-auto rounded-full bg-black/5" />
        </div>

        <p className="text-[#245C52] text-base">
          ¡No tienes un rol de tutor asignado! Si crees que se trata de un error ponte en contacto con el administrador
        </p>

        <div className="mt-6">
          <button
            onClick={() => logout()}
            className="bg-[#0F7E3C] text-white px-6 py-3 rounded-lg font-medium"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
