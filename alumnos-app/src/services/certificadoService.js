import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Genera un hash simple compatible con navegador
 */
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase();
};

/**
 * Genera un folio único para el certificado
 */
export const generarFolio = (alumnoId) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const idSegment = (alumnoId || 'ALM')
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-4)
    .padStart(4, '0');
  return `CERT-${timestamp.toString(36).toUpperCase().substring(0, 6)}-${random}-${idSegment}`;
};

/**
 * Genera un código de verificación único (determinístico)
 */
export const generarCodigoVerificacion = (alumnoId, folio) => {
  const data = `${alumnoId}-${folio}`;
  const hash = hashString(data);
  // Asegurar que siempre tenga 16 caracteres
  let codigo = hash.substring(0, 16).toUpperCase();
  if (codigo.length < 16) {
    codigo = codigo.padEnd(16, '0');
  }
  return codigo;
};

/**
 * Calcula el promedio final del alumno
 */
export const calcularPromedioFinal = async (alumnoId) => {
  try {
    const calificacionesQuery = query(
      collection(db, 'calificaciones'),
      where('alumnoId', '==', alumnoId)
    );
    const querySnapshot = await getDocs(calificacionesQuery);
    
    if (querySnapshot.empty) {
      return null;
    }

    const calificaciones = querySnapshot.docs.map(doc => doc.data().calificacion).filter(c => c != null);
    
    if (calificaciones.length === 0) {
      return null;
    }

    const suma = calificaciones.reduce((acc, cal) => acc + parseFloat(cal), 0);
    const promedio = suma / calificaciones.length;
    return parseFloat(promedio.toFixed(2));
  } catch (error) {
    console.error('Error al calcular promedio:', error);
    return null;
  }
};

const ensureDate = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

/**
 * Obtiene o genera el certificado del alumno
 */
