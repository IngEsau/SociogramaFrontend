/**
 * Servicio Académico
 * Endpoints: /api/academic/
 */

import {api} from "../core/api/axios";

export type MyGroup = {
  id: number | string;
  nombre?: string;
  clave?: string;
  grado?: number | string;
  grupo?: string;
};

function groupLabel(g: MyGroup) {
  return (
    g.nombre ||
    g.clave ||
    (g.grado && g.grupo ? `${g.grado}°${g.grupo}` : undefined) ||
    `Grupo ${g.id}`
  );
}

export const academicService = {
  async myGroups(): Promise<Array<MyGroup & { label: string }>> {
    const { data } = await api.get<MyGroup[]>("/academic/my-groups/");
    const arr = Array.isArray(data) ? data : [];
    console.log(data);
    return arr.map((g) => ({ ...g, label: groupLabel(g) }));
  },
};
