import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase
// En Vite, las variables de entorno se acceden con import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "certificacionmontessori.firebaseapp.com",
  projectId: "certificacionmontessori",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "certificacionmontessori.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "77935287015",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validar que las credenciales estén configuradas
if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
  console.error('⚠️ Firebase credentials not fully configured. Please check your .env file.');
  console.error('API Key:', firebaseConfig.apiKey ? 'Set' : 'Missing');
  console.error('App ID:', firebaseConfig.appId ? 'Set' : 'Missing');
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

