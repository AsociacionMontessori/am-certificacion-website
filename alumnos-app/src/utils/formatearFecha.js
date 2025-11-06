/**
 * Formatea una fecha a formato largo en español
 * Ejemplo: "12 de diciembre de 2025"
 * 
 * @param {Date|Timestamp|string|number} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en formato largo
 */
export const formatearFechaLarga = (fecha) => {
  if (!fecha) return 'N/A';
  
  let fechaObj = null;
  
  // Manejar diferentes formatos de fecha
  if (fecha?.toDate) {
    // Timestamp de Firestore
    fechaObj = fecha.toDate();
  } else if (fecha?.seconds) {
    // Timestamp con seconds
    fechaObj = new Date(fecha.seconds * 1000);
  } else if (fecha instanceof Date) {
    // Objeto Date
    fechaObj = fecha;
  } else if (typeof fecha === 'string') {
    // String de fecha
    fechaObj = new Date(fecha);
  } else if (typeof fecha === 'number') {
    // Timestamp numérico
    fechaObj = new Date(fecha);
  }
  
  // Validar que la fecha sea válida
  if (!fechaObj || isNaN(fechaObj.getTime())) {
    return fecha?.toString() || 'N/A';
  }
  
  // Formatear en español
  const opciones = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return fechaObj.toLocaleDateString('es-MX', opciones);
};

/**
 * Formatea una fecha a formato corto (solo para inputs de tipo date)
 * @param {Date|Timestamp|string} fecha - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD para inputs
 */
export const formatearFechaInput = (fecha) => {
  if (!fecha) return '';
  
  let fechaObj = null;
  
  if (fecha?.toDate) {
    fechaObj = fecha.toDate();
  } else if (fecha?.seconds) {
    fechaObj = new Date(fecha.seconds * 1000);
  } else if (fecha instanceof Date) {
    fechaObj = fecha;
  } else if (typeof fecha === 'string') {
    fechaObj = new Date(fecha);
  }
  
  if (!fechaObj || isNaN(fechaObj.getTime())) {
    return '';
  }
  
  return fechaObj.toISOString().split('T')[0];
};

