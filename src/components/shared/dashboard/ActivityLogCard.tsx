/**
 * Componente de registro de actividades
 * Muestra las actividades recientes de los usuarios
 */

interface ActivityItem {
  name: string;
  action: string;
  time?: string;
  startDate?: string;
  endDate?: string;
  approxMinutes?: number | null;
}

interface ActivityLogCardProps {
  items?: ActivityItem[];
  emptyMessage?: string;
}

const defaultItems: ActivityItem[] = [
  {
    name: "Carlos Rodríguez Sánchez",
    action: "ha comenzado a realizar el formulario.",
    time: "17:02:02 a 28 del Agosto del 2025",
  },
  {
    name: "Juan Hernández López",
    action: "ha comenzado a realizar el formulario.",
    time: "17:02:27 a 28 del Agosto del 2025",
  },
  {
    name: "Isabel Jiménez Soto",
    action: "ha finalizado el formulario.",
    time: "17:02:54 a 28 del Agosto del 2025",
  },
  {
    name: "Elena Vargas Reyes",
    action: "ha comenzado a realizar el formulario.",
    time: "17:03:05 a 28 del Agosto del 2025",
  },
  {
    name: "Patricia Serrano Delgado",
    action: "ha finalizado el formulario.",
    time: "17:04:03 a 28 del Agosto del 2025",
  },
];

export function ActivityLogCard({
  items = defaultItems,
  emptyMessage = 'Sin actividad registrada todavía.',
}: ActivityLogCardProps) {
  return (
    <div className="bg-white border border-emerald-600/35 rounded-xl shadow-sm p-5">
      <h2 className="text-green-700 font-semibold text-lg mb-3">
        Registro de actividades
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2 text-sm text-gray-700">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-gray-400">•</span>
              <div className="min-w-0">
                <span className="font-semibold">{it.name}</span> {it.action}{' '}
                {it.time && <span className="text-gray-400">{it.time}</span>}

                {(it.startDate || it.endDate || typeof it.approxMinutes === 'number') && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {it.startDate && (
                      <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5">
                        Fecha inicio: {it.startDate}
                      </span>
                    )}
                    {it.endDate && (
                      <span className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5">
                        Fecha fin: {it.endDate}
                      </span>
                    )}
                    {typeof it.approxMinutes === 'number' && (
                      <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5">
                        ~{it.approxMinutes} min aprox
                      </span>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
