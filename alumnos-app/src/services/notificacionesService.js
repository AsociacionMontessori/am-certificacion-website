import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const normalizarTexto = (valor) => (valor || '').toString().trim().toLowerCase();

/**
 * Obtiene todas las materias que inician en 7 días o menos
 * @param {Array} alumnosAsignados - Lista de IDs de alumnos asignados (para usuarios de grupos)
 * @returns {Promise<Array>} Array de materias próximas con información del alumno
 */
export const getMateriasProximas = async (alumnosAsignados = null) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Calcular la fecha límite (7 días desde hoy)
    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() + 7);
    fechaLimite.setHours(23, 59, 59, 999);

    let materiasSnapshot;
    
    // Si hay alumnos asignados (usuario de grupos), hacer consultas individuales
    if (alumnosAsignados && Array.isArray(alumnosAsignados) && alumnosAsignados.length > 0) {
      const materiasPromises = alumnosAsignados.map(async (alumnoId) => {
        try {
          const materiasQuery = query(
            collection(db, 'materias'),
            where('alumnoId', '==', alumnoId)
          );
          return await getDocs(materiasQuery);
        } catch (error) {
          console.warn(`Error al obtener materias del alumno ${alumnoId}:`, error);
          return { docs: [] };
        }
      });
      
      const snapshots = await Promise.all(materiasPromises);
      // Combinar todos los documentos
      materiasSnapshot = {
        docs: snapshots.flatMap(snapshot => snapshot.docs)
      };
    } else {
      // Para admin/directivo: obtener todas las materias
      const materiasQuery = query(collection(db, 'materias'));
      materiasSnapshot = await getDocs(materiasQuery);
    }

    const materiasProximas = [];

    for (const materiaDoc of materiasSnapshot.docs) {
      const materiaData = { id: materiaDoc.id, ...materiaDoc.data() };
      
      // Convertir fechaInicio a Date si es necesario
      let fechaInicio = null;
      if (materiaData.fechaInicio) {
        if (materiaData.fechaInicio.toDate) {
          fechaInicio = materiaData.fechaInicio.toDate();
        } else if (materiaData.fechaInicio instanceof Date) {
          fechaInicio = materiaData.fechaInicio;
        } else if (materiaData.fechaInicio.seconds) {
          fechaInicio = new Date(materiaData.fechaInicio.seconds * 1000);
        }
      }

      // Verificar si la fecha está en el rango de 7 días
      if (fechaInicio && fechaInicio >= hoy && fechaInicio <= fechaLimite) {
        // Obtener información del alumno
        let alumnoData = null;
        if (materiaData.alumnoId) {
          try {
            const alumnoDoc = await getDoc(doc(db, 'alumnos', materiaData.alumnoId));
            if (alumnoDoc.exists()) {
              alumnoData = { id: alumnoDoc.id, ...alumnoDoc.data() };
            }
          } catch (error) {
            console.warn('Error al obtener datos del alumno:', error);
          }
        }

        // Calcular días restantes
        const diasRestantes = Math.ceil((fechaInicio - hoy) / (1000 * 60 * 60 * 24));

        materiasProximas.push({
          materia: materiaData,
          alumno: alumnoData,
          fechaInicio,
          diasRestantes
        });
      }
    }

    // Ordenar por fecha de inicio (más próximas primero)
    materiasProximas.sort((a, b) => a.fechaInicio - b.fechaInicio);

    return materiasProximas;
  } catch (error) {
    console.error('Error al obtener materias próximas:', error);
    return [];
  }
};

