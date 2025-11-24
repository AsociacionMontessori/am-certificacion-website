import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc,
  setDoc,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
  deleteField
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { getNivelActivo } from '../utils/alumnos';

const normalizarFecha = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor === 'string') {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
  if (valor?.toDate) return valor.toDate();
  if (typeof valor?.seconds === 'number') return new Date(valor.seconds * 1000);
  return null;
};

const mapearBecaParaPago = (beca) => {
  if (!beca) return null;
  return {
    id: beca.id,
    nombre: beca.nombre || beca.titulo || beca.motivo || 'Descuento',
    descripcion: beca.descripcion || beca.motivo || '',
    tipo: beca.tipo || 'porcentaje',
    valor: Number(beca.valor) || 0,
    alcance: beca.alcance || 'global',
    pagoId: beca.pagoId || null,
    condiciones: beca.condiciones || null,
    aplicadoEn: beca.aplicadoEn || new Date().toISOString()
  };
};

const aplicaBecaAPago = (pago, beca) => {
  if (!pago || !beca || beca.activa === false) return false;
  if (['Validado', 'Rechazado'].includes(pago.estado)) return false;

  const fechaInicio = normalizarFecha(beca.fechaInicio);
  const fechaFin = normalizarFecha(beca.fechaFin);
  const fechaPago = normalizarFecha(pago.fechaVencimiento) || new Date();

  if (fechaInicio && fechaPago < fechaInicio) return false;
  if (fechaFin && fechaPago > fechaFin) return false;

  switch (beca.alcance) {
    case 'colegiaturas':
      return pago.tipo === 'Colegiatura';
    case 'inscripcion':
      return pago.tipo === 'Inscripción';
    case 'certificado':
      return pago.tipo === 'Certificado';
    case 'pago':
      return beca.pagoId && (pago.id === beca.pagoId);
    case 'concepto':
      return beca.concepto ? (pago.tipo === beca.concepto || pago.descripcion?.toLowerCase().includes(beca.concepto.toLowerCase())) : true;
    case 'global':
    default:
      return true;
  }
};

const recalcularMontosConBecas = (montoOriginal, becas = []) => {
  let montoBase = Number(montoOriginal) || 0;
  let montoActual = montoBase;
  const detalles = [];

  becas.forEach((beca) => {
    if (!beca || typeof beca.valor !== 'number' || beca.valor <= 0) {
      if (beca) {
        detalles.push({ ...beca, descuento: 0 });
      }
      return;
    }

    let descuento = 0;
    const porcentaje = Math.min(100, Math.max(0, Number(beca.valor)));

    if ((beca.tipo || 'porcentaje') === 'porcentaje') {
      const montoAntes = montoActual;
      montoActual = montoActual * (1 - porcentaje / 100);
      descuento = montoAntes - montoActual;
    } else {
      descuento = Math.min(montoActual, porcentaje);
      montoActual = montoActual - descuento;
    }

    descuento = Number(descuento.toFixed(2));
    montoActual = Number(Math.max(0, montoActual).toFixed(2));

    detalles.push({
      ...beca,
      descuento
    });
  });

  const totalDescuento = Number(detalles.reduce((suma, item) => suma + (item.descuento || 0), 0).toFixed(2));
  const montoFinal = Number(Math.max(0, montoActual).toFixed(2));

  return {
    montoFinal,
    totalDescuento,
    becasDetalladas: detalles
  };
};

export const aplicarBecaAPagosAlumno = async (alumnoId, beca) => {
  if (!alumnoId || !beca) return { aplicados: 0, omitidos: 0 };

  const pagosSnapshot = await getDocs(query(collection(db, 'pagos'), where('alumnoId', '==', alumnoId)));
  let aplicados = 0;
  let omitidos = 0;

  await Promise.all(pagosSnapshot.docs.map(async (docSnap) => {
    const pago = { id: docSnap.id, ...docSnap.data() };
    if (!aplicaBecaAPago(pago, beca)) {
      omitidos += 1;
      return;
    }

    // Obtener monto original: si no existe, usar el monto actual (puede que sea el original)
    // Si el pago ya tiene descuentos aplicados, el montoOriginal debería existir
    let montoOriginal = Number(pago.montoOriginal ?? pago.monto ?? 0);
    
    // Si el pago tiene descuentos aplicados pero no tiene montoOriginal guardado,
    // intentar calcularlo desde el monto actual y los descuentos
    if (!pago.montoOriginal && pago.descuentoAplicado && pago.descuentoAplicado > 0) {
      // Si hay descuento aplicado, el monto original debería ser mayor
      // Intentar revertir el descuento para obtener el original
      const descuentoAplicado = Number(pago.descuentoAplicado);
      montoOriginal = Number((Number(pago.monto) + descuentoAplicado).toFixed(2));
    }
    
    const becasActuales = (pago.becasAplicadas || []).filter((item) => item?.id !== beca.id);
    const becaMapeada = mapearBecaParaPago(beca);
    const { montoFinal, totalDescuento, becasDetalladas } = recalcularMontosConBecas(montoOriginal, [...becasActuales, becaMapeada]);

    const actualizaciones = {
      montoOriginal,
      monto: montoFinal,
      descuentoAplicado: totalDescuento,
      becasAplicadas: becasDetalladas
    };

    if (pago.montoPagado) {
      const pendiente = Number((montoFinal - pago.montoPagado).toFixed(2));
      actualizaciones.montoPendiente = pendiente > 0 ? pendiente : deleteField();
    }

    await updateDoc(doc(db, 'pagos', pago.id), actualizaciones);
    aplicados += 1;
  }));

  return { aplicados, omitidos };
};

