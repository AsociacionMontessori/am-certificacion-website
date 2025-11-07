/**
 * Script para migrar pagos existentes:
 * 1. Numerar colegiaturas (agregar numeroColegiatura y totalColegiaturas)
 * 2. Desactivar recargos en inscripciones y certificados
 * 
 * IMPORTANTE: Este script debe ejecutarse desde la consola del navegador
 * como administrador, o desde una función Firebase con permisos de admin.
 * 
 * Para ejecutar desde la aplicación web:
 * 1. Inicia sesión como administrador
 * 2. Abre la consola del navegador (F12)
 * 3. Copia y pega este código en la consola
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
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

async function migrarPagos() {
  try {
    console.log('🔄 Iniciando migración de pagos...\n');

    // Obtener todos los pagos
    let pagosSnapshot;
    try {
      // Intentar con ordenamiento
      const q = query(collection(db, 'pagos'), orderBy('fechaVencimiento', 'asc'));
      pagosSnapshot = await getDocs(q);
    } catch (error) {
      // Si falla (por falta de índice), obtener sin ordenar
      console.warn('⚠️  No se pudo ordenar por fechaVencimiento, obteniendo sin ordenar...', error?.message);
      pagosSnapshot = await getDocs(collection(db, 'pagos'));
    }

    console.log(`📊 Total de pagos encontrados: ${pagosSnapshot.size}\n`);

    if (pagosSnapshot.empty) {
      console.log('ℹ️  No hay pagos para migrar.');
      return;
    }

    const updates = {
      colegiaturas: 0,
      inscripciones: 0,
      certificados: 0,
      otros: 0,
      errores: 0
    };

    // Agrupar pagos por alumno
    const pagosPorAlumno = {};
    
    pagosSnapshot.forEach(docSnap => {
      const pago = docSnap.data();
      const alumnoId = pago.alumnoId;
      
      if (!pagosPorAlumno[alumnoId]) {
        pagosPorAlumno[alumnoId] = [];
      }
      
      pagosPorAlumno[alumnoId].push({
        id: docSnap.id,
        ...pago
      });
    });

    console.log(`👥 Alumnos con pagos: ${Object.keys(pagosPorAlumno).length}\n`);

    // Procesar cada alumno
    for (const [alumnoId, pagos] of Object.entries(pagosPorAlumno)) {
      try {
        // Separar colegiaturas de otros tipos
        const colegiaturas = pagos
          .filter(p => p.tipo === 'Colegiatura')
          .sort((a, b) => {
            const fechaA = a.fechaVencimiento?.toDate?.() || a.fechaVencimiento || new Date(0);
            const fechaB = b.fechaVencimiento?.toDate?.() || b.fechaVencimiento || new Date(0);
            return fechaA - fechaB;
          });

        const otrosPagos = pagos.filter(p => p.tipo !== 'Colegiatura');

        // Actualizar colegiaturas
        if (colegiaturas.length > 0) {
          const totalColegiaturas = colegiaturas.length;
          
          for (let i = 0; i < colegiaturas.length; i++) {
            const colegiatura = colegiaturas[i];
            const numeroColegiatura = i + 1;
            
            const updatesData = {};
            let necesitaUpdate = false;

            // Agregar número de colegiatura si no existe o es incorrecto
            if (!colegiatura.numeroColegiatura || colegiatura.numeroColegiatura !== numeroColegiatura) {
              updatesData.numeroColegiatura = numeroColegiatura;
              necesitaUpdate = true;
            }

            // Agregar total de colegiaturas si no existe o es incorrecto
            if (!colegiatura.totalColegiaturas || colegiatura.totalColegiaturas !== totalColegiaturas) {
              updatesData.totalColegiaturas = totalColegiaturas;
              necesitaUpdate = true;
            }

            if (necesitaUpdate) {
              await updateDoc(doc(db, 'pagos', colegiatura.id), updatesData);
              updates.colegiaturas++;
              console.log(`  ✅ Colegiatura ${numeroColegiatura}/${totalColegiaturas} - Alumno: ${alumnoId.substring(0, 8)}...`);
            }
          }
        }

        // Actualizar inscripciones (sin recargo)
        const inscripciones = otrosPagos.filter(p => p.tipo === 'Inscripción');
        for (const inscripcion of inscripciones) {
          const updatesData = {};
          let necesitaUpdate = false;

          if (inscripcion.recargoActivo !== false) {
            updatesData.recargoActivo = false;
            necesitaUpdate = true;
          }

          if (inscripcion.recargoPorcentaje !== 0 && inscripcion.recargoPorcentaje !== undefined) {
            updatesData.recargoPorcentaje = 0;
            necesitaUpdate = true;
          }

          if (necesitaUpdate) {
            await updateDoc(doc(db, 'pagos', inscripcion.id), updatesData);
            updates.inscripciones++;
            console.log(`  ✅ Inscripción actualizada - Alumno: ${alumnoId.substring(0, 8)}...`);
          }
        }

        // Actualizar certificados (sin recargo)
        const certificados = otrosPagos.filter(p => p.tipo === 'Certificado');
        for (const certificado of certificados) {
          const updatesData = {};
          let necesitaUpdate = false;

          if (certificado.recargoActivo !== false) {
            updatesData.recargoActivo = false;
            necesitaUpdate = true;
          }

          if (certificado.recargoPorcentaje !== 0 && certificado.recargoPorcentaje !== undefined) {
            updatesData.recargoPorcentaje = 0;
            necesitaUpdate = true;
          }

          if (necesitaUpdate) {
            await updateDoc(doc(db, 'pagos', certificado.id), updatesData);
            updates.certificados++;
            console.log(`  ✅ Certificado actualizado - Alumno: ${alumnoId.substring(0, 8)}...`);
          }
        }

        // Contar otros tipos de pago
        const otros = otrosPagos.filter(p => p.tipo !== 'Inscripción' && p.tipo !== 'Certificado');
        updates.otros += otros.length;

      } catch (error) {
        console.error(`  ❌ Error procesando pagos del alumno ${alumnoId}:`, error.message);
        updates.errores++;
      }
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`  ✅ Colegiaturas actualizadas: ${updates.colegiaturas}`);
    console.log(`  ✅ Inscripciones actualizadas: ${updates.inscripciones}`);
    console.log(`  ✅ Certificados actualizados: ${updates.certificados}`);
    console.log(`  ℹ️  Otros pagos (sin cambios): ${updates.otros}`);
    if (updates.errores > 0) {
      console.log(`  ❌ Errores: ${updates.errores}`);
    }
    console.log('\n✅ Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    if (error.code === 'permission-denied') {
      console.error('\n⚠️  No tienes permisos para actualizar pagos.');
      console.error('   Este script debe ejecutarse desde la aplicación web');
      console.error('   mientras estés autenticado como administrador.');
    }
    throw error;
  }
}

// Ejecutar migración
migrarPagos()
  .then(() => {
    console.log('\n✅ Proceso finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
