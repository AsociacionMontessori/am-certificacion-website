import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Mensajes que administración publica para que el alumno los vea en su
 * tablero al iniciar sesión.
 *
 * Un mensaje va dirigido a todos los alumnos (`destino: 'todos'`) o a uno solo
 * (`destino: 'alumno'` + `alumnoId`). El alumno nunca escribe en el mensaje:
 * cuando lo cierra se guarda un acuse en `mensajes/{id}/lecturas/{alumnoId}`,
 * y por eso deja de aparecerle sin que pueda alterar lo que ven los demás.
 */

export const DESTINO_TODOS = 'todos';
export const DESTINO_ALUMNO = 'alumno';

export const TIPOS_MENSAJE = [
  { valor: 'info', etiqueta: 'Informativo' },
  { valor: 'importante', etiqueta: 'Importante' }
];

const MENSAJES = 'mensajes';
const LECTURAS = 'lecturas';
const PLANTILLAS = 'mensajesPlantillas';

/** Convierte a Date lo que Firestore puede devolver como fecha. */
export const aFecha = (valor) => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor.toDate === 'function') return valor.toDate();
  if (valor.seconds) return new Date(valor.seconds * 1000);
  const fecha = new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * Un mensaje está vigente si está activo y no ha pasado su fecha de fin.
 * Sin fecha de fin, sigue vigente hasta que administración lo desactive.
 */
export const mensajeVigente = (mensaje, ahora = new Date()) => {
  if (!mensaje?.activo) return false;
  const fin = aFecha(mensaje.fechaFin);
  return !fin || fin >= ahora;
};

/** Convierte el valor de un <input type="date"> al final de ese día. */
export const fechaFinDesdeInput = (valor) => {
  if (!valor) return null;
  const fecha = new Date(`${valor}T23:59:59`);
  return isNaN(fecha.getTime()) ? null : Timestamp.fromDate(fecha);
};

/**
 * Publica un mensaje nuevo. Solo administración puede hacerlo (las reglas de
 * Firestore lo exigen; aquí solo validamos que llegue con contenido).
 */