export const revertirBecaEnPagos = async (alumnoId, becaId) => {
  if (!alumnoId || !becaId) return { actualizados: 0, sinCambios: 0 };

  const pagosSnapshot = await getDocs(query(collection(db, 'pagos'), where('alumnoId', '==', alumnoId)));
  let actualizados = 0;
  let sinCambios = 0;

  await Promise.all(pagosSnapshot.docs.map(async (docSnap) => {
    const pago = { id: docSnap.id, ...docSnap.data() };
    const becasActuales = (pago.becasAplicadas || []);
    if (!becasActuales.some((item) => item?.id === becaId)) {
      sinCambios += 1;
      return;
    }

    const becasFiltradas = becasActuales.filter((item) => item?.id !== becaId);
    const montoOriginal = Number(pago.montoOriginal ?? pago.monto ?? 0);

    if (becasFiltradas.length === 0) {
      const actualizaciones = {
        monto: montoOriginal,
        descuentoAplicado: deleteField(),
        becasAplicadas: deleteField(),
        montoPendiente: pago.montoPagado ? Number(Math.max(0, (montoOriginal - pago.montoPagado)).toFixed(2)) : deleteField()
      };

      if (!pago.montoOriginal) {
        actualizaciones.montoOriginal = deleteField();
      }

      await updateDoc(doc(db, 'pagos', pago.id), actualizaciones);
      actualizados += 1;
      return;
    }

    const { montoFinal, totalDescuento, becasDetalladas } = recalcularMontosConBecas(montoOriginal, becasFiltradas);
    const actualizaciones = {
      montoOriginal,
      monto: montoFinal,
      descuentoAplicado: totalDescuento,
      becasAplicadas: becasDetalladas
    };

    if (pago.montoPagado) {
      const pendiente = Number((montoFinal - pago.montoPagado).toFixed(2));
      actualizaciones.montoPendiente = pendiente > 0 ? pendiente : deleteField();
    }

    await updateDoc(doc(db, 'pagos', pago.id), actualizaciones);
    actualizados += 1;
  }));

  return { actualizados, sinCambios };
};

/**
 * Recalcular todos los pagos de un alumno con todas sus becas activas
 * Útil para actualizar pagos existentes cuando se crean o modifican descuentos
 */
export const recalcularPagosConBecasActivas = async (alumnoId) => {
  if (!alumnoId) return { actualizados: 0, omitidos: 0 };

  try {
    // Obtener todas las becas activas del alumno
    const becasActivas = await obtenerBecasAlumno(alumnoId);
    
    if (becasActivas.length === 0) {
      // Si no hay becas activas, revertir todos los descuentos
      const pagosSnapshot = await getDocs(query(collection(db, 'pagos'), where('alumnoId', '==', alumnoId)));
      let actualizados = 0;

      await Promise.all(pagosSnapshot.docs.map(async (docSnap) => {
        const pago = { id: docSnap.id, ...docSnap.data() };
        
        // Solo actualizar pagos pendientes o vencidos
        if (['Validado', 'Rechazado'].includes(pago.estado)) {
          return;
        }

        const montoOriginal = Number(pago.montoOriginal ?? pago.monto ?? 0);
        
        const actualizaciones = {
          monto: montoOriginal,
          descuentoAplicado: deleteField(),
          becasAplicadas: deleteField()
        };

        if (!pago.montoOriginal) {
          actualizaciones.montoOriginal = deleteField();
        }

        if (pago.montoPagado) {
          const pendiente = Number(Math.max(0, (montoOriginal - pago.montoPagado)).toFixed(2));
          actualizaciones.montoPendiente = pendiente > 0 ? pendiente : deleteField();
        }

        await updateDoc(doc(db, 'pagos', pago.id), actualizaciones);
        actualizados += 1;
      }));

      return { actualizados, omitidos: 0 };
    }

    // Obtener todos los pagos del alumno
    const pagosSnapshot = await getDocs(query(collection(db, 'pagos'), where('alumnoId', '==', alumnoId)));
    let actualizados = 0;
    let omitidos = 0;

    await Promise.all(pagosSnapshot.docs.map(async (docSnap) => {
      const pago = { id: docSnap.id, ...docSnap.data() };
      
      // Solo actualizar pagos pendientes o vencidos
      if (['Validado', 'Rechazado'].includes(pago.estado)) {
        omitidos += 1;
        return;
      }

      // Filtrar becas que aplican a este pago
      const becasAplicables = becasActivas.filter(beca => aplicaBecaAPago(pago, beca));
      
      if (becasAplicables.length === 0) {
        // Si no hay becas aplicables, revertir descuentos
        const montoOriginal = Number(pago.montoOriginal ?? pago.monto ?? 0);
        const actualizaciones = {
          monto: montoOriginal,
          descuentoAplicado: deleteField(),
          becasAplicadas: deleteField()
        };

        if (!pago.montoOriginal) {
          actualizaciones.montoOriginal = deleteField();
        }

        if (pago.montoPagado) {
          const pendiente = Number(Math.max(0, (montoOriginal - pago.montoPagado)).toFixed(2));
          actualizaciones.montoPendiente = pendiente > 0 ? pendiente : deleteField();
        }

        await updateDoc(doc(db, 'pagos', pago.id), actualizaciones);
        actualizados += 1;
        return;
      }

      // Obtener monto original
      let montoOriginal = Number(pago.montoOriginal ?? pago.monto ?? 0);
      
      // Si el pago tiene descuentos aplicados pero no tiene montoOriginal guardado,
      // intentar calcularlo desde el monto actual y los descuentos
      if (!pago.montoOriginal || pago.montoOriginal === pago.monto) {
        // Si hay descuento aplicado, el monto original debería ser mayor
        if (pago.descuentoAplicado && pago.descuentoAplicado > 0) {
          const descuentoAplicado = Number(pago.descuentoAplicado);
          montoOriginal = Number((Number(pago.monto) + descuentoAplicado).toFixed(2));
        } else {
          // Si no hay descuento aplicado, el monto actual ES el original
          montoOriginal = Number(pago.monto);
        }
      }

      // Mapear becas aplicables
      const becasMapeadas = becasAplicables.map(beca => mapearBecaParaPago(beca));
      
      // Recalcular montos con todas las becas aplicables
      const { montoFinal, totalDescuento, becasDetalladas } = recalcularMontosConBecas(montoOriginal, becasMapeadas);

      const actualizaciones = {
        montoOriginal,
        monto: montoFinal
      };

      if (totalDescuento > 0) {
        actualizaciones.descuentoAplicado = totalDescuento;
      } else {
        actualizaciones.descuentoAplicado = deleteField();
      }

      if (becasDetalladas.length > 0) {
        actualizaciones.becasAplicadas = becasDetalladas;
      } else {
        actualizaciones.becasAplicadas = deleteField();
      }

      if (pago.montoPagado) {
        const pendiente = Number((montoFinal - pago.montoPagado).toFixed(2));
        actualizaciones.montoPendiente = pendiente > 0 ? pendiente : deleteField();
      }

      await updateDoc(doc(db, 'pagos', pago.id), actualizaciones);
      actualizados += 1;
    }));

    return { actualizados, omitidos };
  } catch (error) {
    console.error('Error al recalcular pagos con becas activas:', error);
    throw error;
  }
};

