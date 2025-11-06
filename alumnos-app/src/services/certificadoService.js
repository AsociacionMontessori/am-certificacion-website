import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
  return `CERT-${timestamp.toString(36).toUpperCase().substring(0, 6)}-${random}`;
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
    let necesitaGuardar = false;
    
    // Si no tiene folio, generar uno nuevo
    if (!folio) {
      folio = generarFolio(alumnoId);
      // Generar código para el nuevo folio
      codigoVerificacion = generarCodigoVerificacion(alumnoId, folio);
      necesitaGuardar = true;
    } else {
      // Si tiene folio, validar que el código sea correcto (determinístico)
      const codigoEsperado = generarCodigoVerificacion(alumnoId, folio);
      const codigoActual = codigoVerificacion?.trim().toUpperCase();
      
      // Si el código no existe o no coincide con el determinístico, regenerarlo
      if (!codigoVerificacion || codigoActual !== codigoEsperado) {
        codigoVerificacion = codigoEsperado;
        necesitaGuardar = true;
      }
    }
    
    // SIEMPRE guardar el código de verificación (asegurar que esté en la BD)
    // Verificar si necesita guardar
    const necesitaGuardarFolio = !alumnoData.folioCertificado;
    const codigoActual = alumnoData.codigoVerificacion?.trim().toUpperCase();
    const codigoEsperado = codigoVerificacion.trim().toUpperCase();
    const necesitaGuardarCodigo = !alumnoData.codigoVerificacion || codigoActual !== codigoEsperado;
    
    if (necesitaGuardarFolio || necesitaGuardarCodigo) {
      const updateData = {};
      if (necesitaGuardarFolio) {
        updateData.folioCertificado = folio;
        updateData.fechaEmisionCertificado = serverTimestamp();
      }
      if (necesitaGuardarCodigo) {
        updateData.codigoVerificacion = codigoVerificacion;
        updateData.fechaActualizacionCodigo = serverTimestamp();
      }
      
      // Guardar en Firestore
      try {
        await updateDoc(doc(db, 'alumnos', alumnoId), updateData);
        console.log(`✅ Código de verificación guardado para alumno ${alumnoId}:`, codigoVerificacion);
      } catch (error) {
        console.error('❌ Error al guardar código de verificación:', error);
        // Intentar con setDoc como fallback
        try {
          await setDoc(doc(db, 'alumnos', alumnoId), updateData, { merge: true });
          console.log(`✅ Código guardado con setDoc para alumno ${alumnoId}`);
        } catch (setDocError) {
          console.error('❌ Error al guardar con setDoc:', setDocError);
        }
      }
    }

    // Calcular promedio
    const promedio = await calcularPromedioFinal(alumnoId);

    return {
      folio,
      codigoVerificacion,
      promedio,
      alumno: {
        id: alumnoDoc.id,
        nombreCompleto: alumnoData.nombre,
        nivel: alumnoData.nivel,
        fechaIngreso: alumnoData.fechaIngreso,
        fechaEgreso: alumnoData.fechaEgresoEstimada || alumnoData.fechaEgreso,
        estado: alumnoData.estado
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
      return { valido: false, error: 'Folio o código de verificación inválido' };
    }

    // Primero buscar por folio
    const alumnosQuery = query(
      collection(db, 'alumnos'),
      where('folioCertificado', '==', folioNormalizado)
    );
    
    const querySnapshot = await getDocs(alumnosQuery);
    
    if (querySnapshot.empty) {
      return { valido: false, error: 'No se encontró un certificado con ese folio' };
    }

    // Verificar que el código coincida
    const alumnoDoc = querySnapshot.docs[0];
    const alumnoData = alumnoDoc.data();
    const codigoGuardado = alumnoData.codigoVerificacion?.trim().toUpperCase();
    
    if (codigoGuardado !== codigoNormalizado) {
      return { valido: false, error: 'El código de verificación no coincide' };
    }
    
    return {
      valido: true,
      alumno: {
        id: alumnoDoc.id,
        nombre: alumnoData.nombre,
        nivel: alumnoData.nivel,
        fechaIngreso: alumnoData.fechaIngreso,
        fechaEgreso: alumnoData.fechaEgresoEstimada || alumnoData.fechaEgreso,
        estado: alumnoData.estado
      }
    };
  } catch (error) {
    console.error('Error al verificar certificado:', error);
    return { valido: false, error: error.message };
  }
};

