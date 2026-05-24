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
  STRIPE_PRICE_LIBRO_1: 'price_1Tai20D6IQ4doPMoy9v3DO2u',
  STRIPE_PRICE_LIBRO_2: 'price_1Tai21D6IQ4doPMoiMq60tjV',
  STRIPE_PRICE_LIBRO_3: 'price_1Tai22D6IQ4doPMoSt6KfQal',
  STRIPE_PRICE_LIBRO_4: 'price_1Tai23D6IQ4doPMoQTENYBcx',
  STRIPE_PRICE_COLEGIATURA_NIDO: 'price_1Tai23D6IQ4doPMoJAoTv7JW',
  STRIPE_PRICE_COLEGIATURA_CASA: 'price_1Tai24D6IQ4doPMoXCZ2MosN',
  STRIPE_PRICE_COLEGIATURA_TALLER: 'price_1Tai25D6IQ4doPMoodDJeu3g',
  STRIPE_PRICE_CERTIFICADO: 'price_1Tai25D6IQ4doPMo6Ohuwmk5',
};

const lines = [
  '# Generado para deploy test — NO commitear',
  '# Proyecto: certificacionmontessori',
  'SITE_URL=https://certificacionmontessori.web.app',
  'ALUMNOS_SITE_URL=https://alumnos-certificacionmontessori.web.app',
  ...Object.entries(CATALOG).map(([k, v]) => `${k}=${v}`),
  '',
];

const target = join(__dirname, '../functions-stripe/.env.certificacionmontessori');
writeFileSync(target, lines.join('\n'), 'utf8');
console.warn(`Escrito: ${target}`);
console.warn('Siguiente: firebase functions:secrets:set STRIPE_SECRET_KEY && npm run deploy:stripe');
