import { 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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
      telefono: datosAdicionales.telefono || null,
      fechaNacimiento: datosAdicionales.fechaNacimiento || null,
      programa: datosAdicionales.programa || null,
      cohorte: datosAdicionales.cohorte || null,
      fechaIngreso: datosAdicionales.fechaIngreso ? new Date(datosAdicionales.fechaIngreso) : serverTimestamp(),
      estado: datosAdicionales.estado || 'Activo',
      nivelEducativo: datosAdicionales.nivelEducativo || null,
      direccion: datosAdicionales.direccion || null,
      ciudad: datosAdicionales.ciudad || null,
      estadoDireccion: datosAdicionales.estadoDireccion || null,
      codigoPostal: datosAdicionales.codigoPostal || null,
      mostrarEmail: datosAdicionales.mostrarEmail || false,
      mostrarTelefono: datosAdicionales.mostrarTelefono || false,
      nombrePublico: datosAdicionales.nombrePublico || nombre || '',
      fechaCreacion: serverTimestamp(),
      creadoPor: datosAdicionales.creadoPor || null,
      ...datosAdicionales
    };

    await setDoc(doc(db, 'alumnos', user.uid), alumnoData);

    // 4. Enviar email de restablecimiento de contraseña (opcional)
    // El usuario puede cambiar su contraseña después del primer login
    if (datosAdicionales.enviarEmailBienvenida) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (emailError) {
        console.warn('No se pudo enviar email de bienvenida:', emailError);
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

