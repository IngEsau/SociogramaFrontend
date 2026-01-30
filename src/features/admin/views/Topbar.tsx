import { useEffect, useMemo, useState } from "react";
import { Download, Menu } from "lucide-react";

import { useAuthStore } from "../../../features/auth/store/auth.store";
import { academicService } from "../../../services/academic.service";
import type { MyGroup } from "../../../services/academic.service";

type TopbarProps = {
  onMenuClick: () => void;
  selectedGroupId: string | null;
  onGroupChange: (groupId: string | null) => void;
};

export default function Topbar({
  onMenuClick,
  selectedGroupId,
  onGroupChange,
}: TopbarProps) {
  const me = useAuthStore((s) => s.me);

  const fullName = useMemo(() => {
    const first = me?.user?.first_name?.trim();
    const fallback = "Usuario";
    return [first].filter(Boolean).join(" ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || fallback;
  }, [me]);

  const role = me?.user?.rol;

  const [groups, setGroups] = useState<Array<MyGroup & { label?: string }>>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadGroups() {    
      setGroups([]);
      onGroupChange(null);
      
      const alumnoGroup = (me as any)?.alumno?.grupo;
      if (role === "ALUMNO" && alumnoGroup) {
        const g = {
          id: alumnoGroup.id ?? "alumno-group",
          nombre: alumnoGroup.nombre,
          clave: alumnoGroup.clave,
          grado: alumnoGroup.grado,
          grupo: alumnoGroup.grupo,
          label:
            alumnoGroup.nombre ||
            alumnoGroup.clave ||
            (alumnoGroup.grado && alumnoGroup.grupo
              ? `${alumnoGroup.grado}°${alumnoGroup.grupo}`
              : "Mi grupo"),
        };
        if (alive) {
          setGroups([g]);
          onGroupChange(String(g.id));
        }
        return;
      }
      
      if (role === "DOCENTE") {
        setLoadingGroups(true);
        try {
          const data = await academicService.myGroups();
          if (!alive) return;

          setGroups(data);

          if (data.length > 0) onGroupChange(String(data[0].id));
        } catch {
          if (!alive) return;
          setGroups([]);
          onGroupChange(null);
        } finally {
          if (alive) setLoadingGroups(false);
        }
        return;
      }

      if (alive) {
        setGroups([{ id: "ALL", label: "Todos los grupos" } as any]);
        onGroupChange("ALL");
      }
    }

    loadGroups();
    return () => {
      alive = false;
    };
  }, [role, me, onGroupChange]);

  return (
    <header className="bg-white border-b border-black/5 px-4 md:px-6 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between md:justify-start md:gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md border border-black/10 hover:bg-black/5"
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>

            <h1 className="text-xl md:text-2xl font-bold text-[#0B5A4A]">
              Hola <span className="text-black">{fullName}!</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-700">GRUPO:</span>

            <select
              className="border rounded-md px-2 py-1 bg-white min-w-[120px]"
              value={selectedGroupId ?? ""}
              onChange={(e) => onGroupChange(e.target.value || null)}
              disabled={loadingGroups}
            >
              {loadingGroups && <option value="">Cargando…</option>}
              {!loadingGroups && groups.length === 0 && (
                <option value="">Sin grupos</option>
              )}
              {!loadingGroups &&
                groups.map((g) => (
                  <option key={String(g.id)} value={String(g.id)}>
                    {(g as any).label || g.nombre || g.clave || `Grupo ${g.id}`}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">          
          <select className="flex-1 border rounded-md px-3 py-2 text-sm bg-white">
            <option>Último sociograma realizado: (pendiente)</option>
          </select>

          <button className="hidden md:flex bg-[#0B5A4A] text-white px-4 py-2 rounded-md text-sm font-medium items-center gap-2 hover:opacity-90">
            Exportar <Download size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
