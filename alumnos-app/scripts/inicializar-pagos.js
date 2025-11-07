/**
 * Script para inicializar la configuración de pagos en Firestore
 * 
 * Ejecutar con: node scripts/inicializar-pagos.js
 * 
 * Requiere que tengas las credenciales de Firebase configuradas
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Configuración de Firebase - usar las mismas credenciales que en el proyecto
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "certificacionmontessori.firebaseapp.com",
  projectId: "certificacionmontessori",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "certificacionmontessori.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "77935287015",
  appId: process.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
  console.error('❌ Error: Faltan credenciales de Firebase en el archivo .env');
  console.error('   Asegúrate de tener VITE_FIREBASE_API_KEY y VITE_FIREBASE_APP_ID configurados');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const configuracionInicial = {
  recargoPorcentaje: 10,
  recargoActivo: true,
  diaVencimiento: 10,
  costos: {
    'Guía de Nido y Comunidad': {
      mensual: 2900,
      meses: 16,
      inscripcion: 4600,
      certificado: 2500
    },
    'Guía de Casa de Niños': {
      mensual: 3300,
      meses: 17,
      inscripcion: 4600,
      certificado: 2500
    },
    'Guía de Taller I-II': {
      mensual: 3600,
      meses: 20,
      inscripcion: 4600,
      certificado: 2500
    },
    'Diplomado en Neuroeducación': {
      total: 4500,
      pagos: 3,
      montoPago: 1500,
      certificado: 'Incluido'
    },
    'Curso Filosofía Montessori': {
      total: 4500,
      pagos: 3,
      montoPago: 1500,
      certificado: 'Incluido'
    }
  },
  fechaCreacion: serverTimestamp(),
  fechaActualizacion: serverTimestamp()
};

async function inicializarConfiguracionPagos() {
  try {
    console.log('Inicializando configuración de pagos...');
    
    await setDoc(doc(db, 'configuracionPagos', 'general'), configuracionInicial);
    
    console.log('✅ Configuración de pagos inicializada exitosamente');
    console.log('Documento creado en: configuracionPagos/general');
  } catch (error) {
    console.error('❌ Error al inicializar configuración de pagos:', error);
    process.exit(1);
  }
}

inicializarConfiguracionPagos()
  .then(() => {
    console.log('Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