export const crearMensaje = async (datos, creadoPor = null) => {
  try {
    const titulo = (datos?.titulo || '').trim();
    const cuerpo = (datos?.cuerpo || '').trim();
    const destino = datos?.destino === DESTINO_ALUMNO ? DESTINO_ALUMNO : DESTINO_TODOS;
    const alumnoId = destino === DESTINO_ALUMNO ? (datos?.alumnoId || null) : null;

    if (!titulo) return { success: false, error: 'El título es obligatorio' };
    if (!cuerpo) return { success: false, error: 'El mensaje es obligatorio' };
    if (destino === DESTINO_ALUMNO && !alumnoId) {
      return { success: false, error: 'Selecciona al alumno destinatario' };
    }

    const mensaje = {
      titulo,
      cuerpo,
      destino,
      alumnoId,
      alumnoNombre: destino === DESTINO_ALUMNO ? (datos?.alumnoNombre || '') : '',
      tipo: datos?.tipo === 'importante' ? 'importante' : 'info',
      activo: true,
      fechaFin: datos?.fechaFin || null,
      creadoPor,
      creadoEn: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, MENSAJES), mensaje);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear el mensaje:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Todos los mensajes publicados, con cuántos alumnos ya los cerraron.
 * Se ordenan en el cliente para no depender de índices compuestos nuevos.
 */
export const obtenerMensajes = async () => {
  try {
    const snapshot = await getDocs(collection(db, MENSAJES));
    const mensajes = await Promise.all(
      snapshot.docs.map(async (mensajeDoc) => {
        let lecturas = 0;
        try {
          const acuses = await getDocs(collection(db, MENSAJES, mensajeDoc.id, LECTURAS));
          lecturas = acuses.size;
        } catch {
          // El conteo es informativo: si falla, se muestra el mensaje igual.
        }
        return { id: mensajeDoc.id, ...mensajeDoc.data(), lecturas };
      })
    );

    mensajes.sort((a, b) => {
      const fechaA = aFecha(a.creadoEn)?.getTime() || 0;
      const fechaB = aFecha(b.creadoEn)?.getTime() || 0;
      return fechaB - fechaA;
    });

    return { success: true, mensajes };
  } catch (error) {
    console.error('Error al obtener los mensajes:', error);
    return { success: false, error: error.message, mensajes: [] };
  }
};

/**
 * Los mensajes dirigidos a un alumno, para la tarjeta de su ficha. Incluye si
 * ya cerró cada uno, que es lo único que administración necesita saber de la
 * lectura cuando el mensaje va a una sola persona.
 */
export const obtenerMensajesDeAlumno = async (alumnoId) => {
  if (!alumnoId) return { success: true, mensajes: [] };

  try {
    const snapshot = await getDocs(
      query(collection(db, MENSAJES), where('alumnoId', '==', alumnoId))
    );

    const mensajes = await Promise.all(
      snapshot.docs.map(async (mensajeDoc) => {
        let cerrado = false;
        try {
          const acuse = await getDoc(doc(db, MENSAJES, mensajeDoc.id, LECTURAS, alumnoId));
          cerrado = acuse.exists();
        } catch {
          // El acuse es informativo: si no se puede leer, se asume sin cerrar.
        }
        return { id: mensajeDoc.id, ...mensajeDoc.data(), cerrado };
      })
    );

    mensajes.sort((a, b) => {
      const fechaA = aFecha(a.creadoEn)?.getTime() || 0;
      const fechaB = aFecha(b.creadoEn)?.getTime() || 0;
      return fechaB - fechaA;
    });

    return { success: true, mensajes };
  } catch (error) {
    console.error('Error al obtener los mensajes del alumno:', error);
    return { success: false, error: error.message, mensajes: [] };
  }
};

/** Activa o desactiva un mensaje sin borrarlo. */
export const cambiarEstadoMensaje = async (mensajeId, activo) => {
  try {
    await updateDoc(doc(db, MENSAJES, mensajeId), { activo: Boolean(activo) });
    return { success: true };
  } catch (error) {
    console.error('Error al cambiar el estado del mensaje:', error);
    return { success: false, error: error.message };
  }
};

/** Borra el mensaje. Los acuses de lectura quedan huérfanos y son inocuos. */
export const eliminarMensaje = async (mensajeId) => {
  try {
    await deleteDoc(doc(db, MENSAJES, mensajeId));
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar el mensaje:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mensajes que le tocan al alumno ahora mismo: los generales y los suyos,
 * vigentes y sin cerrar. Son dos consultas porque las reglas de Firestore
 * autorizan cada documento devuelto, y así ninguna pide de más.
 */
export const obtenerMensajesParaAlumno = async (alumnoId) => {
  if (!alumnoId) return [];

  const mensajesRef = collection(db, MENSAJES);
  const [generales, dirigidos] = await Promise.all([
    getDocs(query(mensajesRef, where('destino', '==', DESTINO_TODOS), where('activo', '==', true))),
    getDocs(query(mensajesRef, where('alumnoId', '==', alumnoId), where('activo', '==', true)))
  ]);

  const porId = new Map();
  [...generales.docs, ...dirigidos.docs].forEach((mensajeDoc) => {
    porId.set(mensajeDoc.id, { id: mensajeDoc.id, ...mensajeDoc.data() });
  });

  const ahora = new Date();
  const vigentes = [...porId.values()].filter((mensaje) => mensajeVigente(mensaje, ahora));

  const sinCerrar = await Promise.all(
    vigentes.map(async (mensaje) => {
      try {
        const acuse = await getDoc(doc(db, MENSAJES, mensaje.id, LECTURAS, alumnoId));
        return acuse.exists() ? null : mensaje;
      } catch {
        // Si no se puede leer el acuse, mejor mostrarlo de más que ocultarlo.
        return mensaje;
      }
    })
  );

  return sinCerrar
    .filter(Boolean)
    .sort((a, b) => {
      const fechaA = aFecha(a.creadoEn)?.getTime() || 0;
      const fechaB = aFecha(b.creadoEn)?.getTime() || 0;
      return fechaB - fechaA;
    });
};

/**
 * Mensajes reutilizables.
 *
 * Existen porque el mismo aviso se le manda a varios alumnos por separado
 * —un pago pendiente, un documento faltante— y volver a escribirlo cada vez
 * era trabajo repetido. Guardan solo el texto: la fecha de fin depende de
 * cuándo se manda, no de la plantilla.
 */
export const obtenerPlantillas = async () => {
  try {
    const snapshot = await getDocs(collection(db, PLANTILLAS));
    const plantillas = snapshot.docs.map((plantillaDoc) => ({
      id: plantillaDoc.id,
      ...plantillaDoc.data()
    }));
    plantillas.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''));
    return { success: true, plantillas };
  } catch (error) {
    console.error('Error al obtener los mensajes guardados:', error);
    return { success: false, error: error.message, plantillas: [] };
  }
};

/**
 * Guarda el texto para volver a usarlo. Si ya hay uno con el mismo título lo
 * actualiza, para que la lista no se llene de copias casi iguales.
 */
export const guardarPlantilla = async (datos, creadoPor = null) => {
  try {
    const titulo = (datos?.titulo || '').trim();
    const cuerpo = (datos?.cuerpo || '').trim();
    if (!titulo) return { success: false, error: 'Escribe el título antes de guardarlo' };
    if (!cuerpo) return { success: false, error: 'Escribe el mensaje antes de guardarlo' };

    const tipo = datos?.tipo === 'importante' ? 'importante' : 'info';
    const { plantillas } = await obtenerPlantillas();
    const existente = plantillas.find(
      (plantilla) => (plantilla.titulo || '').trim().toLowerCase() === titulo.toLowerCase()
    );

    if (existente) {
      await updateDoc(doc(db, PLANTILLAS, existente.id), {
        titulo,
        cuerpo,
        tipo,
        actualizadoEn: serverTimestamp()
      });
      return { success: true, id: existente.id, actualizada: true };
    }

    const docRef = await addDoc(collection(db, PLANTILLAS), {
      titulo,
      cuerpo,
      tipo,
      creadoPor,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    });
    return { success: true, id: docRef.id, actualizada: false };
  } catch (error) {
    console.error('Error al guardar el mensaje reutilizable:', error);
    return { success: false, error: error.message };
  }
};

export const eliminarPlantilla = async (plantillaId) => {
  try {
    await deleteDoc(doc(db, PLANTILLAS, plantillaId));
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar el mensaje guardado:', error);
    return { success: false, error: error.message };
  }
};

/** Acusa que el alumno cerró el mensaje: ya no vuelve a aparecerle. */
export const marcarMensajeCerrado = async (mensajeId, alumnoId) => {
  if (!mensajeId || !alumnoId) return { success: false, error: 'Datos incompletos' };
  try {
    await setDoc(doc(db, MENSAJES, mensajeId, LECTURAS, alumnoId), {
      cerradoEn: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al marcar el mensaje como leído:', error);
    return { success: false, error: error.message };
  }
};
