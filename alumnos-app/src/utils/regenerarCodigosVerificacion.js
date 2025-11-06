import { collection, getDocs, updateDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

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
 * Genera un código de verificación único (determinístico)
 */
const generarCodigoVerificacion = (alumnoId, folio) => {
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
 * Regenera los códigos de verificación de todos los alumnos que tienen folio
 */
export const regenerarTodosLosCodigos = async () => {
  try {
    console.log('🔄 Iniciando regeneración de códigos de verificación...');
    
    // Obtener todos los alumnos
    const alumnosSnapshot = await getDocs(collection(db, 'alumnos'));
    
    let procesados = 0;
    let actualizados = 0;
    let errores = 0;
    const resultados = [];

    for (const alumnoDoc of alumnosSnapshot.docs) {
      procesados++;
      const alumnoData = alumnoDoc.data();
      const alumnoId = alumnoDoc.id;
      const folio = alumnoData.folioCertificado;
      
      if (!folio) {
        console.log(`⏭️  Alumno ${alumnoData.nombre || alumnoId}: Sin folio, omitiendo...`);
        continue;
      }

      try {
        // Generar nuevo código determinístico
        const nuevoCodigo = generarCodigoVerificacion(alumnoId, folio);
        
        // Verificar si el código ya es correcto
        const codigoActual = alumnoData.codigoVerificacion;
        if (codigoActual && codigoActual.trim().toUpperCase() === nuevoCodigo) {
          console.log(`✅ Alumno ${alumnoData.nombre || alumnoId}: Código ya es correcto`);
          resultados.push({
            alumno: alumnoData.nombre || alumnoId,
            folio,
            estado: 'ya_correcto',
            codigo: nuevoCodigo
          });
          continue;
        }

        // Actualizar el código - usar setDoc con merge como fallback
        try {
          await updateDoc(doc(db, 'alumnos', alumnoId), {
            codigoVerificacion: nuevoCodigo,
            fechaActualizacionCodigo: serverTimestamp()
          });
          console.log(`✅ Código actualizado en Firestore para ${alumnoData.nombre || alumnoId}`);
        } catch (updateError) {
          // Si updateDoc falla, intentar con setDoc
          console.warn(`⚠️ updateDoc falló, intentando con setDoc para ${alumnoData.nombre || alumnoId}:`, updateError);
          try {
            await setDoc(doc(db, 'alumnos', alumnoId), {
              codigoVerificacion: nuevoCodigo,
              fechaActualizacionCodigo: serverTimestamp()
            }, { merge: true });
            console.log(`✅ Código guardado con setDoc para ${alumnoData.nombre || alumnoId}`);
          } catch (setDocError) {
            throw setDocError;
          }
        }

        actualizados++;
        console.log(`✅ Alumno ${alumnoData.nombre || alumnoId}: Código regenerado`);
        resultados.push({
          alumno: alumnoData.nombre || alumnoId,
          folio,
          estado: 'actualizado',
          codigoAnterior: codigoActual,
          codigoNuevo: nuevoCodigo
        });
      } catch (error) {
        errores++;
        console.error(`❌ Error al procesar ${alumnoData.nombre || alumnoId}:`, error);
        resultados.push({
          alumno: alumnoData.nombre || alumnoId,
          folio,
          estado: 'error',
          error: error.message
        });
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`Total procesados: ${procesados}`);
    console.log(`Actualizados: ${actualizados}`);
    console.log(`Ya correctos: ${procesados - actualizados - errores}`);
    console.log(`Errores: ${errores}`);

    return {
      success: true,
      total: procesados,
      actualizados,
      yaCorrectos: procesados - actualizados - errores,
      errores,
      resultados
    };
  } catch (error) {
    console.error('❌ Error general:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

