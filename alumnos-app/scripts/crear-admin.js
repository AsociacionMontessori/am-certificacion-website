/**
 * Script para crear el documento de admin en Firestore
 * Ejecutar con: node scripts/crear-admin.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "certificacionmontessori",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_UID = '9MJUvqisyia0tXW8PDcN9D863cS2';
const ADMIN_EMAIL = 'admin@certificacionmontessori.com';

async function crearAdmin() {
  try {
    const adminData = {
      nombre: 'Administrador',
      email: ADMIN_EMAIL,
      rol: 'admin',
      fechaCreacion: serverTimestamp(),
      activo: true
    };

    await setDoc(doc(db, 'admins', ADMIN_UID), adminData);
    
    console.log('✅ Documento de admin creado exitosamente!');
    console.log(`   UID: ${ADMIN_UID}`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log('\nAhora puedes iniciar sesión en el portal.');
  } catch (error) {
    console.error('❌ Error al crear documento de admin:', error);
    console.error('\nAlternativa: Crea el documento manualmente en Firestore Console:');
    console.error(`   Colección: admins`);
    console.error(`   ID del documento: ${ADMIN_UID}`);
    console.error(`   Campos: nombre, email, rol, fechaCreacion, activo`);
  }
}

crearAdmin();

