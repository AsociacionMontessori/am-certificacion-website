/**
 * Formato y búsqueda de calificaciones, compartido entre la gestión de
 * materias y la de calificaciones.
 *
 * En este portal la calificación también dice en qué va la materia: 0 es
 * "Por cursar" y 1 es "Cursando". Cualquier otro número es la nota real.
 */

export const CALIFICACION_POR_CURSAR = 0;
export const CALIFICACION_CURSANDO = 1;

export const normalizarTexto = (valor) => (valor || '').toString().trim().toLowerCase();

export const formatearValorCalificacion = (valor) => {
  const numero = Number(valor);
  if (valor === null || valor === undefined || valor === '' || Number.isNaN(numero)) {
    return 'N/A';
  }
  if (numero === CALIFICACION_POR_CURSAR) {
    return 'Por cursar';
  }
  if (numero === CALIFICACION_CURSANDO) {
    return 'Cursando';
  }
  return numero;
};

export const obtenerColorCalificacion = (calificacion) => {
  const numero = Number(calificacion);
  if (Number.isNaN(numero)) return 'text-gray-500';
  if (numero === CALIFICACION_POR_CURSAR) return 'text-gray-500';
  if (numero === CALIFICACION_CURSANDO) return 'text-blue';
  if (numero >= 9) return 'text-green';
  if (numero >= 8) return 'text-blue';
  if (numero >= 7) return 'text-yellow';
  return 'text-red';
};

/**
 * ¿Este registro (materia o calificación) corresponde a esa materia y nivel?
 *
 * Materias y calificaciones son colecciones distintas unidas por el nombre de
 * la materia, así que la comparación es por nombre normalizado y, cuando hay
 * datos de nivel en ambos lados, también por nivel.
 */
export const coincideConMateria = (registro, { nombre, nivelId, nivelNombre }) => {
  const nombreRegistro = normalizarTexto(registro?.materia || registro?.nombre);
  if (!nombreRegistro || nombreRegistro !== normalizarTexto(nombre)) {
    return false;
  }

  const nivelIdRegistro = registro?.nivelId || registro?.nivelActualId || null;
  if (nivelId && nivelIdRegistro) {
    return nivelIdRegistro === nivelId;
  }
  if (nivelId && !nivelIdRegistro) {
    return false;
  }

  const nivelNombreRegistro = normalizarTexto(registro?.nivelNombre || registro?.nivel);
  const nivelNombreBuscado = normalizarTexto(nivelNombre);
  if (nivelNombreBuscado && nivelNombreRegistro) {
    return nivelNombreRegistro === nivelNombreBuscado;
  }
  if (nivelNombreBuscado && !nivelNombreRegistro) {
    return false;
  }

  return true;
};

/** La calificación de una materia, si ya existe. */
export const buscarCalificacionDeMateria = (calificaciones, materia) =>
  (calificaciones || []).find((calificacion) =>
    coincideConMateria(calificacion, {
      nombre: materia?.nombre,
      nivelId: materia?.nivelId || materia?.nivelActualId || null,
      nivelNombre: materia?.nivelNombre || materia?.nivel || ''
    })
  ) || null;