/**
 * Obtener todos los pagos de un alumno
 */
export const obtenerPagosAlumno = async (alumnoId) => {
  try {
    // Intentar consulta con orderBy, si falla por índice, obtener sin ordenar y ordenar en cliente
    let querySnapshot;
    try {
      const pagosQuery = query(
        collection(db, 'pagos'),
        where('alumnoId', '==', alumnoId),
        orderBy('fechaVencimiento', 'desc')
      );
      querySnapshot = await getDocs(pagosQuery);
    } catch (indexError) {
      // Si falla por falta de índice, obtener sin ordenar
      if (indexError.code === 'failed-precondition') {
        console.warn('Índice compuesto no encontrado, ordenando en cliente');
        const pagosQuery = query(
          collection(db, 'pagos'),
          where('alumnoId', '==', alumnoId)
        );
        querySnapshot = await getDocs(pagosQuery);
      } else {
        throw indexError;
      }
    }
    
    let pagos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Si no se ordenó en la consulta, ordenar en el cliente
    if (pagos.length > 0 && pagos[0].fechaVencimiento) {
      pagos.sort((a, b) => {
        const fechaA = a.fechaVencimiento?.toDate?.() || new Date(a.fechaVencimiento);
        const fechaB = b.fechaVencimiento?.toDate?.() || new Date(b.fechaVencimiento);
        return fechaB - fechaA; // Descendente
      });
    }
    
    return pagos;
  } catch (error) {
    console.error('Error al obtener pagos del alumno:', error);
    throw error;
  }
};

/**
 * Obtener un pago específico
 */
