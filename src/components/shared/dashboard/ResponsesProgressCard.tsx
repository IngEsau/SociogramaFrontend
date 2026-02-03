/**
 * Componente de progreso de respuestas
 * Muestra el progreso total de respuestas recibidas
 */

interface ResponsesProgressCardProps {
  total?: number;
  completed?: number;
}

export function ResponsesProgressCard({ total = 0, completed = 0 }: ResponsesProgressCardProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white border border-emerald-600/35 rounded-xl shadow-sm p-4">
      <div className="mb-2">
        <h3 className="text-green-700 font-semibold">Total de respuestas</h3>
        <p className="text-xs text-gray-400">{completed} respuestas</p>
      </div>
      <div className="flex justify-center py-2">
        <div className="w-24 h-24 rounded-full border-8 border-gray-200 relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-base font-bold text-gray-800">{percentage}%</div>
            <div className="text-xs text-gray-500">Progreso</div>
          </div>
        </div>
      </div>
    </div>
  );
}
