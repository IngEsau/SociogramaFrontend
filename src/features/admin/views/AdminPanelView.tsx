/**
 * Vista principal del panel de administracion.
 *
 * Panel informativo sin peticiones API. Muestra tarjetas resumen
 * con datos estaticos del estado general del sistema.
 * La gestion de sociogramas se realiza desde el rol Tutor.
 */

import { useEffect } from 'react';
import { Users, ClipboardList, FolderOpen, Upload, BarChart3, Shield } from 'lucide-react';
import { useTopbarStore } from '../../../store';

interface SummaryCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  color: string;
}

export function AdminPanelView() {
  const { setTopbarConfig, resetTopbar } = useTopbarStore();

  useEffect(() => {
    setTopbarConfig({
      hideDefaultSelectors: true,
      infoText: null,
    });
    return () => resetTopbar();
  }, [setTopbarConfig, resetTopbar]);

  const cards: SummaryCard[] = [
    {
      title: 'Cuestionarios',
      description: 'Cuestionarios creados y disponibles para asignar a grupos.',
      icon: <ClipboardList size={28} className="text-[#0F7E3C]" />,
      value: '--',
      color: 'border-[#0F7E3C]/30',
    },
    {
      title: 'Usuarios',
      description: 'Total de usuarios registrados en la plataforma.',
      icon: <Users size={28} className="text-[#245C52]" />,
      value: '--',
      color: 'border-[#245C52]/30',
    },
    {
      title: 'Archivos',
      description: 'Archivos de logs y reportes disponibles.',
      icon: <FolderOpen size={28} className="text-[#0F7E3C]" />,
      value: '--',
      color: 'border-[#0F7E3C]/30',
    },
    {
      title: 'Importaciones',
      description: 'Estado de las importaciones de datos academicos.',
      icon: <Upload size={28} className="text-[#245C52]" />,
      value: '--',
      color: 'border-[#245C52]/30',
    },
    {
      title: 'Estadisticas',
      description: 'Resumen de actividad y uso de la plataforma.',
      icon: <BarChart3 size={28} className="text-[#0F7E3C]" />,
      value: '--',
      color: 'border-[#0F7E3C]/30',
    },
    {
      title: 'Seguridad',
      description: 'Eventos de seguridad y accesos recientes.',
      icon: <Shield size={28} className="text-[#245C52]" />,
      value: '--',
      color: 'border-[#245C52]/30',
    },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-black tracking-tight">
          Panel de Administracion
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Vista general del sistema. Usa el menu lateral para acceder a cada modulo.
        </p>
      </div>

      {/* Grid de tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`border ${card.color} rounded-xl shadow-sm p-5 flex flex-col gap-3 bg-white hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-gray-50">
                {card.icon}
              </div>
              <span className="text-2xl font-bold text-black">{card.value}</span>
            </div>
            <div>
              <h3 className="font-semibold text-black text-[16px]">{card.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Nota informativa */}
      <div className="border border-[#0F7E3C]/20 rounded-xl bg-[#0F7E3C]/5 p-4">
        <p className="text-sm text-[#245C52]">
          Los datos en tiempo real estaran disponibles proximamente.
          La gestion de sociogramas y estadisticas se realiza desde el panel del <span className="font-semibold">Tutor</span>.
        </p>
      </div>
    </div>
  );
}

export default AdminPanelView;
