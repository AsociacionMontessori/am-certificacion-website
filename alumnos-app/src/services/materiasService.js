import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getMateriasPorNivel } from '../data/materiasPorNivel';

/**
 * Inicializa las materias en Firestore para un alumno según su nivel
 */
export const inicializarMateriasParaAlumno = async (alumnoId, nivel) => {
  try {
    const materias = getMateriasPorNivel(nivel);
    const materiasCollection = collection(db, 'materias');
    
    // Crear un documento para cada materia
    const promises = materias.map(async (nombreMateria) => {
      const materiaRef = doc(materiasCollection);
      await setDoc(materiaRef, {
        alumnoId,
        nombre: nombreMateria,
        nivel,
        fechaInicio: null,
        fechaFin: null,
        profesor: null,
        aula: null,
        horario: null,
        estado: 'Pendiente',
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });
      return materiaRef.id;
    });
    
    await Promise.all(promises);
    return { success: true, materiasCreadas: materias.length };
  } catch (error) {
    console.error('Error al inicializar materias:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene todas las materias de un alumno
 */
export const getMateriasAlumno = async (alumnoId) => {
  try {
    const materiasQuery = query(
      collection(db, 'materias'),
      where('alumnoId', '==', alumnoId),
      orderBy('fechaInicio', 'asc')
    );
    const querySnapshot = await getDocs(materiasQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener materias:', error);
    return [];
  }
};

/**
 * Crea o actualiza una materia
 */
export const guardarMateria = async (materiaData) => {
  try {
    const { id, ...data } = materiaData;
    
    if (id) {
      // Actualizar materia existente
      const materiaRef = doc(db, 'materias', id);
      await updateDoc(materiaRef, {
        ...data,
        fechaActualizacion: serverTimestamp()
      });
      return { success: true, id };
    } else {
      // Crear nueva materia
      const materiaRef = doc(collection(db, 'materias'));
      await setDoc(materiaRef, {
        ...data,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });
      return { success: true, id: materiaRef.id };
    }
  } catch (error) {
    console.error('Error al guardar materia:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Elimina una materia
 */
export const eliminarMateria = async (materiaId) => {
  try {
    await deleteDoc(doc(db, 'materias', materiaId));
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar materia:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene una materia por ID
 */
export const getMateriaById = async (materiaId) => {
  try {
    const materiaDoc = await getDoc(doc(db, 'materias', materiaId));
    if (materiaDoc.exists()) {
      return { id: materiaDoc.id, ...materiaDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener materia:', error);
    return null;
  }
};

