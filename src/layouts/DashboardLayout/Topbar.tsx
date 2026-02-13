import { Download, Menu, ChevronDown } from "lucide-react";
import { useAuthStore, useTopbarStore } from "../../store";

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.nombre_completo?.split(' ')[0] || 'Usuario';

  const { actions, hideDefaultSelectors, infoText, customContent } = useTopbarStore();
  const hasCustomContent = customContent !== null;
  const hasCustomActions = actions.length > 0 || infoText;

  return (
    <header className="bg-white border-b border-black/5 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Saludo y Menú hamburguesa */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md border border-black/10 hover:bg-black/5 shrink-0"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>

          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B5A4A] truncate">
            Hola <span className="text-black">{firstName}!</span>
          </h1>
        </div>

        {/* Zona derecha: contenido dinámico o default */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
          {hasCustomContent ? (
            <>{customContent}</>
          ) : hasCustomActions ? (
            <>
              {/* Texto informativo (ej: "Último registro: ...") */}
              {infoText && (
                <div className="flex items-center gap-2 border border-[#0F7E3C]/50 rounded-lg px-3 py-1.5 sm:py-2 shadow-sm bg-white">
                  <span className="text-xs sm:text-sm font-bold text-black whitespace-nowrap">
                    {infoText}
                  </span>
                  <ChevronDown size={16} className="text-black/60 shrink-0" />
                </div>
              )}

              {/* Botones de acción personalizados */}
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`hidden md:flex shrink-0 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-bold
                    items-center gap-2 whitespace-nowrap transition-colors shadow-sm
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${action.variant === 'outline'
                      ? 'bg-white border border-[#0F7E3C]/50 text-black hover:bg-gray-50'
                      : 'bg-[#0F7E3C] border border-[#0F7E3C]/50 text-white hover:bg-[#0a6630]'
                    }`}
                >
                  {action.icon === 'download' || action.icon === 'export' ? (
                    <Download size={16} />
                  ) : null}
                  {action.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {/* Selectores por defecto */}
              {!hideDefaultSelectors && (
                <>
                  <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                    <span className="font-medium text-gray-700 shrink-0">GRUPO:</span>
                    <select className="border rounded-md px-2 py-1.5 bg-white text-xs sm:text-sm min-w-0 flex-1 sm:flex-initial">
                      <option>No hay grupos</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <select className="flex-1 border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white truncate">
                      <option>Último sociograma realizado: (pendiente)</option>
                    </select>

                    <button className="hidden md:flex shrink-0 bg-[#0B5A4A] text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-md text-xs lg:text-sm font-medium items-center gap-2 hover:opacity-90 whitespace-nowrap">
                      Exportar <Download size={16} />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}