/**
 * Script para verificar la configuración de pagos en Firestore
 * 
 * Ejecutar con: node scripts/verificar-config-pagos.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verificarConfiguracionPagos() {
  try {
    console.log('🔍 Verificando configuración de pagos...\n');
    
    const configDoc = await getDoc(doc(db, 'configuracionPagos', 'general'));
    
    if (!configDoc.exists()) {
      console.error('❌ El documento configuracionPagos/general NO existe');
      console.log('\n📝 Para crearlo, sigue las instrucciones en: docs/INICIALIZAR_PAGOS.md');
      console.log('   O ejecuta: npm run init:pagos (requiere permisos de admin)');
      return;
    }
    
    const data = configDoc.data();
    console.log('✅ Documento configuracionPagos/general encontrado\n');
    console.log('📋 Configuración actual:');
    console.log('─'.repeat(50));
    
    // Verificar campos básicos
    console.log('\n🔧 Configuración básica:');
    console.log(`   Recargo Porcentaje: ${data.recargoPorcentaje || 'NO CONFIGURADO'}%`);
    console.log(`   Recargo Activo: ${data.recargoActivo !== false ? '✅ Sí' : '❌ No'}`);
    console.log(`   Día Vencimiento: ${data.diaVencimiento || 'NO CONFIGURADO'}`);
    
    // Verificar costos
    console.log('\n💰 Costos configurados:');
    if (data.costos && typeof data.costos === 'object') {
      const costos = data.costos;
      const niveles = Object.keys(costos);
      
      if (niveles.length === 0) {
        console.log('   ⚠️  No hay costos configurados');
      } else {
        niveles.forEach(nivel => {
          const costo = costos[nivel];
          console.log(`\n   📚 ${nivel}:`);
          if (costo.mensual) {
            console.log(`      - Mensual: $${costo.mensual}`);
            console.log(`      - Meses: ${costo.meses}`);
          }
          if (costo.total) {
            console.log(`      - Total: $${costo.total}`);
            console.log(`      - Pagos: ${costo.pagos}`);
            console.log(`      - Monto por pago: $${costo.montoPago}`);
          }
          if (costo.inscripcion) {
            console.log(`      - Inscripción: $${costo.inscripcion}`);
          }
          if (costo.certificado) {
            console.log(`      - Certificado: ${typeof costo.certificado === 'string' ? costo.certificado : '$' + costo.certificado}`);
          }
        });
      }
    } else {
      console.log('   ⚠️  Campo "costos" no encontrado o inválido');
    }
    
    // Verificar fechas
    console.log('\n📅 Fechas:');
    if (data.fechaCreacion) {
      const fechaCreacion = data.fechaCreacion.toDate ? data.fechaCreacion.toDate() : data.fechaCreacion;
      console.log(`   Creado: ${fechaCreacion.toLocaleString('es-MX')}`);
    }
    if (data.fechaActualizacion) {
      const fechaActualizacion = data.fechaActualizacion.toDate ? data.fechaActualizacion.toDate() : data.fechaActualizacion;
      console.log(`   Actualizado: ${fechaActualizacion.toLocaleString('es-MX')}`);
    }
    
    // Validaciones
    console.log('\n✅ Validaciones:');
    const problemas = [];
    
    if (!data.recargoPorcentaje) problemas.push('Falta recargoPorcentaje');
    if (data.recargoActivo === undefined) problemas.push('Falta recargoActivo');
    if (!data.diaVencimiento) problemas.push('Falta diaVencimiento');
    if (!data.costos || Object.keys(data.costos).length === 0) {
      problemas.push('No hay costos configurados');
    }
    
    if (problemas.length > 0) {
      console.log('   ⚠️  Problemas encontrados:');
      problemas.forEach(problema => {
        console.log(`      - ${problema}`);
      });
    } else {
      console.log('   ✅ Todos los campos necesarios están configurados');
    }
    
    console.log('\n' + '─'.repeat(50));
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error al verificar configuración:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  No tienes permisos para leer la configuración.');
      console.error('   Verifica que estés autenticado o usa la consola de Firebase.');
    }
  }
}

verificarConfiguracionPagos()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

