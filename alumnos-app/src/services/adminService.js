import { 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
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
 * Nota: Después de crear el usuario, Firebase automáticamente inicia sesión con el nuevo usuario.
 * Este servicio cierra la sesión del nuevo usuario para que el admin no quede logueado como el nuevo usuario.
 */
export const crearUsuarioAlumno = async (datosUsuario) => {
  // Guardar el usuario actual (admin) antes de crear el nuevo usuario
  const adminUserBefore = auth.currentUser;
  const adminEmail = adminUserBefore?.email;

  try {
    const { email, password, nombre, ...datosAdicionales } = datosUsuario;

    // 1. Crear usuario en Firebase Authentication
    // Nota: createUserWithEmailAndPassword automáticamente inicia sesión con el nuevo usuario
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
      // Guardar la contraseña para que el admin pueda iniciar sesión como este usuario
      passwordTemporal: password,
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

    // 5. La contraseña ya está guardada en Firestore en el campo passwordTemporal
    // NO cerrar sesión automáticamente - el admin puede elegir si quiere iniciar sesión como el nuevo usuario
    // Si el admin quiere volver a su sesión, puede hacerlo manualmente

    return {
      success: true,
      uid: user.uid,
      email: user.email,
      message: 'Usuario creado exitosamente',
      adminEmail: adminEmail, // Devolver el email del admin para referencia
      password: password // Devolver la contraseña para uso inmediato
    };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    // Si hay un error, intentar restaurar la sesión del admin si estaba logueado
    if (adminUserBefore && auth.currentUser?.uid !== adminUserBefore.uid) {
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.warn('Error al cerrar sesión después de error:', signOutError);
      }
    }
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

/**
 * Crea un nuevo directivo (solo lectura)
 */
export const crearUsuarioDirectivo = async (datosDirectivo) => {
  try {
    const { email, password, nombre } = datosDirectivo;

    // Crear usuario en Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar perfil
    if (nombre) {
      await updateProfile(user, {
        displayName: nombre
      });
    }

    // Crear documento en Firestore en la colección 'directivos'
    await setDoc(doc(db, 'directivos', user.uid), {
      nombre: nombre || '',
      email: email,
      rol: 'directivo',
      fechaCreacion: serverTimestamp(),
      activo: true
    });

    return {
      success: true,
      uid: user.uid,
      email: user.email,
      message: 'Directivo creado exitosamente'
    };
  } catch (error) {
    console.error('Error al crear directivo:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Crea un nuevo usuario de grupos
 * Los usuarios de grupos pueden ver solo los alumnos que les asigne el administrador
 */
export const crearUsuarioGrupos = async (datosGrupos) => {
  try {
    const { email, password, nombre } = datosGrupos;

    // Crear usuario en Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar perfil
    if (nombre) {
      await updateProfile(user, {
        displayName: nombre
      });
    }

    // Crear documento en Firestore en la colección 'grupos'
    // alumnosAsignados es un array vacío inicialmente, el admin lo llenará después
    await setDoc(doc(db, 'grupos', user.uid), {
      nombre: nombre || '',
      email: email,
      rol: 'grupos',
      alumnosAsignados: [], // Array de IDs de alumnos que puede ver
      fechaCreacion: serverTimestamp(),
      activo: true
    });

    return {
      success: true,
      uid: user.uid,
      email: user.email,
      message: 'Usuario de grupos creado exitosamente'
    };
  } catch (error) {
    console.error('Error al crear usuario de grupos:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

