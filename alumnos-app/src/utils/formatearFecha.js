/**
 * Verifica si una fecha es una fecha "por defecto" o "sin fecha" (1900-01-01)
 * @param {Date} fechaObj - Objeto Date a verificar
 * @returns {boolean} true si es fecha por defecto
 */
const esFechaPorDefecto = (fechaObj) => {
  if (!fechaObj || isNaN(fechaObj.getTime())) {
    return false;
  }
  // Verificar si es 1900-01-01 (fecha por defecto que representa "sin fecha")
  const año = fechaObj.getFullYear();
  const mes = fechaObj.getMonth() + 1; // getMonth() retorna 0-11
  const dia = fechaObj.getDate();
  return año === 1900 && mes === 1 && dia === 1;
};

/**
 * Formatea una fecha a formato largo en español
 * Ejemplo: "12 de diciembre de 2025"
 * Si la fecha es 1900-01-01, muestra "Fecha abierta"
 * 
 * @param {Date|Timestamp|string|number} fecha - Fecha a formatear
 * @returns {string} Fecha formateada en formato largo o "Fecha abierta" si es fecha por defecto
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
  
  // Si es la fecha por defecto (1900-01-01), mostrar "Fecha abierta"
  if (esFechaPorDefecto(fechaObj)) {
    return 'Fecha abierta';
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

