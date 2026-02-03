import { Download, Menu } from "lucide-react";
import { useAuthStore } from "../../store";

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.nombre_completo?.split(' ')[0] || 'Usuario';

  return (
    <header className="bg-white border-b border-black/5 px-4 md:px-6 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between md:justify-start md:gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md border border-black/10 hover:bg-black/5"
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>

            <h1 className="text-xl md:text-2xl font-bold text-[#0B5A4A]">
              Hola <span className="text-black">{firstName}!</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-700">GRUPO:</span>
            <select className="border rounded-md px-2 py-1 bg-white">
              <option>No hay grupos</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select className="flex-1 border rounded-md px-3 py-2 text-sm bg-white">
            <option>Último sociograma realizado: (pendiente)</option>
          </select>
          
          <button className="hidden md:flex bg-[#0B5A4A] text-white px-4 py-2 rounded-md text-sm font-medium items-center gap-2 hover:opacity-90">
            Exportar <Download size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}