export const getMateriasPendientesCalificar = async () => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const materiasSnapshot = await getDocs(collection(db, 'materias'));
    const calificacionesSnapshot = await getDocs(collection(db, 'calificaciones'));

    const calificacionesMap = new Map();
    calificacionesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const clave = `${data.alumnoId || ''}__${normalizarTexto(data.materia)}`;
      if (!calificacionesMap.has(clave)) {
        calificacionesMap.set(clave, []);
      }
      calificacionesMap.get(clave).push({ ...data, id: docSnap.id });
    });

    const alumnosCache = new Map();
    const pendientes = [];

    const obtenerAlumno = async (alumnoId) => {
      if (!alumnoId) {
        return null;
      }
      if (alumnosCache.has(alumnoId)) {
        return alumnosCache.get(alumnoId);
      }
      try {
        const alumnoDoc = await getDoc(doc(db, 'alumnos', alumnoId));
        if (alumnoDoc.exists()) {
          const alumnoData = { id: alumnoDoc.id, ...alumnoDoc.data() };
          alumnosCache.set(alumnoId, alumnoData);
          return alumnoData;
        }
      } catch (error) {
        console.warn('Error al obtener datos del alumno:', error);
      }
      alumnosCache.set(alumnoId, null);
      return null;
    };

    for (const materiaDoc of materiasSnapshot.docs) {
      const materiaData = { id: materiaDoc.id, ...materiaDoc.data() };

      let fechaFin = null;
      if (materiaData.fechaFin) {
        if (typeof materiaData.fechaFin.toDate === 'function') {
          fechaFin = materiaData.fechaFin.toDate();
        } else if (materiaData.fechaFin instanceof Date) {
          fechaFin = materiaData.fechaFin;
        } else if (materiaData.fechaFin.seconds) {
          fechaFin = new Date(materiaData.fechaFin.seconds * 1000);
        } else {
          const parsed = new Date(materiaData.fechaFin);
          if (!Number.isNaN(parsed.getTime())) {
            fechaFin = parsed;
          }
        }
      }

      if (!fechaFin || fechaFin >= hoy) {
        continue;
      }

      const claveCalificacion = `${materiaData.alumnoId || ''}__${normalizarTexto(materiaData.nombre)}`;
      const calificacionesAsociadas = calificacionesMap.get(claveCalificacion) || [];
      const calificacionNumerica = calificacionesAsociadas.reduce((max, item) => {
        const numero = Number(item.calificacion);
        if (Number.isNaN(numero)) {
          return max;
        }
        return Math.max(max, numero);
      }, Number.NEGATIVE_INFINITY);

      const tieneCalificacion = calificacionesAsociadas.length > 0;
      const calificacionMenorDiez = !tieneCalificacion || calificacionNumerica < 10;
      const estadoCompletado = materiaData.estado === 'Completada';

      if (!calificacionMenorDiez || estadoCompletado) {
        continue;
      }

      const alumnoData = await obtenerAlumno(materiaData.alumnoId);
      const diasAtraso = Math.max(1, Math.ceil((hoy - fechaFin) / (1000 * 60 * 60 * 24)));

      pendientes.push({
        materia: materiaData,
        alumno: alumnoData,
        diasAtraso,
        calificacion: tieneCalificacion && Number.isFinite(calificacionNumerica) ? calificacionNumerica : null,
        fechaFin
      });
    }

    pendientes.sort((a, b) => b.diasAtraso - a.diasAtraso);

    return pendientes;
  } catch (error) {
    console.error('Error al obtener materias pendientes de calificar:', error);
    return [];
  }
};

/**
 * Formatea la información de materias próximas para el email
 * @param {Array} materiasProximas - Array de materias próximas
 * @returns {string} HTML formateado para el email
 */
export const formatearMateriasParaEmail = (materiasProximas) => {
  if (materiasProximas.length === 0) {
    return '<p>No hay materias próximas a iniciar.</p>';
  }

  let html = `
    <h2>Materias Próximas a Iniciar (7 días o menos)</h2>
    <p>Se encontraron ${materiasProximas.length} materia(s) que requieren atención:</p>
    <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th>Alumno</th>
          <th>Materia</th>
          <th>Fecha de Inicio</th>
          <th>Días Restantes</th>
          <th>Nivel</th>
        </tr>
      </thead>
      <tbody>
  `;

  materiasProximas.forEach((item) => {
    const nombreAlumno = item.alumno?.nombre || 'N/A';
    const nombreMateria = item.materia?.nombre || 'N/A';
    const fechaFormateada = item.fechaInicio.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const nivel = item.alumno?.nivel || item.materia?.nivel || 'N/A';
    const diasRestantes = item.diasRestantes;
    const colorFila = diasRestantes <= 3 ? '#fee2e2' : diasRestantes <= 5 ? '#fef3c7' : '#dbeafe';

    html += `
      <tr style="background-color: ${colorFila};">
        <td>${nombreAlumno}</td>
        <td>${nombreMateria}</td>
        <td>${fechaFormateada}</td>
        <td><strong>${diasRestantes} día(s)</strong></td>
        <td>${nivel}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
    <p style="margin-top: 20px;">
      <strong>Acción requerida:</strong> Por favor, sube las clases nuevas al Classroom para estos alumnos.
    </p>
  `;

  return html;
};

/**
 * Genera el texto plano para el email
 * @param {Array} materiasProximas - Array de materias próximas
 * @returns {string} Texto plano para el email
 */
export const formatearMateriasParaEmailTexto = (materiasProximas) => {
  if (materiasProximas.length === 0) {
    return 'No hay materias próximas a iniciar.';
  }

  let texto = `MATERIAS PRÓXIMAS A INICIAR (7 DÍAS O MENOS)\n\n`;
  texto += `Se encontraron ${materiasProximas.length} materia(s) que requieren atención:\n\n`;

  materiasProximas.forEach((item, index) => {
    const nombreAlumno = item.alumno?.nombre || 'N/A';
    const nombreMateria = item.materia?.nombre || 'N/A';
    const fechaFormateada = item.fechaInicio.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const nivel = item.alumno?.nivel || item.materia?.nivel || 'N/A';
    const diasRestantes = item.diasRestantes;

    texto += `${index + 1}. ${nombreMateria}\n`;
    texto += `   Alumno: ${nombreAlumno}\n`;
    texto += `   Fecha de inicio: ${fechaFormateada}\n`;
    texto += `   Días restantes: ${diasRestantes} día(s)\n`;
    texto += `   Nivel: ${nivel}\n\n`;
  });

  texto += `ACCIÓN REQUERIDA: Por favor, sube las clases nuevas al Classroom para estos alumnos.\n`;

  return texto;
};

