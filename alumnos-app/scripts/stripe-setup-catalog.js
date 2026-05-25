/**
 * Crea productos y precios MXN en Stripe (modo test) y muestra comandos Firebase.
 *
 * Uso (NO commitear la clave):
 *   cd alumnos-app
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup-catalog.js
 *
 * Opcional: guardar en .env.stripe.local y:
 *   export $(grep -v '^#' .env.stripe.local | xargs) && node scripts/stripe-setup-catalog.js
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.stripe.local') });
dotenv.config({ path: join(__dirname, '../.env') });

const require = createRequire(join(__dirname, '../functions-stripe/package.json'));
const Stripe = require('stripe');

const CATALOG = [
  { sku: 'inscripcion_diplomado', name: 'Inscripción diplomado', amountMxn: 4900, recurring: false },
  { sku: 'diplomado_neuroeducacion', name: 'Diplomado en Neuroeducación', amountMxn: 4500, recurring: false },
  { sku: 'diplomado_educacion_cosmica', name: 'Educación Cósmica y Grandes Lecciones', amountMxn: 2800, recurring: false },
  { sku: 'colegiatura_nido_inicio', name: 'Primera colegiatura - Nido', amountMxn: 3100, recurring: false },
  { sku: 'colegiatura_casa_inicio', name: 'Primera colegiatura - Casa de Niños', amountMxn: 3500, recurring: false },
  { sku: 'colegiatura_taller_inicio', name: 'Primera colegiatura - Taller I y II', amountMxn: 3900, recurring: false },
  { sku: 'libro_ammac_1', name: 'Libro 1 - Pedagogía científica', amountMxn: 450, recurring: false },
  { sku: 'libro_ammac_2', name: 'Libro 2 - Secreto de la infancia', amountMxn: 450, recurring: false },
  { sku: 'libro_ammac_3', name: 'Libro 3 - Educación cósmica', amountMxn: 450, recurring: false },
  { sku: 'libro_ammac_4', name: 'Libro 4 - Guiones cósmicos', amountMxn: 450, recurring: false },
  { sku: 'colegiatura_nido', name: 'Colegiatura mensual - Nido', amountMxn: 3100, recurring: true },
  { sku: 'colegiatura_casa', name: 'Colegiatura mensual - Casa de Niños', amountMxn: 3500, recurring: true },
  { sku: 'colegiatura_taller', name: 'Colegiatura mensual - Taller', amountMxn: 3900, recurring: true },
  { sku: 'certificado_fisico', name: 'Certificado físico', amountMxn: 2700, recurring: false },
];

const PARAM_NAMES = {
  inscripcion_diplomado: 'STRIPE_PRICE_INSCRIPCION',
  diplomado_neuroeducacion: 'STRIPE_PRICE_DIPLOMADO_NEURO',
  diplomado_educacion_cosmica: 'STRIPE_PRICE_DIPLOMADO_COSMICA',
  colegiatura_nido_inicio: 'STRIPE_PRICE_COLEGIATURA_NIDO_INICIO',
  colegiatura_casa_inicio: 'STRIPE_PRICE_COLEGIATURA_CASA_INICIO',
  colegiatura_taller_inicio: 'STRIPE_PRICE_COLEGIATURA_TALLER_INICIO',
  libro_ammac_1: 'STRIPE_PRICE_LIBRO_1',
  libro_ammac_2: 'STRIPE_PRICE_LIBRO_2',
  libro_ammac_3: 'STRIPE_PRICE_LIBRO_3',
  libro_ammac_4: 'STRIPE_PRICE_LIBRO_4',
  colegiatura_nido: 'STRIPE_PRICE_COLEGIATURA_NIDO',
  colegiatura_casa: 'STRIPE_PRICE_COLEGIATURA_CASA',
  colegiatura_taller: 'STRIPE_PRICE_COLEGIATURA_TALLER',
  certificado_fisico: 'STRIPE_PRICE_CERTIFICADO',
};

const key = process.env.STRIPE_SECRET_KEY;
if (!key || !key.startsWith('sk_test_')) {
  console.error('Define STRIPE_SECRET_KEY con una clave sk_test_... (modo prueba).');
  process.exit(1);
}

const stripe = new Stripe(key);

async function findProductBySku(sku) {
  const products = await stripe.products.list({ limit: 100, active: true });
  return products.data.find((p) => p.metadata?.sku === sku) || null;
}

async function ensureCatalogItem(item) {
  let product = await findProductBySku(item.sku);
  if (!product) {
    product = await stripe.products.create({
      name: item.name,
      metadata: { sku: item.sku, proyecto: 'certificacion_montessori' },
    });
    console.warn(`Producto creado: ${item.sku} → ${product.id}`);
  } else {
    console.warn(`Producto existente: ${item.sku} → ${product.id}`);
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 });
  const amountCentavos = Math.round(item.amountMxn * 100);
  const match = prices.data.find(
    (pr) =>
      pr.currency === 'mxn' &&
      pr.unit_amount === amountCentavos &&
      (item.recurring ? pr.recurring?.interval === 'month' : !pr.recurring),
  );

  if (match) {
    console.warn(`  Precio existente: ${match.id} ($${item.amountMxn} MXN)`);
    return { sku: item.sku, priceId: match.id, productId: product.id };
  }

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'mxn',
    unit_amount: amountCentavos,
    ...(item.recurring ? { recurring: { interval: 'month' } } : {}),
    metadata: { sku: item.sku },
  });
  console.warn(`  Precio creado: ${price.id} ($${item.amountMxn} MXN${item.recurring ? '/mes' : ''})`);
  return { sku: item.sku, priceId: price.id, productId: product.id };
}

async function main() {
  const account = await stripe.accounts.retrieve();
  console.warn(`Cuenta Stripe: ${account.id} (${account.country})`);

  const results = [];
  for (const item of CATALOG) {
    results.push(await ensureCatalogItem(item));
  }

  console.warn('\n--- Comandos Firebase (copiar y ejecutar) ---\n');
  for (const { sku, priceId } of results) {
    const param = PARAM_NAMES[sku];
    if (param) {
      console.log(`firebase functions:params:set ${param}=${priceId}`);
    }
  }

  console.warn('\n--- JSON stripeCatalog/default (Firestore, opcional) ---\n');
  const firestoreMap = Object.fromEntries(results.map((r) => [r.sku, r.priceId]));
  console.log(JSON.stringify(firestoreMap, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
