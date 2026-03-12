import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Folder,
  PlusSquare,
  Upload,
  ClipboardList,
  Settings,
  LogOut,
  X,
  Library,
} from "lucide-react";
import { useAuthStore } from "../../store";
import { ConfirmDialog } from "../../components/ui";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Obtener el rol para mostrarlo en el sidebar
  const userRole = user?.rol || 'USUARIO';

  // Determinar la ruta base según el rol
  const getBasePath = () => {
    switch (userRole) {
      case 'ADMIN':
        return '/admin';
      case 'DOCENTE':
        return '/tutor';
      case 'ALUMNO':
        return '/student';
      case 'COMITE':
        return '/committee';
      default:
        return '/';
    }
  };

  const basePath = getBasePath();
  const settingsPath = basePath === '/' ? '/login' : `${basePath}/settings`;

  const handleLogout = async () => {
    await logout();
  };

  const handleLogoutRequest = () => {
    setConfirmOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setConfirmOpen(false);
    await handleLogout();
  };

  const handleLogoutCancel = () => {
    setConfirmOpen(false);
  };

  const getNavItems = () => {
    const commonItems = [
      { icon: <LayoutDashboard size={20} />, label: 'Panel', to: basePath },
    ];

    if (userRole === 'ADMIN') {
      return [
        ...commonItems,
        { icon: <PlusSquare size={20} />, label: 'Cuestionarios', to: `${basePath}/cuestionarios` },
        { icon: <Library size={20} />, label: 'Banco de preguntas', to: `${basePath}/cuestionarios/banco` },
        { icon: <Folder size={20} />, label: 'Archivos', to: `${basePath}/archivos` },
        { icon: <Upload size={20} />, label: 'Importar datos', to: `${basePath}/import` },
        { icon: <ClipboardList size={20} />, label: 'Registro', to: `${basePath}/logs` },
      ];
    }

    if (userRole === 'DOCENTE') {
      return [
        ...commonItems,
        { icon: <ClipboardList size={20} />, label: 'Actividad', to: `${basePath}/activity` },
        { icon: <Folder size={20} />, label: 'Archivos', to: `${basePath}/archivos` },
      ];
    }

    if (userRole === 'COMITE') {
      return [
        ...commonItems,
        { icon: <ClipboardList size={20} />, label: 'Cuestionarios', to: `${basePath}/cuestionarios` },
        { icon: <Library size={20} />, label: 'Grafo global', to: `${basePath}/grafo-global` },
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

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
            <img 
              src="/Logo_Comite.svg" 
              alt="Logo Comité" 
              className="w-12 h-12 rounded-full bg-white/90 shrink-0 object-contain p-1"
            />
            <div className="leading-tight">
              <div className="font-semibold">Comité</div>
              <div className="text-xs text-white/80">Sociograma UTP</div>
            </div>
          </div>

          <div className="mt-4 text-xs font-semibold tracking-wide text-white/90">
            {userRole}
          </div>
        </div>

        <Divider />

        {/* NAVBAR */}
        <nav className="px-2 py-2 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={location.pathname === item.to}
              onClick={onClose}
            />
          ))}
        </nav>

        <Divider />

        <div className="px-2 py-2 flex flex-col gap-1">
          <NavItem
            icon={<Settings size={20} />}
            label="Configuración"
            to={settingsPath}
            isActive={location.pathname === settingsPath}
            onClick={onClose}
          />
          <NavItemButton 
            icon={<LogOut size={20} />} 
            label="Salir" 
            onClick={handleLogoutRequest}
            isLogout
          />
        </div>

        <div className="flex-1" />
        <div className="h-3 md:h-4" />
      </aside>

      <ConfirmDialog
        open={confirmOpen}
        title="Cerrar sesion"
        description="¿Estas seguro de que deseas cerrar sesion? Se cerrara tu sesion actual y tendras que volver a iniciar sesion para acceder al sistema."
        confirmLabel="Cerrar sesion"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}

function NavItem({ 
  icon, 
  label, 
  to,
  isActive,
  onClick
}: { 
  icon: React.ReactNode; 
  label: string;
  to: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-colors ${
        isActive 
          ? 'bg-white/20 font-semibold' 
          : 'hover:bg-white/10'
      }`}
      aria-label={label}
      title={label}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

function NavItemButton({ 
  icon, 
  label, 
  onClick,
  isLogout,
}: { 
  icon: React.ReactNode; 
  label: string;
  onClick?: () => void;
  isLogout?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        group w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left
        transition-colors duration-150
        ${isLogout
          ? 'hover:bg-red-600/20 hover:text-red-300'
          : 'hover:bg-white/10'
        }
      `}
      aria-label={label}
      title={label}
      type="button"
    >
      <span className={`shrink-0 transition-transform duration-200 ${isLogout ? 'group-hover:translate-x-0.5' : ''}`}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="mx-4 h-px bg-white/20" />;
}
