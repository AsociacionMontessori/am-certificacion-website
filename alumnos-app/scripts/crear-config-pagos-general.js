/**
 * Script para crear el documento 'general' en configuracionPagos
 * 
 * Ejecutar con: node scripts/crear-config-pagos-general.js
 * 
 * Este script creará el documento con ID 'general' en la colección configuracionPagos
 * con todos los costos y configuraciones necesarias.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

// Configuración de Firebase
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

async function crearConfiguracionGeneral() {
  try {
    console.log('🔍 Verificando si ya existe el documento "general"...\n');
    
    // Verificar si ya existe
    const configDocGeneral = await getDoc(doc(db, 'configuracionPagos', 'general'));
    
    if (configDocGeneral.exists()) {
      console.log('✅ El documento "general" ya existe en configuracionPagos');
      console.log('\n📋 Contenido actual:');
      const data = configDocGeneral.data();
      console.log(`   - Recargo Porcentaje: ${data.recargoPorcentaje || 'N/A'}%`);
      console.log(`   - Recargo Activo: ${data.recargoActivo !== false ? 'Sí' : 'No'}`);
      console.log(`   - Día Vencimiento: ${data.diaVencimiento || 'N/A'}`);
      console.log(`   - Costos configurados: ${data.costos ? Object.keys(data.costos).length : 0} niveles`);
      
      console.log('\n💡 El documento ya existe. Si deseas actualizarlo, puedes:');
      console.log('   1. Hacerlo desde la interfaz de admin en /admin/pagos → Configuración');
      console.log('   2. O eliminar este documento y ejecutar el script nuevamente');
      console.log('\n✅ No se realizaron cambios. El documento "general" ya está configurado.');
      return;
    } else {
      console.log('📝 Creando documento "general"...\n');
      await setDoc(doc(db, 'configuracionPagos', 'general'), configuracionInicial);
      console.log('✅ Documento "general" creado exitosamente');
    }
    
    console.log('\n📊 Configuración creada:');
    console.log('─'.repeat(50));
    console.log(`   Recargo Porcentaje: ${configuracionInicial.recargoPorcentaje}%`);
    console.log(`   Recargo Activo: ${configuracionInicial.recargoActivo ? 'Sí' : 'No'}`);
    console.log(`   Día Vencimiento: ${configuracionInicial.diaVencimiento}`);
    console.log('\n💰 Costos configurados:');
    Object.entries(configuracionInicial.costos).forEach(([nivel, costo]) => {
      console.log(`\n   📚 ${nivel}:`);
      if (costo.mensual) {
        console.log(`      - Mensual: $${costo.mensual}`);
        console.log(`      - Meses: ${costo.meses}`);
        console.log(`      - Inscripción: $${costo.inscripcion}`);
        console.log(`      - Certificado: $${costo.certificado}`);
      } else {
        console.log(`      - Total: $${costo.total}`);
        console.log(`      - Pagos: ${costo.pagos}`);
        console.log(`      - Monto por pago: $${costo.montoPago}`);
        console.log(`      - Certificado: ${costo.certificado}`);
      }
    });
    
    console.log('\n' + '─'.repeat(50));
    console.log('\n✅ Proceso completado exitosamente');
    console.log('📍 Ubicación: configuracionPagos/general');
    console.log('\n💡 Ahora puedes usar la aplicación y la configuración será cargada automáticamente.');
    
  } catch (error) {
    console.error('\n❌ Error al crear/actualizar configuración:', error);
    
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  No tienes permisos para escribir en Firestore.');
      console.error('   Opciones:');
      console.error('   1. Usar Firebase Admin SDK con credenciales de servicio');
      console.error('   2. Crear el documento manualmente desde la consola:');
      console.error('      https://console.firebase.google.com/project/certificacionmontessori/firestore/data');
      console.error('   3. Ver las instrucciones en: docs/INICIALIZAR_PAGOS.md');
    } else {
      console.error('\n💡 Alternativa: Crea el documento manualmente desde la consola de Firebase');
      console.error('   Sigue las instrucciones en: docs/INICIALIZAR_PAGOS.md');
    }
    
    process.exit(1);
  }
}

crearConfiguracionGeneral()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

