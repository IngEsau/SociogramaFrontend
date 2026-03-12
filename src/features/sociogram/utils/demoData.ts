/**
 * Datos demo para validar el mapeo visual del sociograma cuando no hay datos reales.
 */

import type {
  EstadisticasResponse,
  SociogramConexion,
  SociogramGrupoEstadisticas,
  SociogramNodo,
} from '../types';

function createDemoNodos(): SociogramNodo[] {
  const aceptados = new Set([3, 4, 5, 6, 7, 8, 11, 13, 14, 15, 19]);
  const rechazados = new Set([2, 10, 12, 18, 21]);
  const invisibles = new Set([1, 9, 16, 17, 20]);

  const impactoMap: Record<number, number> = {
    1: 4,
    2: 30,
    3: 16,
    4: 48,
    5: 15,
    6: 18,
    7: 34,
    8: 14,
    9: 4,
    10: 28,
    11: 17,
    12: 26,
    13: 12,
    14: 29,
    15: 33,
    16: 5,
    17: 5,
    18: 22,
    19: 21,
    20: 6,
    21: 20,
  };

  const positivosMap: Record<number, number> = {
    2: 8,
    3: 10,
    4: 24,
    5: 9,
    6: 10,
    7: 16,
    8: 7,
    10: 6,
    11: 11,
    12: 5,
    13: 8,
    14: 16,
    15: 18,
    18: 4,
    19: 12,
    21: 6,
  };

  const negativosMap: Record<number, number> = {
    2: 22,
    3: 6,
    4: 24,
    5: 6,
    6: 8,
    7: 18,
    8: 7,
    10: 22,
    11: 6,
    12: 21,
    13: 4,
    14: 13,
    15: 15,
    18: 18,
    19: 9,
    21: 14,
  };

  const nodos: SociogramNodo[] = [];

  for (let id = 1; id <= 21; id += 1) {
    const impacto = impactoMap[id] ?? 3;
    const positivos = positivosMap[id] ?? Math.max(0, Math.round(impacto * 0.6));
    const negativos = negativosMap[id] ?? Math.max(0, impacto - positivos);

    const tipo = aceptados.has(id)
      ? 'ACEPTADO'
      : rechazados.has(id)
        ? 'RECHAZADO'
        : invisibles.has(id)
          ? 'INVISIBLE'
          : 'ACEPTADO';

    nodos.push({
      alumno_id: id,
      numero_lista: id,
      matricula: `UTP${String(id).padStart(5, '0')}`,
      nombre: `Alumno ${id}`,
      tipo,
      puntos_positivos: positivos,
      puntos_negativos: negativos,
      impacto_total: impacto,
      tamano: impacto,
      elecciones_recibidas: Math.max(1, Math.round(impacto / 3)),
      elecciones_realizadas: Math.max(1, Math.round(impacto / 4)),
      completo: id % 5 !== 0,
    });
  }

  return nodos;
}

function createConexion(
  origin: number,
  target: number,
  peso: number,
  polaridad: 'POSITIVA' | 'NEGATIVA',
  nameById: Map<number, string>
): SociogramConexion {
  return {
    origen_id: origin,
    origen_nombre: nameById.get(origin) ?? `Alumno ${origin}`,
    destino_id: target,
    destino_nombre: nameById.get(target) ?? `Alumno ${target}`,
    peso,
    tipo_conexion: peso >= 4 ? 'fuerte' : peso >= 2 ? 'media' : 'debil',
    porcentaje_mutuo: peso * 2.5,
    es_mutua: false,
    polaridad,
    orden_eleccion: 1,
  };
}

function createDemoConexiones(nodos: SociogramNodo[]): SociogramConexion[] {
  const nameById = new Map<number, string>(nodos.map((nodo) => [nodo.alumno_id, nodo.nombre]));

  const conexiones: SociogramConexion[] = [
    createConexion(4, 7, 5, 'POSITIVA', nameById),
    createConexion(7, 4, 4, 'POSITIVA', nameById),
    createConexion(4, 6, 4, 'POSITIVA', nameById),
    createConexion(6, 7, 3, 'POSITIVA', nameById),
    createConexion(4, 13, 3, 'POSITIVA', nameById),
    createConexion(13, 12, 3, 'NEGATIVA', nameById),
    createConexion(12, 5, 2, 'NEGATIVA', nameById),
    createConexion(5, 4, 3, 'POSITIVA', nameById),
    createConexion(5, 6, 2, 'POSITIVA', nameById),
    createConexion(6, 12, 3, 'NEGATIVA', nameById),
    createConexion(4, 11, 4, 'POSITIVA', nameById),
    createConexion(11, 3, 2, 'POSITIVA', nameById),
    createConexion(3, 4, 2, 'POSITIVA', nameById),
    createConexion(3, 13, 2, 'POSITIVA', nameById),
    createConexion(11, 15, 3, 'POSITIVA', nameById),
    createConexion(15, 4, 4, 'POSITIVA', nameById),
    createConexion(15, 10, 3, 'NEGATIVA', nameById),
    createConexion(10, 18, 3, 'NEGATIVA', nameById),
    createConexion(18, 2, 4, 'NEGATIVA', nameById),
    createConexion(19, 2, 2, 'POSITIVA', nameById),
    createConexion(15, 19, 3, 'POSITIVA', nameById),
    createConexion(2, 21, 3, 'NEGATIVA', nameById),
    createConexion(21, 14, 3, 'NEGATIVA', nameById),
    createConexion(14, 8, 3, 'POSITIVA', nameById),
    createConexion(8, 2, 2, 'POSITIVA', nameById),
    createConexion(14, 4, 3, 'POSITIVA', nameById),
    createConexion(14, 7, 2, 'POSITIVA', nameById),
    createConexion(7, 5, 2, 'POSITIVA', nameById),
    createConexion(13, 5, 2, 'POSITIVA', nameById),
    createConexion(2, 15, 2, 'NEGATIVA', nameById),
    createConexion(10, 1, 1, 'NEGATIVA', nameById),
    createConexion(17, 10, 1, 'NEGATIVA', nameById),
    createConexion(20, 4, 1, 'POSITIVA', nameById),
    createConexion(16, 21, 1, 'NEGATIVA', nameById),
    createConexion(9, 14, 1, 'NEGATIVA', nameById),
  ];

  const keys = new Set(conexiones.map((c) => `${c.origen_id}-${c.destino_id}-${c.polaridad}`));
  conexiones.forEach((conexion) => {
    const reverseKey = `${conexion.destino_id}-${conexion.origen_id}-${conexion.polaridad}`;
    conexion.es_mutua = keys.has(reverseKey);
  });

  return conexiones;
}

export function createDemoSociogramGrupo(): SociogramGrupoEstadisticas {
  const nodos = createDemoNodos();
  const conexiones = createDemoConexiones(nodos);
  return {
    grupo_id: 9001,
    grupo_clave: 'DEMO-5A',
    total_alumnos: nodos.length,
    respuestas_completas: 17,
    nodos,
    conexiones,
  };
}

export function createDemoEstadisticasResponse(
  cuestionarioId: number,
  cuestionarioTitulo = 'Sociograma Demo'
): EstadisticasResponse {
  const grupo = createDemoSociogramGrupo();
  return {
    cuestionario_id: cuestionarioId,
    cuestionario_titulo: cuestionarioTitulo,
    total_grupos: 1,
    grupos: [grupo],
  };
}

