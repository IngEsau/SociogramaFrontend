/**
 * Utilidad para formateo de nombres de alumnos.
 *
 * El backend devuelve nombres en formato "Apellido1 Apellido2 Nombre(s)"
 * (ordenados alfabeticamente por apellido). Esta utilidad convierte
 * ese formato a "Nombre(s) Apellido1 Apellido2" para presentacion en UI.
 *
 * Convencion: se asume que las primeras 2 palabras son apellidos
 * y el resto es nombre(s). Si el nombre tiene 2 palabras o menos,
 * se devuelve tal cual.
 */

/**
 * Convierte "Apellido1 Apellido2 Nombre(s)" a "Nombre(s) Apellido1 Apellido2".
 *
 * Ejemplos:
 * - "García López Juan Carlos" -> "Juan Carlos García López"
 * - "Hernández Ramos María" -> "María Hernández Ramos"
 * - "Pérez Ana" -> "Pérez Ana" (no se modifica si tiene 2 palabras o menos)
 */
export function formatNombreDisplay(nombreBackend: string): string {
  if (!nombreBackend) return '';

  const partes = nombreBackend.trim().split(/\s+/);

  // Si tiene 2 palabras o menos no podemos distinguir apellidos de nombres
  if (partes.length <= 2) return nombreBackend;

  // Primeras 2 palabras = apellidos, el resto = nombre(s)
  const apellidos = partes.slice(0, 2).join(' ');
  const nombres = partes.slice(2).join(' ');

  return `${nombres} ${apellidos}`;
}