export const obtenerCertificado = async (alumnoId) => {
  try {
    const alumnoDoc = await getDoc(doc(db, 'alumnos', alumnoId));
    
    if (!alumnoDoc.exists()) {
      return null;
    }

    const alumnoData = alumnoDoc.data();

    // Si ya tiene folio, usar ese
    let folio = alumnoData.folioCertificado;
    let codigoVerificacion = alumnoData.codigoVerificacion;
    // Si no tiene folio, generar uno nuevo
    if (!folio) {
      folio = generarFolio(alumnoId);
      // Generar código para el nuevo folio
      codigoVerificacion = generarCodigoVerificacion(alumnoId, folio);
    } else {
      // Si tiene folio, validar que el código sea correcto (determinístico)
      const codigoEsperado = generarCodigoVerificacion(alumnoId, folio);
      const codigoActual = codigoVerificacion?.trim().toUpperCase();
      
      // Si el código no existe o no coincide con el determinístico, regenerarlo
      if (!codigoVerificacion || codigoActual !== codigoEsperado) {
        codigoVerificacion = codigoEsperado;
      }
    }
    
    // Solo intentar guardar si hay cambios y el usuario está autenticado
    // Para usuarios no autenticados, simplemente usar los valores existentes o generados
    const necesitaGuardarFolio = !alumnoData.folioCertificado;
    const codigoActual = alumnoData.codigoVerificacion?.trim().toUpperCase();
    const codigoEsperado = codigoVerificacion.trim().toUpperCase();
    const necesitaGuardarCodigo = !alumnoData.codigoVerificacion || codigoActual !== codigoEsperado;
    
    // Verificar si hay usuario autenticado
    const auth = getAuth();
    const usuarioAutenticado = auth.currentUser != null;
    
    if ((necesitaGuardarFolio || necesitaGuardarCodigo) && usuarioAutenticado) {
      const updateData = {};
      if (necesitaGuardarFolio) {
        updateData.folioCertificado = folio;
        updateData.fechaEmisionCertificado = serverTimestamp();
      }
      if (necesitaGuardarCodigo) {
        updateData.codigoVerificacion = codigoVerificacion;
        updateData.fechaActualizacionCodigo = serverTimestamp();
      }
      
      // Guardar en Firestore solo si el usuario está autenticado
      try {
        await updateDoc(doc(db, 'alumnos', alumnoId), updateData);
      } catch (error) {
        console.warn('⚠️ No se pudo guardar código de verificación (usuario no autenticado o sin permisos):', error);
        // No es crítico si no se puede guardar para usuarios no autenticados
        // Los valores generados se usarán para mostrar el certificado
      }
    } else if (necesitaGuardarFolio || necesitaGuardarCodigo) {
      // Si necesita guardar pero no hay usuario autenticado, solo loguear
      console.warn('⚠️ Certificado necesita actualización pero el usuario no está autenticado. Usando valores generados.');
    }

    const graduacionDoc = await getDoc(doc(db, 'graduacion', alumnoId));
    const graduacionDataRaw = graduacionDoc.exists() ? graduacionDoc.data() : null;
    const graduacionCompleta = Boolean(graduacionDataRaw?.progresoCompleto);
    const nivelGraduacion = graduacionDataRaw?.nivelGraduacion || alumnoData.nivel || null;
    const programaGraduacion = graduacionDataRaw?.programaGraduacion || alumnoData.programa || null;
    const fechaGraduacion = ensureDate(graduacionDataRaw?.fechaGraduacion);
    const fechaIngresoNivelGraduacion = ensureDate(graduacionDataRaw?.fechaIngresoNivel);
    const fechaEgresoNivelGraduacion = ensureDate(graduacionDataRaw?.fechaEgresoNivel);
    const fechaIngresoActual = ensureDate(alumnoData.fechaIngreso);
    const fechaEgresoActual = ensureDate(alumnoData.fechaEgresoEstimada || alumnoData.fechaEgreso);
    const nivelActual = alumnoData.nivel || null;
    const estadoActual = alumnoData.estado || 'Activo';
    const estadoParaDocumento = graduacionCompleta ? 'Graduado' : estadoActual;

    // Calcular promedio
    const promedio = await calcularPromedioFinal(alumnoId);

    // Obtener historial de niveles del alumno
    const historialNiveles = Array.isArray(alumnoData.niveles) ? alumnoData.niveles : [];
    
    // Determinar si el alumno tiene múltiples niveles
    // Caso 1: Tiene más de un nivel en el historial
    const tieneMultiplesNivelesHistorial = historialNiveles.length > 1;
    
    // Caso 2: Tiene un nivel completado en el historial y un nivel actual diferente
    const nivelCompletado = historialNiveles.find(n => n.estado === 'completado');
    const tieneNivelCompletadoYActual = nivelCompletado && 
      alumnoData.nivelActualId && 
      nivelCompletado.id !== alumnoData.nivelActualId &&
      alumnoData.nivel &&
      nivelCompletado.nombre !== alumnoData.nivel;
    
    // Caso 3: Está graduado y el nivel de graduación es diferente al nivel actual
    const tieneNivelGraduacionDiferente = graduacionCompleta && 
      nivelGraduacion && 
      nivelActual && 
      nivelGraduacion !== nivelActual;
    
    // Caso 4: Tiene un nivel completado en historial y un nivel activo actual (sin nivelActualId)
    const tieneNivelCompletadoYActivoSinId = nivelCompletado && 
      !alumnoData.nivelActualId && 
      alumnoData.nivel && 
      nivelCompletado.nombre !== alumnoData.nivel;
    
    const tieneMultiplesNiveles = tieneMultiplesNivelesHistorial || 
      tieneNivelCompletadoYActual || 
      tieneNivelGraduacionDiferente || 
      tieneNivelCompletadoYActivoSinId;

    return {
      folio,
      codigoVerificacion,
      promedio,
      graduacion: {
        completa: graduacionCompleta,
        nivel: nivelGraduacion,
        programa: programaGraduacion,
        fechaGraduacion,
        fechaIngresoNivel: fechaIngresoNivelGraduacion || fechaIngresoActual,
        fechaEgresoNivel: fechaEgresoNivelGraduacion || fechaEgresoActual
      },
      alumno: {
        id: alumnoDoc.id,
        nombreCompleto: alumnoData.nombre,
        nivel: graduacionCompleta ? nivelGraduacion : nivelActual,
        nivelActual,
        nivelGraduacion,
        programa: graduacionCompleta ? programaGraduacion : alumnoData.programa || null,
        programaActual: alumnoData.programa || null,
        fechaIngreso: graduacionCompleta ? (fechaIngresoNivelGraduacion || fechaIngresoActual) : fechaIngresoActual,
        fechaEgreso: graduacionCompleta ? (fechaEgresoNivelGraduacion || fechaEgresoActual) : fechaEgresoActual,
        fechaIngresoActual,
        fechaEgresoEstimadaActual: fechaEgresoActual,
        estado: estadoParaDocumento,
        estadoActual,
        fechaGraduacion,
        tieneMultiplesNiveles,
        historialNiveles
      }
    };
  } catch (error) {
    console.error('Error al obtener certificado:', error);
    return null;
  }
};

