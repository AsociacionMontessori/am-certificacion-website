/* eslint-disable react-refresh/only-export-components */
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
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            const userDataWithRole = { 
              id: adminDoc.id, 
              ...adminData, 
              rol: 'admin' 
            };
            setUserData(userDataWithRole);
          } else {
            // Si no es admin, intentar como directivo
            const directivoDoc = await getDoc(doc(db, 'directivos', user.uid));
            
            if (directivoDoc.exists()) {
              const directivoData = directivoDoc.data();
              const userDataWithRole = { 
                id: directivoDoc.id, 
                ...directivoData, 
                rol: 'directivo' 
              };
              setUserData(userDataWithRole);
            } else {
              // Si no es directivo, intentar como catedrático
              const catedraticoDoc = await getDoc(doc(db, 'catedraticos', user.uid));

              if (catedraticoDoc.exists()) {
                const catedraticoData = catedraticoDoc.data();
                const userDataWithRole = {
                  id: catedraticoDoc.id,
                  ...catedraticoData,
                  rol: 'catedratico'
                };
                setUserData(userDataWithRole);
              } else {
                // Si no es directivo, intentar como grupos
                const gruposDoc = await getDoc(doc(db, 'grupos', user.uid));
                
                if (gruposDoc.exists()) {
                  const gruposData = gruposDoc.data();
                  const userDataWithRole = { 
                    id: gruposDoc.id, 
                    ...gruposData, 
                    rol: 'grupos' 
                  };
                  setUserData(userDataWithRole);
                } else {
                  // Si no es grupos, intentar como alumno
                  const alumnoDoc = await getDoc(doc(db, 'alumnos', user.uid));
                  
                  if (alumnoDoc.exists()) {
                    const alumnoData = alumnoDoc.data();
                    const userDataWithRole = { 
                      id: alumnoDoc.id, 
                      ...alumnoData, 
                      rol: 'alumno' 
                    };
                    setUserData(userDataWithRole);
                  } else {
                    console.warn('⚠️ Usuario no encontrado en admins, directivos, catedráticos, grupos ni alumnos:', user.uid);
                    console.warn('⚠️ Verifica que exista un documento en Firestore con ID =', user.uid);
                    // Si no existe en ninguna colección, no establecer userData
                    setUserData(null);
                  }
                }
              }
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

