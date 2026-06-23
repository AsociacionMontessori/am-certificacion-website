/**
 * Crea (o reutiliza) webhook de test en Stripe y muestra el signing secret.
 * Uso: node scripts/stripe-setup-webhook.js
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.stripe.local') });

const require = createRequire(join(__dirname, '../functions-stripe/package.json'));
const Stripe = require('stripe');

const WEBHOOK_URL =
  'https://us-central1-certificacionmontessori.cloudfunctions.net/stripeWebhook';

const EVENTS = [
  'checkout.session.completed',
  'checkout.session.expired',
  'payment_intent.payment_failed',
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

const key = process.env.STRIPE_SECRET_KEY;
if (!key?.startsWith('sk_test_')) {
  console.error('STRIPE_SECRET_KEY sk_test_ requerida en .env.stripe.local');
  process.exit(1);
}

const stripe = new Stripe(key);

async function main() {
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  let endpoint = existing.data.find((e) => e.url === WEBHOOK_URL);

  if (endpoint) {
    console.warn(`Webhook existente: ${endpoint.id}`);
    console.warn(
      'Si no tienes el whsec_, elimínalo en Dashboard y vuelve a ejecutar este script.',
    );
    if (endpoint.secret) {
      console.log(endpoint.secret);
      return;
    }
    console.error('No se pudo leer el secret del endpoint existente.');
    process.exit(1);
  }

  endpoint = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: EVENTS,
    description: 'Certificación Montessori - test (develop)',
  });

  console.warn(`Webhook creado: ${endpoint.id}`);
  console.log(endpoint.secret);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
