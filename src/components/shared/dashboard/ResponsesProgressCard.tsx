/**
 * Card de progreso de respuestas.
 */

interface ResponsesProgressCardProps {
  total?: number;
  completed?: number;
  className?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ResponsesProgressCard({
  total = 0,
  completed = 0,
  className = '',
}: ResponsesProgressCardProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const safePercentage = clamp(percentage, 0, 100);
  const progressAngle = safePercentage * 3.6;

  return (
    <div className={`rounded-xl border border-emerald-600/35 bg-white p-4 shadow-sm ${className}`}>
      <div>
        <h3 className="text-3xl leading-tight font-semibold text-green-700">Total de respuestas</h3>
        <p className="mt-1 text-sm text-gray-500">{completed} respuestas</p>
      </div>

      <div className="mt-4 flex justify-center pb-2">
        <div
          className="relative h-36 w-36 rounded-full p-3"
          style={{
            background: `conic-gradient(#9f2e17 ${progressAngle}deg, #ead9d7 ${progressAngle}deg 360deg)`,
          }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full border border-[#ead9d7] bg-[#f7f3f2]">
            <div className="text-center">
              <p className="text-4xl font-bold text-[#222]">{safePercentage}%</p>
              <p className="text-sm text-gray-600">Progreso</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

