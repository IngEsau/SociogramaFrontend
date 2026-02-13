/**
 * Vista Hub de Importación - Admin
 *
 * Punto de entrada para las distintas opciones de importación de datos.
 * Desde aquí el administrador elige qué tipo de importación realizar.
 */

import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Users, GraduationCap, FileText } from 'lucide-react';

interface ImportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  recommended?: boolean;
}

const MAIN_OPTION: ImportOption = {
  id: 'excel',
  title: 'Importar desde Excel',
  description:
    'Carga completa a partir del archivo Excel de Rosalba. Se validan los 4 libros requeridos (relacion, inscritos, alumnos y grupos), se selecciona el periodo y se muestra una vista previa antes de ejecutar la importación.',
  icon: <FileSpreadsheet size={28} />,
  route: '/admin/import/excel',
  recommended: true,
};

const SECONDARY_OPTIONS: ImportOption[] = [
  {
    id: 'csv',
    title: 'CSV general',
    description:
      'Carga masiva con formato CSV estándar.',
    icon: <FileText size={28} />,
    route: '/admin/import/csv',
  },
  {
    id: 'docentes',
    title: 'Docentes',
    description:
      'Importar listado de docentes/tutores desde CSV.',
    icon: <Users size={28} />,
    route: '/admin/import/docentes',
  },
  {
    id: 'alumnos',
    title: 'Alumnos',
    description:
      'Importar listado de alumnos desde CSV.',
    icon: <GraduationCap size={28} />,
    route: '/admin/import/alumnos',
  },
];

export function AdminImportHubView() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#313131]">
          Importar datos
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona el tipo de importación que deseas realizar
        </p>
      </div>

      {/* Opción principal: Excel */}
      <button
        onClick={() => navigate(MAIN_OPTION.route)}
        className="relative w-full bg-white border-2 border-[#0B5A4A]/20 rounded-xl p-6 text-left
          hover:border-[#0B5A4A]/50 hover:shadow-md transition-all duration-200 group"
      >
        <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wide bg-[#0B5A4A] text-white px-2 py-0.5 rounded-full">
          Recomendado
        </span>

        <div className="flex items-start gap-4">
          <div className="shrink-0 w-14 h-14 rounded-lg bg-[#0B5A4A]/10 text-[#0B5A4A] flex items-center justify-center group-hover:bg-[#0B5A4A] group-hover:text-white transition-colors duration-200">
            {MAIN_OPTION.icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-[#313131] group-hover:text-[#0B5A4A] transition-colors">
              {MAIN_OPTION.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed max-w-xl">
              {MAIN_OPTION.description}
            </p>
          </div>
        </div>
      </button>

      {/* Opciones secundarias: CSV */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Importaciones secundarias
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SECONDARY_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => navigate(option.route)}
              className="bg-white border border-gray-200 rounded-xl p-4 text-left
                hover:border-[#0B5A4A]/30 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-[#0B5A4A]/10 group-hover:text-[#0B5A4A] transition-colors duration-200">
                  {option.icon}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#313131] group-hover:text-[#0B5A4A] transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
