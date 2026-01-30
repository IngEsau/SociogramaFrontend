import React from "react";
import {
  LayoutDashboard,
  Folder,
  PlusSquare,
  Upload,
  ClipboardList,
  Settings,
  LogOut,
  X,
} from "lucide-react";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
    bg-[#0B5A4A] text-white
    h-full overflow-y-auto
    fixed inset-y-0 left-0 z-50
    transform transition-transform duration-200
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    md:static md:translate-x-0
    w-64 flex flex-col
  `}
      >
        <div className="relative px-4 pt-4 pb-3">
          <button
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 p-2 rounded-md hover:bg-white/10"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 mt-6">
            <div className="w-12 h-12 rounded-full bg-white/90 shrink-0" />
            <div className="leading-tight">
              <div className="font-semibold">Administrador</div>
              <div className="text-xs text-white/80">Sociograma UTP</div>
            </div>
          </div>
        </div>

        <Divider />

        {/* NAVBAR */}
        <nav className="px-2 py-2 flex flex-col gap-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Panel" />
          <NavItem icon={<Folder size={20} />} label="Archivos" />
          <NavItem icon={<PlusSquare size={20} />} label="Crear" />
          <NavItem icon={<Upload size={20} />} label="Importar datos" />
          <NavItem icon={<ClipboardList size={20} />} label="Actividad" />
        </nav>

        <Divider />

        <div className="px-2 py-2 flex flex-col gap-1">
          <NavItem icon={<Settings size={20} />} label="Configuración" />
          <NavItem icon={<LogOut size={20} />} label="Salir" />
        </div>


        <div className="flex-1" />
        <div className="h-3 md:h-4" />
      </aside>
    </>
  );
}

function NavItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/10 text-left"
      aria-label={label}
      title={label}
      type="button"
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}


function Divider() {
  return <div className="mx-4 h-px bg-white/20" />;
}