/**
 * Verifica un certificado usando el folio y código
 */
export const verificarCertificado = async (folio, codigoVerificacion) => {
  try {
    // Normalizar parámetros
    const folioNormalizado = folio?.trim().toUpperCase();
    const codigoNormalizado = codigoVerificacion?.trim().toUpperCase();
    
    if (!folioNormalizado || !codigoNormalizado) {
      console.error('❌ Parámetros inválidos en verificación de certificado');
      return { valido: false, error: 'Folio o código de verificación inválido' };
    }

    // Primero buscar por folio
    const alumnosQuery = query(
      collection(db, 'alumnos'),
      where('folioCertificado', '==', folioNormalizado)
    );
    
    const querySnapshot = await getDocs(alumnosQuery);
    
    if (querySnapshot.empty) {
      console.error('❌ No se encontró certificado con ese folio:', folioNormalizado);
      return { valido: false, error: 'No se encontró un certificado con ese folio' };
    }

    // Verificar que el código coincida
    const alumnoDoc = querySnapshot.docs[0];
    const alumnoData = alumnoDoc.data();
    const codigoGuardado = alumnoData.codigoVerificacion?.trim().toUpperCase();
    
    if (!codigoGuardado) {
      console.error('❌ El documento no tiene código de verificación guardado');
      return { valido: false, error: 'El certificado no tiene código de verificación. Contacte al administrador.' };
    }
    
    if (codigoGuardado !== codigoNormalizado) {
      console.error('❌ Los códigos no coinciden en verificación');
      return { valido: false, error: 'El código de verificación no coincide con el folio proporcionado' };
    }
    const graduacionDoc = await getDoc(doc(db, 'graduacion', alumnoDoc.id));
    const graduacionDataRaw = graduacionDoc.exists() ? graduacionDoc.data() : null;
    const graduacionCompleta = Boolean(graduacionDataRaw?.progresoCompleto);
    const nivelGraduacion = graduacionDataRaw?.nivelGraduacion || alumnoData.nivel || null;

    return {
      valido: true,
      alumno: {
        id: alumnoDoc.id,
        nombre: alumnoData.nombre,
        nivel: graduacionCompleta ? nivelGraduacion : alumnoData.nivel,
        nivelActual: alumnoData.nivel,
        nivelGraduacion,
        fechaIngreso: graduacionCompleta
          ? ensureDate(graduacionDataRaw?.fechaIngresoNivel) || ensureDate(alumnoData.fechaIngreso)
          : ensureDate(alumnoData.fechaIngreso),
        fechaEgreso: graduacionCompleta
          ? ensureDate(graduacionDataRaw?.fechaEgresoNivel) || ensureDate(alumnoData.fechaEgresoEstimada || alumnoData.fechaEgreso)
          : ensureDate(alumnoData.fechaEgresoEstimada || alumnoData.fechaEgreso),
        estado: graduacionCompleta ? 'Graduado' : alumnoData.estado || 'Activo',
        fechaGraduacion: ensureDate(graduacionDataRaw?.fechaGraduacion)
      }
    };
  } catch (error) {
    console.error('❌ Error al verificar certificado:', error);
    console.error('Detalles del error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    // Proporcionar mensajes de error más específicos
    let mensajeError = 'Error al verificar el certificado';
    if (error.code === 'permission-denied') {
      mensajeError = 'No tienes permisos para verificar este certificado. Por favor, contacta al administrador.';
    } else if (error.code === 'unavailable') {
      mensajeError = 'El servicio no está disponible en este momento. Por favor, intenta más tarde.';
    } else {
      mensajeError = error.message || 'Error desconocido al verificar el certificado';
    }
    
    return { valido: false, error: mensajeError };
  }
};

