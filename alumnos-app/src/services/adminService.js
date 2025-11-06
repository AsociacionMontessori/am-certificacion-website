import { 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  addDoc,
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getMateriasPorNivel } from '../data/materiasPorNivel';

/**
 * Crea un nuevo usuario en Firebase Authentication y su documento en Firestore
 */
export const crearUsuarioAlumno = async (datosUsuario) => {
  try {
    const { email, password, nombre, ...datosAdicionales } = datosUsuario;

    // 1. Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Actualizar el perfil del usuario con el nombre
    if (nombre) {
      await updateProfile(user, {
        displayName: nombre
      });
    }

    // 3. Crear documento en Firestore en la colección 'alumnos'
    const alumnoData = {
      nombre: nombre || '',
      email: email,
      matricula: datosAdicionales.matricula || null,
      emailContacto: datosAdicionales.emailContacto || null,
      telefono: datosAdicionales.telefono || null,
      nivel: datosAdicionales.nivel || null,
      fechaIngreso: datosAdicionales.fechaIngreso ? new Date(datosAdicionales.fechaIngreso) : serverTimestamp(),
      fechaEgresoEstimada: datosAdicionales.fechaEgresoEstimada ? new Date(datosAdicionales.fechaEgresoEstimada) : null,
      estado: datosAdicionales.estado || 'Activo',
      mailClassroom: datosAdicionales.mailClassroom || null,
      passwordClassroom: datosAdicionales.passwordClassroom || null,
      fechaCreacion: serverTimestamp(),
      creadoPor: datosAdicionales.creadoPor || null,
    };

    await setDoc(doc(db, 'alumnos', user.uid), alumnoData);

    // 4. Inicializar materias para el alumno según su nivel
    if (datosAdicionales.nivel) {
      try {
        const materias = getMateriasPorNivel(datosAdicionales.nivel);
        const materiasCollection = collection(db, 'materias');
        const promises = materias.map((nombreMateria) => {
          return addDoc(materiasCollection, {
            alumnoId: user.uid,
            nombre: nombreMateria,
            nivel: datosAdicionales.nivel,
            fechaInicio: null,
            fechaFin: null,
            profesor: null,
            aula: null,
            horario: null,
            estado: 'Pendiente',
            fechaCreacion: serverTimestamp(),
            fechaActualizacion: serverTimestamp()
          });
        });
        await Promise.all(promises);
      } catch (materiasError) {
        console.warn('No se pudieron inicializar las materias:', materiasError);
      }
    }

    return {
      success: true,
      uid: user.uid,
      email: user.email,
      message: 'Usuario creado exitosamente'
    };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Crea un nuevo administrador
 */
export const crearUsuarioAdmin = async (datosAdmin) => {
  try {
    const { email, password, nombre } = datosAdmin;

    // Crear usuario en Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar perfil
    if (nombre) {
      await updateProfile(user, {
        displayName: nombre
      });
    }

    // Crear documento en Firestore en la colección 'admins'
    await setDoc(doc(db, 'admins', user.uid), {
      nombre: nombre || '',
      email: email,
      rol: 'admin',
      fechaCreacion: serverTimestamp(),
      activo: true
    });

    return {
      success: true,
      uid: user.uid,
      email: user.email,
      message: 'Administrador creado exitosamente'
    };
  } catch (error) {
    console.error('Error al crear administrador:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

