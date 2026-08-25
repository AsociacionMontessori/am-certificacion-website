/**
 * Desde cuándo se le pide el expediente al alumno dentro del portal.
 *
 * Los alumnos dados de alta antes de esta fecha entregaron su expediente en el
 * sistema anterior, así que reclamárselo aquí solo los confunde: sus
 * documentos existen, nomás no viven en esta base. La fecha corresponde al
 * alta de la primera alumna que sí capturó todo desde el portal.
 */
export const INICIO_EXPEDIENTE_EN_PORTAL = new Date('2026-07-23T00:00:00Z');

const aFecha = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor.toDate === 'function') return valor.toDate();
  if (valor.seconds) return new Date(valor.seconds * 1000);
  const fecha = new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * ¿A este alumno le toca que el portal le reclame su expediente?
 *
 * Sin fecha de alta se asume que es de los antiguos: más vale no avisarle de
 * más a alguien que ya entregó sus papeles.
 */
export const debePedirseExpediente = (alumno) => {
  const alta = aFecha(alumno?.fechaCreacion) || aFecha(alumno?.fechaIngreso);
  if (!alta) return false;
  return alta >= INICIO_EXPEDIENTE_EN_PORTAL;
};