export const obtenerPago = async (pagoId) => {
  try {
    const pagoDoc = await getDoc(doc(db, 'pagos', pagoId));
    if (pagoDoc.exists()) {
      return { id: pagoDoc.id, ...pagoDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener pago:', error);
    throw error;
  }
};

/**
 * Crear un nuevo pago
 */
export const crearPago = async (pagoData) => {
  try {
    const montoOriginal = Number(pagoData.montoOriginal ?? pagoData.monto ?? 0);
    const descuentoAplicado = Number(pagoData.descuentoAplicado || 0);
    const montoFinal = Number((pagoData.monto ?? (montoOriginal - descuentoAplicado)).toFixed(2));
    const becasAplicadas = Array.isArray(pagoData.becasAplicadas) ? pagoData.becasAplicadas : [];

    const nuevoPago = {
      ...pagoData,
      montoOriginal,
      monto: montoFinal,
      descuentoAplicado,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp()
    };

    if (becasAplicadas.length > 0) {
      nuevoPago.becasAplicadas = becasAplicadas;
    }

    const docRef = await addDoc(collection(db, 'pagos'), nuevoPago);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear pago:', error);
    throw error;
  }
};

/**
 * Actualizar un pago
 */
export const actualizarPago = async (pagoId, pagoData) => {
  try {
    const updateData = {
      ...pagoData,
      fechaActualizacion: serverTimestamp()
    };
    await updateDoc(doc(db, 'pagos', pagoId), updateData);
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    throw error;
  }
};

/**
 * Eliminar un pago
 */
export const eliminarPago = async (pagoId) => {
  try {
    // Obtener el pago para eliminar el comprobante si existe
    const pago = await obtenerPago(pagoId);
    if (pago?.comprobantePath || pago?.comprobanteUrl) {
      await eliminarComprobante(pago.comprobantePath || pago.comprobanteUrl);
    }
    await deleteDoc(doc(db, 'pagos', pagoId));
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    throw error;
  }
};

/**
 * Subir comprobante de pago
 */
export const subirComprobante = async (alumnoId, pagoId, archivo) => {
  try {
    const nombreArchivo = `pago-${pagoId}-${Date.now()}.${archivo.name.split('.').pop()}`;
    const path = `comprobantes/${alumnoId}/${nombreArchivo}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, archivo);
    const url = await getDownloadURL(snapshot.ref);
    // Retornar tanto la URL como la ruta para facilitar la eliminación
    return { url, path };
  } catch (error) {
    console.error('Error al subir comprobante:', error);
    throw error;
  }
};

/**
 * Eliminar comprobante de pago
 * @param {string} pathOrUrl - Ruta del archivo o URL completa
 */
export const eliminarComprobante = async (pathOrUrl) => {
  try {
    if (!pathOrUrl) return;
    
    try {
      // Si es una ruta directa (no URL), usarla directamente
      let path = pathOrUrl;
      
      // Si es una URL, extraer la ruta
      if (pathOrUrl.startsWith('http')) {
        if (pathOrUrl.includes('/o/')) {
          const match = pathOrUrl.match(/\/o\/(.+?)\?/);
          if (match) {
            path = decodeURIComponent(match[1]);
          } else {
            // Si no se puede extraer, no intentar eliminar
            console.warn('No se pudo extraer la ruta de la URL');
            return;
          }
        } else {
          console.warn('URL no válida para Firebase Storage');
          return;
        }
      }
      
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (deleteError) {
      // Si falla, el archivo probablemente ya no existe
      console.warn('No se pudo eliminar el archivo, puede que ya no exista:', deleteError.message);
    }
  } catch (error) {
    console.warn('Error al eliminar comprobante (se ignora):', error);
    // No lanzar error si el archivo no existe o hay problemas
  }
};

/**
 * Validar un pago (solo admin)
 */
export const validarPago = async (pagoId, observaciones = '') => {
  try {
    await updateDoc(doc(db, 'pagos', pagoId), {
      estado: 'Validado',
      fechaValidacion: serverTimestamp(),
      observaciones: observaciones || '',
      fechaActualizacion: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al validar pago:', error);
    throw error;
  }
};

/**
 * Rechazar un pago (solo admin)
 */
export const rechazarPago = async (pagoId, motivo) => {
  try {
    await updateDoc(doc(db, 'pagos', pagoId), {
      estado: 'Rechazado',
      motivoRechazo: motivo,
      fechaActualizacion: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al rechazar pago:', error);
    throw error;
  }
};

/**
 * Obtener configuración de pagos
 */
export const obtenerConfiguracionPagos = async () => {
  try {
    // Primero intentar obtener el documento 'general'
    const configDocGeneral = await getDoc(doc(db, 'configuracionPagos', 'general'));
    if (configDocGeneral.exists()) {
      return configDocGeneral.data();
    }
    
    // Si no existe 'general', obtener el primer documento de la colección
    // Intentar con ordenamiento por fecha, si falla (por índice), obtener sin ordenar
    let querySnapshot;
    try {
      const configQuery = query(collection(db, 'configuracionPagos'), orderBy('fechaCreacion', 'desc'), limit(1));
      querySnapshot = await getDocs(configQuery);
    } catch (orderError) {
      console.warn('orderBy fechaCreacion no disponible, usando fallback:', orderError?.message);
      // Si falla por falta de índice, obtener todos y tomar el primero
      const configQuery = query(collection(db, 'configuracionPagos'), limit(1));
      querySnapshot = await getDocs(configQuery);
    }
    
    if (!querySnapshot.empty) {
      // Retornar el primer documento encontrado
      const firstDoc = querySnapshot.docs[0];
      return firstDoc.data();
    }
    
    // Retornar configuración por defecto si no hay ningún documento
    return {
      recargoPorcentaje: 10,
      recargoActivo: true,
      diaVencimiento: 10,
      costos: {
        'Guía de Nido y Comunidad': { mensual: 2900, meses: 16, inscripcion: 4600, certificado: 2500 },
        'Guía de Casa de Niños': { mensual: 3300, meses: 17, inscripcion: 4600, certificado: 2500 },
        'Guía de Taller I-II': { mensual: 3600, meses: 20, inscripcion: 4600, certificado: 2500 },
        'Diplomado en Neuroeducación': { total: 4500, pagos: 3, montoPago: 1500 },
        'Curso Filosofía Montessori': { total: 4500, pagos: 3, montoPago: 1500 }
      }
    };
  } catch (error) {
    console.error('Error al obtener configuración de pagos:', error);
    // Si hay error, intentar obtener cualquier documento de la colección
    try {
      const configQuery = query(collection(db, 'configuracionPagos'), limit(1));
      const querySnapshot = await getDocs(configQuery);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
    } catch (fallbackError) {
      console.warn('Error al obtener configuración (fallback):', fallbackError);
    }
    // Retornar configuración por defecto
    return {
      recargoPorcentaje: 10,
      recargoActivo: true,
      diaVencimiento: 10,
      costos: {
        'Guía de Nido y Comunidad': { mensual: 2900, meses: 16, inscripcion: 4600, certificado: 2500 },
        'Guía de Casa de Niños': { mensual: 3300, meses: 17, inscripcion: 4600, certificado: 2500 },
        'Guía de Taller I-II': { mensual: 3600, meses: 20, inscripcion: 4600, certificado: 2500 },
        'Diplomado en Neuroeducación': { total: 4500, pagos: 3, montoPago: 1500 },
        'Curso Filosofía Montessori': { total: 4500, pagos: 3, montoPago: 1500 }
      }
    };
  }
};

/**
 * Actualizar configuración de pagos (solo admin)
 */
export const actualizarConfiguracionPagos = async (configuracion) => {
  try {
    // Primero intentar actualizar el documento 'general'
    const configDocGeneral = doc(db, 'configuracionPagos', 'general');
    const generalDoc = await getDoc(configDocGeneral);
    
    if (generalDoc.exists()) {
      await updateDoc(configDocGeneral, {
        ...configuracion,
        fechaActualizacion: serverTimestamp()
      });
      return;
    }
    
    // Si no existe 'general', obtener el primer documento y actualizarlo
    const configQuery = query(collection(db, 'configuracionPagos'), limit(1));
    const querySnapshot = await getDocs(configQuery);
    
    if (!querySnapshot.empty) {
      const firstDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'configuracionPagos', firstDoc.id), {
        ...configuracion,
        fechaActualizacion: serverTimestamp()
      });
    } else {
      // Si no existe ningún documento, crear uno nuevo con ID 'general'
      await setDoc(doc(db, 'configuracionPagos', 'general'), {
        ...configuracion,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error al actualizar configuración de pagos:', error);
    throw error;
  }
};

/**
 * Obtener becas de un alumno
 */
export const obtenerBecasAlumno = async (alumnoId) => {
  try {
    const becasQuery = query(
      collection(db, 'becas'),
      where('alumnoId', '==', alumnoId),
      where('activa', '==', true)
    );
    const querySnapshot = await getDocs(becasQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener becas del alumno:', error);
    throw error;
  }
};

/**
 * Crear una beca (solo admin)
 */
export const crearBeca = async (becaData) => {
  try {
    if (!becaData?.alumnoId) {
      throw new Error('La beca debe estar asociada a un alumno');
    }

    const baseBeca = {
      alumnoId: becaData.alumnoId,
      nombre: becaData.nombre || 'Descuento personalizado',
      descripcion: becaData.descripcion || '',
      tipo: becaData.tipo || 'porcentaje',
      valor: Number(becaData.valor) || 0,
      alcance: becaData.alcance || 'global',
      pagoId: becaData.pagoId || null,
      concepto: becaData.concepto || null,
      condiciones: becaData.condiciones || null,
      motivo: becaData.motivo || '',
      fechaInicio: becaData.fechaInicio || null,
      fechaFin: becaData.fechaFin || null,
      aplicaRecargos: becaData.aplicaRecargos !== undefined ? becaData.aplicaRecargos : true
    };

    const nuevaBeca = {
      ...baseBeca,
      activa: becaData.activa !== false,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'becas'), nuevaBeca);

    if (nuevaBeca.activa) {
      // Recalcular todos los pagos con todas las becas activas para asegurar consistencia
      await recalcularPagosConBecasActivas(baseBeca.alumnoId);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error al crear beca:', error);
    throw error;
  }
};

/**
 * Actualizar una beca (solo admin)
 */
export const actualizarBeca = async (becaId, becaData) => {
  try {
    const becaRef = doc(db, 'becas', becaId);
    const becaAnteriorSnap = await getDoc(becaRef);
    if (!becaAnteriorSnap.exists()) {
      throw new Error('La beca indicada no existe');
    }

    const becaAnterior = { id: becaAnteriorSnap.id, ...becaAnteriorSnap.data() };

    await updateDoc(becaRef, {
      ...becaData,
      fechaActualizacion: serverTimestamp()
    });

    const becaActualizadaSnap = await getDoc(becaRef);
    const becaActualizada = { id: becaActualizadaSnap.id, ...becaActualizadaSnap.data() };

    // Recalcular todos los pagos con todas las becas activas para asegurar consistencia
    // Esto es más robusto que revertir y aplicar individualmente
    await recalcularPagosConBecasActivas(becaAnterior.alumnoId);
  } catch (error) {
    console.error('Error al actualizar beca:', error);
    throw error;
  }
};

/**
 * Eliminar una beca (solo admin)
 */
export const eliminarBeca = async (becaId) => {
  try {
    const becaRef = doc(db, 'becas', becaId);
    const becaSnap = await getDoc(becaRef);
    if (!becaSnap.exists()) {
      throw new Error('La beca indicada no existe');
    }

    const beca = { id: becaSnap.id, ...becaSnap.data() };

    await updateDoc(becaRef, {
      activa: false,
      fechaActualizacion: serverTimestamp()
    });

    // Recalcular todos los pagos con todas las becas activas restantes
    await recalcularPagosConBecasActivas(beca.alumnoId);
  } catch (error) {
    console.error('Error al eliminar beca:', error);
    throw error;
  }
};

/**
 * Obtener todos los pagos (admin)
 */
export const obtenerTodosLosPagos = async (filtros = {}) => {
  try {
    let querySnapshot;
    const constraints = [];

    // Construir constraints
    if (filtros.alumnoId) {
      constraints.push(where('alumnoId', '==', filtros.alumnoId));
    }
    if (filtros.estado) {
      constraints.push(where('estado', '==', filtros.estado));
    }

    // Intentar consulta con orderBy
    try {
      if (constraints.length > 0) {
        const pagosQuery = query(
          collection(db, 'pagos'),
          ...constraints,
          orderBy('fechaVencimiento', 'desc')
        );
        querySnapshot = await getDocs(pagosQuery);
      } else {
        const pagosQuery = query(
          collection(db, 'pagos'),
          orderBy('fechaVencimiento', 'desc')
        );
        querySnapshot = await getDocs(pagosQuery);
      }
    } catch (indexError) {
      // Si falla por falta de índice, obtener sin ordenar
      if (indexError.code === 'failed-precondition') {
        console.warn('Índice compuesto no encontrado, ordenando en cliente');
        if (constraints.length > 0) {
          const pagosQuery = query(collection(db, 'pagos'), ...constraints);
          querySnapshot = await getDocs(pagosQuery);
        } else {
          const pagosQuery = query(collection(db, 'pagos'));
          querySnapshot = await getDocs(pagosQuery);
        }
      } else {
        throw indexError;
      }
    }

    let pagos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Si no se ordenó en la consulta, ordenar en el cliente
    if (pagos.length > 0) {
      pagos.sort((a, b) => {
        const fechaA = a.fechaVencimiento?.toDate?.() || new Date(a.fechaVencimiento || 0);
        const fechaB = b.fechaVencimiento?.toDate?.() || new Date(b.fechaVencimiento || 0);
        return fechaB - fechaA; // Descendente
      });
    }

    return pagos;
  } catch (error) {
    console.error('Error al obtener todos los pagos:', error);
    throw error;
  }
};

/**
 * Generar pagos automáticamente para un alumno basándose en su nivel
 */
export const generarPagosPorNivel = async (alumno, configuracion) => {
  try {
    const nivelActivo = getNivelActivo(alumno);
    const nivelNombre = nivelActivo?.nombre || alumno?.nivel || '';

    if (!nivelNombre || !configuracion?.costos) {
      throw new Error('El alumno debe tener un nivel asignado y debe existir configuración de costos');
    }

    // Buscar el costo correspondiente al nivel del alumno
    const costos = configuracion.costos;
    
    // Buscar coincidencia exacta o parcial del nivel
    let costoNivel = null;
    
    // Primero intentar coincidencia exacta
    if (costos[nivelNombre]) {
      costoNivel = { nombre: nivelNombre, ...costos[nivelNombre] };
    } else {
      // Buscar coincidencia parcial (el nivel contiene palabras clave del nombre)
      for (const [key, valor] of Object.entries(costos)) {
        // Normalizar strings para comparación
        const nivelLower = nivelNombre.toLowerCase();
        const keyLower = key.toLowerCase();
        
        // Verificar si alguna palabra clave coincide
        const palabrasNivel = nivelLower.split(/\s+/);
        const palabrasKey = keyLower.split(/\s+/);
        
        // Buscar coincidencias significativas (palabras de más de 3 caracteres)
        const palabrasSignificativas = palabrasKey.filter(p => p.length > 3);
        const tieneCoincidencia = palabrasSignificativas.some(palabra =>
          nivelLower.includes(palabra) || palabrasNivel.some(p => p.includes(palabra))
        );
        
        if (tieneCoincidencia || nivelLower.includes(keyLower) || keyLower.includes(nivelLower)) {
          costoNivel = { nombre: key, ...valor };
          break;
        }
      }
    }

    if (!costoNivel) {
      console.error(`No se encontró configuración de costos para el nivel: ${nivelNombre}`);
      console.error(`Niveles disponibles:`, Object.keys(costos));
      throw new Error(`No se encontró configuración de costos para el nivel: "${nivelNombre}". Niveles disponibles: ${Object.keys(costos).join(', ')}`);
    }

    // Obtener fecha de ingreso del alumno
    let fechaInicio = alumno.fechaIngreso;
    if (fechaInicio?.toDate) {
      fechaInicio = fechaInicio.toDate();
    } else if (fechaInicio?.seconds) {
      fechaInicio = new Date(fechaInicio.seconds * 1000);
    } else if (typeof fechaInicio === 'string') {
      fechaInicio = new Date(fechaInicio);
    } else if (!(fechaInicio instanceof Date)) {
      fechaInicio = new Date(); // Si no hay fecha, usar la actual
    }

    // Verificar si el alumno ya tiene pagos generados
    const pagosExistentes = await obtenerPagosAlumno(alumno.id);

    const pagosGenerados = [];
    const diaVencimiento = configuracion.diaVencimiento || 10;
    const recargoPorcentaje = configuracion.recargoPorcentaje || 10;
    const recargoActivo = configuracion.recargoActivo !== false;

    // Generar pago de inscripción (si aplica)
    // Verificar si ya existe una inscripción
    const tieneInscripcion = pagosExistentes.some(p => p.tipo === 'Inscripción');
    if (costoNivel.inscripcion && !tieneInscripcion) {
      const fechaInscripcion = new Date(fechaInicio);
      fechaInscripcion.setDate(diaVencimiento);
      
      const pagoInscripcion = await crearPago({
        alumnoId: alumno.id,
        tipo: 'Inscripción',
        monto: costoNivel.inscripcion,
        fechaVencimiento: Timestamp.fromDate(fechaInscripcion),
        estado: 'Pendiente',
        recargoPorcentaje: 0,
        recargoActivo: false, // Las inscripciones NO tienen recargo
        descripcion: `Inscripción - ${nivelNombre}`
      });
      pagosGenerados.push(pagoInscripcion);
    }

    // Generar o completar colegiaturas mensuales (si aplica)
    if (costoNivel.mensual && costoNivel.meses) {
      const meses = costoNivel.meses;
      const fechasVencimiento = [];

      for (let i = 0; i < meses; i++) {
        const fecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + i, diaVencimiento);
        fechasVencimiento.push(fecha);
      }

      const colegiaturasExistentes = pagosExistentes
        .filter(p => p.tipo === 'Colegiatura')
        .sort((a, b) => {
          const fechaA = a.fechaVencimiento?.toDate?.() || new Date(a.fechaVencimiento || 0);
          const fechaB = b.fechaVencimiento?.toDate?.() || new Date(b.fechaVencimiento || 0);
          return fechaA - fechaB;
        });

      const numerosAsignados = new Set();
      await Promise.all(colegiaturasExistentes.map(async (pago, idx) => {
        const numeroEsperado = idx + 1;
        const updates = {};
        if (!pago.numeroColegiatura || pago.numeroColegiatura !== numeroEsperado) {
          updates.numeroColegiatura = numeroEsperado;
        }
        if (pago.totalColegiaturas !== meses) {
          updates.totalColegiaturas = meses;
        }
        if (!pago.descripcion?.includes(`Colegiatura ${numeroEsperado}`)) {
          const fechaTexto = fechasVencimiento[numeroEsperado - 1]?.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
          updates.descripcion = `Colegiatura ${numeroEsperado}/${meses} - ${nivelNombre}${fechaTexto ? ` - ${fechaTexto}` : ''}`;
        }
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'pagos', pago.id), updates);
        }
        numerosAsignados.add(numeroEsperado);
      }));

      if (colegiaturasExistentes.length === 0) {
        for (let i = 0; i < fechasVencimiento.length; i++) {
          const numeroColegiatura = i + 1;
          const pagoColegiatura = await crearPago({
            alumnoId: alumno.id,
            tipo: 'Colegiatura',
            numeroColegiatura,
            totalColegiaturas: meses,
            monto: costoNivel.mensual,
            fechaVencimiento: Timestamp.fromDate(fechasVencimiento[i]),
            estado: 'Pendiente',
            recargoPorcentaje,
            recargoActivo,
            descripcion: `Colegiatura ${numeroColegiatura}/${meses} - ${nivelNombre} - ${fechasVencimiento[i].toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`
          });
          pagosGenerados.push(pagoColegiatura);
        }
      } else {
        const faltantes = [];
        for (let i = 1; i <= meses; i++) {
          if (!numerosAsignados.has(i)) {
            faltantes.push(i);
          }
        }

        if (faltantes.length > 0) {
          for (const numero of faltantes) {
            const fechaCorrespondiente = fechasVencimiento[numero - 1] || new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + numero - 1, diaVencimiento);
            const pagoColegiatura = await crearPago({
              alumnoId: alumno.id,
              tipo: 'Colegiatura',
              numeroColegiatura: numero,
              totalColegiaturas: meses,
              monto: costoNivel.mensual,
              fechaVencimiento: Timestamp.fromDate(fechaCorrespondiente),
              estado: 'Pendiente',
              recargoPorcentaje,
              recargoActivo,
              descripcion: `Colegiatura ${numero}/${meses} - ${nivelNombre} - ${fechaCorrespondiente.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`
            });
            pagosGenerados.push(pagoColegiatura);
          }
        }
      }
    }

    // Generar pagos de programa de pago único o fraccionado (Diplomado, Curso)
    if (costoNivel.total && costoNivel.pagos) {
      const totalPagos = costoNivel.pagos;
      const montoPorPago = costoNivel.montoPago || (costoNivel.total / totalPagos);
      
      // Verificar si ya existen pagos de este tipo
      const pagosProgramaExistentes = pagosExistentes.filter(p => 
        p.tipo === 'Colegiatura' || p.descripcion?.includes(nivelNombre)
      );
      
      if (pagosProgramaExistentes.length === 0) {
        // Generar pagos fraccionados
        for (let i = 0; i < totalPagos; i++) {
          const fechaVenc = new Date(fechaInicio);
          fechaVenc.setMonth(fechaInicio.getMonth() + i);
          fechaVenc.setDate(diaVencimiento);
          
          const numeroPago = i + 1;
          const pagoPrograma = await crearPago({
            alumnoId: alumno.id,
            tipo: 'Colegiatura',
            numeroColegiatura: numeroPago,
            totalColegiaturas: totalPagos,
            monto: montoPorPago,
            fechaVencimiento: Timestamp.fromDate(fechaVenc),
            estado: 'Pendiente',
            recargoPorcentaje,
            recargoActivo, // Las colegiaturas SÍ pueden tener recargo
            descripcion: `${nivelNombre} - Pago ${numeroPago}/${totalPagos}`
          });
          pagosGenerados.push(pagoPrograma);
        }
      }
    }

    // Generar pago de certificado (al final, si aplica)
    // Verificar si ya existe un certificado
    const tieneCertificado = pagosExistentes.some(p => p.tipo === 'Certificado');
    if (costoNivel.certificado && typeof costoNivel.certificado === 'number' && !tieneCertificado) {
      const fechaCertificado = new Date(fechaInicio);
      if (costoNivel.meses) {
        fechaCertificado.setMonth(fechaInicio.getMonth() + costoNivel.meses);
      } else if (costoNivel.pagos) {
        fechaCertificado.setMonth(fechaInicio.getMonth() + costoNivel.pagos);
      }
      fechaCertificado.setDate(diaVencimiento);
      
      const pagoCertificado = await crearPago({
        alumnoId: alumno.id,
        tipo: 'Certificado',
        monto: costoNivel.certificado,
        fechaVencimiento: Timestamp.fromDate(fechaCertificado),
        estado: 'Pendiente',
        recargoPorcentaje: 0,
        recargoActivo: false, // Los certificados NO tienen recargo
        descripcion: `Certificado - ${nivelNombre}`
      });
      pagosGenerados.push(pagoCertificado);
    }
    
    // Aplicar descuentos activos a todos los pagos del alumno (incluyendo los recién generados)
    if (pagosGenerados.length > 0 || pagosExistentes.length > 0) {
      try {
        await recalcularPagosConBecasActivas(alumno.id);
      } catch (errorBecas) {
        console.error('Error al aplicar las becas activas después de generar pagos:', errorBecas);
      }
    }

    return {
      success: true,
      pagosGenerados: pagosGenerados.length,
      mensaje: pagosGenerados.length > 0 
        ? `Se generaron ${pagosGenerados.length} pagos para ${alumno.nombre || alumno.email}`
        : `No se generaron pagos. El alumno ya tiene todos los pagos necesarios o no hay configuración disponible.`
    };
  } catch (error) {
    console.error('Error al generar pagos por nivel:', error);
    throw error;
  }
};

/**
 * Generar pagos para todos los alumnos (solo admin)
 */
export const generarPagosParaTodosLosAlumnos = async (configuracion) => {
  try {
    // Obtener todos los alumnos (sin orderBy para evitar problemas de índice)
    let alumnosSnapshot;
    try {
      const alumnosQuery = query(collection(db, 'alumnos'), orderBy('nombre', 'asc'));
      alumnosSnapshot = await getDocs(alumnosQuery);
    } catch (errorOrdenAlumnos) {
      console.warn('orderBy nombre no disponible, obteniendo alumnos sin ordenar:', errorOrdenAlumnos?.message);
      // Si falla por índice, obtener sin ordenar
      alumnosSnapshot = await getDocs(collection(db, 'alumnos'));
    }
    const alumnos = alumnosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const resultados = [];
    let exitosos = 0;
    let fallidos = 0;
    let omitidos = 0;

    for (const alumno of alumnos) {
      try {
        // Verificar si el alumno tiene nivel
        if (!alumno.nivel) {
          resultados.push({
            alumnoId: alumno.id,
            alumnoNombre: alumno.nombre || alumno.email,
            success: false,
            mensaje: 'El alumno no tiene nivel asignado',
            tipo: 'omitido'
          });
          omitidos++;
          continue;
        }

        // Generar pagos para el alumno
        const resultado = await generarPagosPorNivel(alumno, configuracion);
        resultados.push({
          alumnoId: alumno.id,
          alumnoNombre: alumno.nombre || alumno.email,
          ...resultado,
          tipo: 'exitoso'
        });
        exitosos++;
      } catch (error) {
        resultados.push({
          alumnoId: alumno.id,
          alumnoNombre: alumno.nombre || alumno.email,
          success: false,
          mensaje: error.message || 'Error desconocido',
          tipo: 'fallido'
        });
        fallidos++;
      }
    }

    return {
      success: true,
      total: alumnos.length,
      exitosos,
      fallidos,
      omitidos,
      resultados
    };
  } catch (error) {
    console.error('Error al generar pagos para todos los alumnos:', error);
    throw error;
  }
};

/**
 * Migrar pagos existentes: numerar colegiaturas y corregir recargos
 */
export const migrarPagosNumerados = async () => {
  try {
    console.log('🔄 Iniciando migración de pagos...');

    // Obtener todos los pagos
    let pagosSnapshot;
    try {
      const pagosQuery = query(
        collection(db, 'pagos'),
        orderBy('fechaVencimiento', 'asc')
      );
      pagosSnapshot = await getDocs(pagosQuery);
    } catch (error) {
      // Si falla por falta de índice, obtener sin ordenar
      if (error.code === 'failed-precondition') {
        console.warn('Índice no encontrado, obteniendo sin ordenar...');
        pagosSnapshot = await getDocs(collection(db, 'pagos'));
      } else {
        throw error;
      }
    }

    if (pagosSnapshot.empty) {
      return {
        success: true,
        mensaje: 'No hay pagos para migrar',
        updates: { colegiaturas: 0, inscripciones: 0, certificados: 0 }
      };
    }

    const updates = {
      colegiaturas: 0,
      inscripciones: 0,
      certificados: 0,
      errores: 0
    };

    // Agrupar pagos por alumno
    const pagosPorAlumno = {};
    
    pagosSnapshot.forEach(doc => {
      const pago = doc.data();
      const alumnoId = pago.alumnoId;
      
      if (!pagosPorAlumno[alumnoId]) {
        pagosPorAlumno[alumnoId] = [];
      }
      
      pagosPorAlumno[alumnoId].push({
        id: doc.id,
        ...pago
      });
    });

    // Procesar cada alumno
    for (const [alumnoId, pagos] of Object.entries(pagosPorAlumno)) {
      try {
        // Separar colegiaturas de otros tipos
        const colegiaturas = pagos
          .filter(p => p.tipo === 'Colegiatura')
          .sort((a, b) => {
            const fechaA = a.fechaVencimiento?.toDate?.() || a.fechaVencimiento || new Date(0);
            const fechaB = b.fechaVencimiento?.toDate?.() || b.fechaVencimiento || new Date(0);
            return fechaA - fechaB;
          });

        const otrosPagos = pagos.filter(p => p.tipo !== 'Colegiatura');

        // Actualizar colegiaturas
        if (colegiaturas.length > 0) {
          const totalColegiaturas = colegiaturas.length;
          
          for (let i = 0; i < colegiaturas.length; i++) {
            const colegiatura = colegiaturas[i];
            const numeroColegiatura = i + 1;
            
            const updatesData = {};
            let necesitaUpdate = false;

            // Agregar número de colegiatura si no existe o es incorrecto
            if (!colegiatura.numeroColegiatura || colegiatura.numeroColegiatura !== numeroColegiatura) {
              updatesData.numeroColegiatura = numeroColegiatura;
              necesitaUpdate = true;
            }

            // Agregar total de colegiaturas si no existe o es incorrecto
            if (!colegiatura.totalColegiaturas || colegiatura.totalColegiaturas !== totalColegiaturas) {
              updatesData.totalColegiaturas = totalColegiaturas;
              necesitaUpdate = true;
            }

            if (necesitaUpdate) {
              await updateDoc(doc(db, 'pagos', colegiatura.id), updatesData);
              updates.colegiaturas++;
            }
          }
        }

        // Actualizar inscripciones (sin recargo)
        const inscripciones = otrosPagos.filter(p => p.tipo === 'Inscripción');
        for (const inscripcion of inscripciones) {
          const updatesData = {};
          let necesitaUpdate = false;

          if (inscripcion.recargoActivo !== false) {
            updatesData.recargoActivo = false;
            necesitaUpdate = true;
          }

          if (inscripcion.recargoPorcentaje !== 0 && inscripcion.recargoPorcentaje !== undefined) {
            updatesData.recargoPorcentaje = 0;
            necesitaUpdate = true;
          }

          if (necesitaUpdate) {
            await updateDoc(doc(db, 'pagos', inscripcion.id), updatesData);
            updates.inscripciones++;
          }
        }

        // Actualizar certificados (sin recargo)
        const certificados = otrosPagos.filter(p => p.tipo === 'Certificado');
        for (const certificado of certificados) {
          const updatesData = {};
          let necesitaUpdate = false;

          if (certificado.recargoActivo !== false) {
            updatesData.recargoActivo = false;
            necesitaUpdate = true;
          }

          if (certificado.recargoPorcentaje !== 0 && certificado.recargoPorcentaje !== undefined) {
            updatesData.recargoPorcentaje = 0;
            necesitaUpdate = true;
          }

          if (necesitaUpdate) {
            await updateDoc(doc(db, 'pagos', certificado.id), updatesData);
            updates.certificados++;
          }
        }

      } catch (error) {
        console.error(`Error procesando pagos del alumno ${alumnoId}:`, error);
        updates.errores++;
      }
    }

    return {
      success: true,
      mensaje: `Migración completada: ${updates.colegiaturas} colegiaturas, ${updates.inscripciones} inscripciones, ${updates.certificados} certificados actualizados`,
      updates
    };
  } catch (error) {
    console.error('Error durante la migración:', error);
    throw error;
  }
};

