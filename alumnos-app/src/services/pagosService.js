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
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

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
    const nuevoPago = {
      ...pagoData,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp()
    };
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
    const nuevaBeca = {
      ...becaData,
      activa: true,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'becas'), nuevaBeca);
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
    await updateDoc(doc(db, 'becas', becaId), {
      ...becaData,
      fechaActualizacion: serverTimestamp()
    });
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
    // Desactivar en lugar de eliminar
    await updateDoc(doc(db, 'becas', becaId), {
      activa: false,
      fechaActualizacion: serverTimestamp()
    });
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
    if (!alumno.nivel || !configuracion?.costos) {
      throw new Error('El alumno debe tener un nivel asignado y debe existir configuración de costos');
    }

    // Buscar el costo correspondiente al nivel del alumno
    const nivelNombre = alumno.nivel;
    const costos = configuracion.costos;
    
    // Buscar coincidencia exacta o parcial del nivel
    let costoNivel = null;
    console.log(`🔍 Buscando configuración para nivel: "${nivelNombre}"`);
    console.log(`   - Niveles disponibles en configuración:`, Object.keys(costos));
    
    // Primero intentar coincidencia exacta
    if (costos[nivelNombre]) {
      costoNivel = { nombre: nivelNombre, ...costos[nivelNombre] };
      console.log(`   ✅ Coincidencia exacta encontrada`);
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
          console.log(`   ✅ Coincidencia parcial encontrada: "${key}"`);
          break;
        }
      }
    }

    if (!costoNivel) {
      console.error(`   ❌ No se encontró configuración de costos para el nivel: ${nivelNombre}`);
      console.error(`   - Niveles disponibles:`, Object.keys(costos));
      throw new Error(`No se encontró configuración de costos para el nivel: "${nivelNombre}". Niveles disponibles: ${Object.keys(costos).join(', ')}`);
    }
    
    console.log(`   ✅ Configuración seleccionada:`, costoNivel);

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
    const tienePagos = pagosExistentes.length > 0;
    
    console.log(`🔍 Generando pagos para ${alumno.nombre || alumno.email}`);
    console.log(`   - Nivel: ${nivelNombre}`);
    console.log(`   - Pagos existentes: ${pagosExistentes.length}`);
    console.log(`   - Configuración encontrada:`, costoNivel);

    const pagosGenerados = [];
    const diaVencimiento = configuracion.diaVencimiento || 10;
    const recargoPorcentaje = configuracion.recargoPorcentaje || 10;
    const recargoActivo = configuracion.recargoActivo !== false;

    // Generar pago de inscripción (si aplica)
    // Verificar si ya existe una inscripción
    const tieneInscripcion = pagosExistentes.some(p => p.tipo === 'Inscripción');
    if (costoNivel.inscripcion && !tieneInscripcion) {
      console.log(`   ✅ Generando pago de inscripción: $${costoNivel.inscripcion}`);
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
    } else if (costoNivel.inscripcion && tieneInscripcion) {
      console.log(`   ⚠️ Ya existe pago de inscripción, omitiendo`);
    }

    // Generar colegiaturas mensuales (si aplica)
    if (costoNivel.mensual && costoNivel.meses) {
      const meses = costoNivel.meses;
      const fechasVencimiento = [];
      
      // Generar fechas de vencimiento para cada mes
      for (let i = 0; i < meses; i++) {
        const fecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + i, diaVencimiento);
        fechasVencimiento.push(fecha);
      }

      // Verificar si ya existen colegiaturas para evitar duplicados
      const colegiaturasExistentes = pagosExistentes.filter(p => p.tipo === 'Colegiatura');
      console.log(`   - Colegiaturas existentes: ${colegiaturasExistentes.length}/${meses}`);
      
      if (colegiaturasExistentes.length === 0) {
        console.log(`   ✅ Generando ${meses} colegiaturas de $${costoNivel.mensual} cada una`);
        // Generar todas las colegiaturas
        for (let i = 0; i < fechasVencimiento.length; i++) {
          const numeroColegiatura = i + 1;
          const pagoColegiatura = await crearPago({
            alumnoId: alumno.id,
            tipo: 'Colegiatura',
            numeroColegiatura: numeroColegiatura,
            totalColegiaturas: meses,
            monto: costoNivel.mensual,
            fechaVencimiento: Timestamp.fromDate(fechasVencimiento[i]),
            estado: 'Pendiente',
            recargoPorcentaje,
            recargoActivo, // Solo las colegiaturas pueden tener recargo
            descripcion: `Colegiatura ${numeroColegiatura}/${meses} - ${nivelNombre} - ${fechasVencimiento[i].toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`
          });
          pagosGenerados.push(pagoColegiatura);
        }
      } else {
        console.log(`   ⚠️ Ya existen colegiaturas, omitiendo generación`);
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
      console.log(`   ✅ Generando pago de certificado: $${costoNivel.certificado}`);
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
    } else if (costoNivel.certificado && tieneCertificado) {
      console.log(`   ⚠️ Ya existe pago de certificado, omitiendo`);
    }

    console.log(`   ✅ Total de pagos generados: ${pagosGenerados.length}`);
    
    if (pagosGenerados.length === 0) {
      console.warn(`   ⚠️ No se generaron pagos. Razones posibles:`);
      console.warn(`      - Ya existen todos los pagos necesarios`);
      console.warn(`      - La configuración de costos no coincide con el nivel`);
      console.warn(`      - El nivel del alumno no tiene costos configurados`);
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
    } catch (error) {
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

