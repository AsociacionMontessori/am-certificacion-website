import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Obtiene todos los niveles desde Firestore
 */
export const obtenerNiveles = async () => {
  try {
    const nivelesRef = collection(db, 'niveles');
    const q = query(nivelesRef, orderBy('nombre', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const niveles = [];
    querySnapshot.forEach((doc) => {
      niveles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      niveles
    };
  } catch (error) {
    console.error('Error al obtener niveles:', error);
    return {
      success: false,
      error: error.message,
      niveles: []
    };
  }
};

/**
 * Crea un nuevo nivel en Firestore
 */
export const crearNivel = async (datosNivel) => {
  try {
    const { nombre, descripcion } = datosNivel;
    
    if (!nombre || nombre.trim() === '') {
      return {
        success: false,
        error: 'El nombre del nivel es requerido'
      };
    }
    
    // Verificar si ya existe un nivel con ese nombre
    const nivelesExistentes = await obtenerNiveles();
    if (nivelesExistentes.success) {
      const existe = nivelesExistentes.niveles.some(
        n => n.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
      );
      if (existe) {
        return {
          success: false,
          error: 'Ya existe un nivel con ese nombre'
        };
      }
    }
    
    const nivelData = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      fechaCreacion: serverTimestamp(),
      activo: true
    };
    
    const docRef = await addDoc(collection(db, 'niveles'), nivelData);
    
    return {
      success: true,
      id: docRef.id,
      message: 'Nivel creado exitosamente'
    };
  } catch (error) {
    console.error('Error al crear nivel:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Actualiza un nivel existente
 */
export const actualizarNivel = async (nivelId, datosNivel) => {
  try {
    const { nombre, descripcion, activo } = datosNivel;
    
    if (!nombre || nombre.trim() === '') {
      return {
        success: false,
        error: 'El nombre del nivel es requerido'
      };
    }
    
    // Verificar si ya existe otro nivel con ese nombre
    const nivelesExistentes = await obtenerNiveles();
    if (nivelesExistentes.success) {
      const existe = nivelesExistentes.niveles.some(
        n => n.id !== nivelId && n.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
      );
      if (existe) {
        return {
          success: false,
          error: 'Ya existe otro nivel con ese nombre'
        };
      }
    }
    
    const nivelRef = doc(db, 'niveles', nivelId);
    const updateData = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      fechaActualizacion: serverTimestamp()
    };
    
    if (activo !== undefined) {
      updateData.activo = activo;
    }
    
    await updateDoc(nivelRef, updateData);
    
    return {
      success: true,
      message: 'Nivel actualizado exitosamente'
    };
  } catch (error) {
    console.error('Error al actualizar nivel:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Elimina un nivel
 */
export const eliminarNivel = async (nivelId) => {
  try {
    // TODO: Verificar si hay alumnos usando este nivel antes de eliminar
    // Por ahora solo eliminamos el documento
    
    await deleteDoc(doc(db, 'niveles', nivelId));
    
    return {
      success: true,
      message: 'Nivel eliminado exitosamente'
    };
  } catch (error) {
    console.error('Error al eliminar nivel:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

