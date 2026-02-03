/**
 * Componente de clasificación
 * Muestra el ranking de estudiantes por puntaje
 */

interface ClassificationItem {
  name: string;
  score: number;
  id?: string;
}

interface ClassificationCardProps {
  className?: string;
  title?: string;
  subtitle?: string;
  items?: ClassificationItem[];
}

const defaultItems: ClassificationItem[] = [
  { name: "Jesús Ortega Luna", score: 147 },
  { name: "Francisco Martínez Martínez", score: 142 },
  { name: "Julieta Tórrez Pérez", score: 133 },
  { name: "Miranda Morales Morales", score: 121 },
  { name: "Estef Nivarna de Jesús", score: 109 },
  { name: "Juan Hernández López", score: 95 },
  { name: "María García Martínez", score: 94 },
];

export function ClassificationCard({
  className = "",
  title = "Clasificación",
  subtitle = "1. ¿A quién elegirías para...?",
  items = defaultItems,
}: ClassificationCardProps) {
  return (
    <div className={`bg-white border border-emerald-600/35 rounded-xl shadow-sm p-5 flex flex-col ${className}`}>
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-green-700 font-semibold">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <button className="text-green-700 text-lg leading-none">≡</button>
      </div>

      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span className="font-semibold text-gray-700">Nombre completo</span>
        <span className="font-semibold text-gray-700">Puntaje</span>
      </div>

      <ul className="mt-2 space-y-3 overflow-auto pr-1 flex-1 min-h-0">
        {items.map((r, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <div className="truncate max-w-[230px]">
              <span className="text-gray-500 mr-2">{i + 1}.</span>
              <span className="font-medium text-gray-800">{r.name}</span>
              {r.id && <div className="text-xs text-gray-400">{r.id}</div>}
            </div>
            <span className="text-gray-500">{r.score} pts</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
