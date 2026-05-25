/**
 * Escribe precios test en functions-stripe/.env.certificacionmontessori
 * (Firebase carga estos params al desplegar defineString).
 *
 * Uso: node scripts/stripe-write-functions-env.js
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CATALOG = {
  STRIPE_PRICE_INSCRIPCION: 'price_1Tai20D6IQ4doPMocr5W6Mw1',
  STRIPE_PRICE_DIPLOMADO_NEURO: 'price_1TamCfD6IQ4doPMo1J5MYRJa',
  STRIPE_PRICE_DIPLOMADO_COSMICA: 'price_1TamCgD6IQ4doPMoepWngY71',
  STRIPE_PRICE_COLEGIATURA_NIDO_INICIO: 'price_1TamCgD6IQ4doPMofxhHCvUs',
  STRIPE_PRICE_COLEGIATURA_CASA_INICIO: 'price_1TamChD6IQ4doPMoO5Q0nE72',
  STRIPE_PRICE_COLEGIATURA_TALLER_INICIO: 'price_1TamCiD6IQ4doPMo5zfqDDuZ',
  STRIPE_PRICE_LIBRO_1: 'price_1Tai20D6IQ4doPMoy9v3DO2u',
  STRIPE_PRICE_LIBRO_2: 'price_1Tai21D6IQ4doPMoiMq60tjV',
  STRIPE_PRICE_LIBRO_3: 'price_1Tai22D6IQ4doPMoSt6KfQal',
  STRIPE_PRICE_LIBRO_4: 'price_1Tai23D6IQ4doPMoQTENYBcx',
  STRIPE_PRICE_EBOOK_1: 'price_1Tb5CjD6IQ4doPMoHkUFCuil',
  STRIPE_PRICE_EBOOK_2: 'price_1Tb5CkD6IQ4doPMocTCFsABw',
  STRIPE_PRICE_EBOOK_3: 'price_1Tb5ClD6IQ4doPMon2Yb06Sd',
  STRIPE_PRICE_EBOOK_4: 'price_1Tb5CnD6IQ4doPMoitZYf22F',
  STRIPE_PRICE_EBOOK_PACK_4: 'price_1Tb5CoD6IQ4doPMo4HTI3ZM9',
  STRIPE_PRICE_COLEGIATURA_NIDO: 'price_1Tai23D6IQ4doPMoJAoTv7JW',
  STRIPE_PRICE_COLEGIATURA_CASA: 'price_1Tai24D6IQ4doPMoXCZ2MosN',
  STRIPE_PRICE_COLEGIATURA_TALLER: 'price_1TamCkD6IQ4doPMol56y6TGF',
  STRIPE_PRICE_CERTIFICADO: 'price_1Tai25D6IQ4doPMo6Ohuwmk5',
};

const lines = [
  '# Generado para deploy test — NO commitear',
  '# Proyecto: certificacionmontessori',
  'SITE_URL=https://certificacionmontessori--stripe-test-sl45bkl4.web.app',
  'ALUMNOS_SITE_URL=https://alumnos-certificacionmontessori.web.app',
  'GOOGLE_WORKSPACE_PROVISION_ENABLED=true',
  'GOOGLE_ADMIN_EMAIL=admin@asociacionmontessori.com.mx',
  'GOOGLE_STUDENTS_OU_BASE=/Diplomados',
  'GOOGLE_CLASSROOM_COURSE_MAP={}',
  ...Object.entries(CATALOG).map(([k, v]) => `${k}=${v}`),
  '',
];

const target = join(__dirname, '../functions-stripe/.env.certificacionmontessori');
writeFileSync(target, lines.join('\n'), 'utf8');
console.warn(`Escrito: ${target}`);
console.warn('Siguiente: npm run deploy:stripe');
