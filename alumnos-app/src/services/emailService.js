import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatearMateriasParaEmail, formatearMateriasParaEmailTexto } from './notificacionesService';

/**
 * Envía una notificación por email sobre materias próximas a iniciar
 * Intenta usar Cloud Functions de Firebase, si no está disponible usa mailto
 * 
 * @param {Array} materiasProximas - Array de materias próximas
 * @param {string} adminEmail - Email del administrador
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendNotificacionMateriasProximas = async (materiasProximas, adminEmail) => {
  try {
    if (!materiasProximas || materiasProximas.length === 0) {
      return { success: false, error: 'No hay materias próximas para notificar' };
    }

    if (!adminEmail) {
      return { success: false, error: 'Email del administrador no proporcionado' };
    }

    // Formatear contenido del email
    const htmlContent = formatearMateriasParaEmail(materiasProximas);
    const textContent = formatearMateriasParaEmailTexto(materiasProximas);

    try {
      // Intentar guardar en Firestore para Cloud Function
      const emailData = {
        to: adminEmail,
        subject: `⚠️ Materias Próximas a Iniciar - ${materiasProximas.length} materia(s) requieren atención`,
        html: htmlContent,
        text: textContent,
        tipo: 'materias_proximas',
        materiasCount: materiasProximas.length,
        fechaCreacion: serverTimestamp(),
        estado: 'pendiente',
        intentos: 0
      };

      // Guardar en colección de emails pendientes
      // Una Cloud Function puede escuchar esta colección y enviar los emails
      await addDoc(collection(db, 'emails_pendientes'), emailData);

      // También guardar en historial de notificaciones
      await addDoc(collection(db, 'notificaciones_historial'), {
        tipo: 'materias_proximas',
        email: adminEmail,
        materiasCount: materiasProximas.length,
        materias: materiasProximas.map(item => ({
          materiaId: item.materia.id,
          materiaNombre: item.materia.nombre,
          alumnoId: item.alumno?.id,
          alumnoNombre: item.alumno?.nombre,
          fechaInicio: item.fechaInicio,
          diasRestantes: item.diasRestantes
        })),
        fechaEnvio: serverTimestamp(),
        estado: 'registrado'
      });

      return { 
        success: true, 
        message: 'Notificación registrada. El email se enviará automáticamente.',
        metodo: 'cloud_function'
      };
    } catch (firestoreError) {
      console.warn('No se pudo registrar en Firestore, usando mailto:', firestoreError);
      
      // Fallback: usar mailto
      const mailtoSuccess = sendNotificacionMailto(materiasProximas, adminEmail);
      
      if (mailtoSuccess) {
        return { 
          success: true, 
          message: 'Se abrió tu cliente de email. El email está listo para enviar.',
          metodo: 'mailto'
        };
      } else {
        throw new Error('No se pudo abrir el cliente de email');
      }
    }
  } catch (error) {
    console.error('Error al enviar notificación de email:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Intenta enviar el email usando mailto como fallback
 * Esto abre el cliente de email predeterminado del usuario
 * 
 * @param {Array} materiasProximas - Array de materias próximas
 * @param {string} adminEmail - Email del administrador
 * @returns {Promise<boolean>} True si se abrió el cliente de email
 */
export const sendNotificacionMailto = (materiasProximas, adminEmail) => {
  try {
    const textContent = formatearMateriasParaEmailTexto(materiasProximas);
    const subject = `⚠️ Materias Próximas a Iniciar - ${materiasProximas.length} materia(s) requieren atención`;
    
    const mailtoLink = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textContent)}`;
    
    window.location.href = mailtoLink;
    return true;
  } catch (error) {
    console.error('Error al abrir cliente de email:', error);
    return false;
  }
};

/**
 * Verifica si hay una Cloud Function configurada para enviar emails
 * @returns {Promise<boolean>} True si hay función configurada
 */
export const verificarCloudFunction = async () => {
  try {
    // Verificar si hay emails pendientes recientes que se hayan procesado
    const querySnapshot = await getDocs(
      query(
        collection(db, 'emails_pendientes'),
        where('estado', '==', 'enviado'),
        orderBy('fechaCreacion', 'desc'),
        limit(1)
      )
    );
    
    return !querySnapshot.empty;
  } catch (error) {
    console.warn('No se pudo verificar Cloud Function:', error);
    return false;
  }
};

