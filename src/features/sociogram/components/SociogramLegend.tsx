/**
 * Leyenda del sociograma
 * 
 * Muestra la interpretación de colores y símbolos del grafo
 */

interface SociogramLegendProps {
  className?: string;
  showElecciones?: boolean;
  showRechazos?: boolean;
}

export function SociogramLegend({
  className = '',
  showElecciones = true,
  showRechazos = true,
}: SociogramLegendProps) {
  return (
    <div className={`bg-white rounded-xl border border-emerald-600/35 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Leyenda</h3>
      
      {/* Tipos de nodos */}
      <div className="space-y-2 mb-4">
        <p className="text-xs text-gray-500 font-medium">Tipos de nodo</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Líder</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Popular</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-500"></span>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Aislado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>Rechazado</span>
          </div>
        </div>
      </div>

      {/* Tipos de conexiones */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">Conexiones</p>
        <div className="space-y-1 text-xs">
          {showElecciones && (
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-green-500"></span>
              <span>Elección</span>
            </div>
          )}
          {showRechazos && (
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-red-500 border-dashed"></span>
              <span>Rechazo</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-6 h-1 bg-blue-500"></span>
            <span>Recíproco</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SociogramLegend;
