/**
 * Componente de registro de actividades
 * Muestra las actividades recientes de los usuarios
 */

interface ActivityItem {
  name: string;
  action: string;
  time: string;
}

interface ActivityLogCardProps {
  items?: ActivityItem[];
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

export function ActivityLogCard({ items = defaultItems }: ActivityLogCardProps) {
  return (
    <div className="bg-white border border-emerald-600/35 rounded-xl shadow-sm p-5">
      <h2 className="text-green-700 font-semibold text-lg mb-3">
        Registro de actividades
      </h2>

      <ul className="space-y-2 text-sm text-gray-700">
        {items.map((it, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="text-gray-400">•</span>
            <div>
              <span className="font-semibold">{it.name}</span> {it.action}{" "}
              <span className="text-gray-400">{it.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
