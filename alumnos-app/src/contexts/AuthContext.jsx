import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setLoading(true);
        // Cargar datos adicionales del usuario desde Firestore
        try {
          // Primero intentar cargar como admin
          console.log('🔍 Buscando admin con UID:', user.uid);
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          console.log('📄 Resultado de adminDoc.exists():', adminDoc.exists());
          
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            console.log('✅ Admin encontrado:', { 
              uid: user.uid, 
              docId: adminDoc.id,
              data: adminData,
              rolAsignado: 'admin'
            });
            const userDataWithRole = { 
              id: adminDoc.id, 
              ...adminData, 
              rol: 'admin' 
            };
            console.log('👤 userData final:', userDataWithRole);
            setUserData(userDataWithRole);
          } else {
            console.log('❌ No es admin, buscando como alumno...');
            // Si no es admin, intentar como alumno
            const alumnoDoc = await getDoc(doc(db, 'alumnos', user.uid));
            console.log('📄 Resultado de alumnoDoc.exists():', alumnoDoc.exists());
            
            if (alumnoDoc.exists()) {
              const alumnoData = alumnoDoc.data();
              console.log('✅ Alumno encontrado:', { 
                uid: user.uid, 
                docId: alumnoDoc.id,
                data: alumnoData,
                rolAsignado: 'alumno'
              });
              const userDataWithRole = { 
                id: alumnoDoc.id, 
                ...alumnoData, 
                rol: 'alumno' 
              };
              console.log('👤 userData final:', userDataWithRole);
              setUserData(userDataWithRole);
            } else {
              console.warn('⚠️ Usuario no encontrado en admins ni alumnos:', user.uid);
              console.warn('⚠️ Verifica que exista un documento en Firestore con ID =', user.uid);
              // Si no existe en ninguna colección, no establecer userData
              setUserData(null);
            }
          }
        } catch (error) {
          console.error('❌ Error al cargar datos del usuario:', error);
          setUserData(null);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      return { success: true };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    currentUser,
    userData,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

