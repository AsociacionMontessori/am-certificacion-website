/**
 * Crea (idempotente) el producto + precio LIVE de la inscripción
 * (inscripcion_diplomado, $4,900 MXN único) en la cuenta Stripe live.
 *
 * Uso:
 *   STRIPE_SECRET_KEY="$(cat /home/carlos/secrets/stripe_clave_secreta)" \
 *     node scripts/stripe-create-inscripcion-price.cjs
 *
 * Imprime el price_... para pegarlo en STRIPE_PRICE_INSCRIPCION.
 */

const path = require("path");

const SKU = "inscripcion_diplomado";
const NAME = "Inscripción diplomado Certificación Montessori";
const AMOUNT_MXN = 4900;
const CURRENCY = "mxn";

function loadStripe() {
  const stripePath = require.resolve("stripe", {
    paths: [path.join(__dirname, "../functions-stripe/node_modules")],
  });
  return require(stripePath);
}

async function main() {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key.startsWith("sk_live_")) {
    console.error("Define STRIPE_SECRET_KEY con la clave sk_live_... de la cuenta live.");
    process.exit(1);
  }
  const Stripe = loadStripe();
  const stripe = new Stripe(key);

  const found = await stripe.products.search({
    query: `metadata["sku"]:"${SKU}"`,
  });
  let product = found.data[0];
  if (product) {
    console.log(`Producto existente: ${product.id}`);
  } else {
    product = await stripe.products.create({
      name: NAME,
      metadata: {sku: SKU, proyecto: "certificacion_montessori"},
    });
    console.log(`Producto creado: ${product.id}`);
  }

  const amountCentavos = AMOUNT_MXN * 100;
  const prices = await stripe.prices.list({product: product.id, active: true, limit: 100});
  let price = prices.data.find(
      (p) => !p.recurring && p.currency === CURRENCY && p.unit_amount === amountCentavos,
  );
  if (price) {
    console.log(`Precio existente: ${price.id} ($${AMOUNT_MXN} MXN)`);
  } else {
    price = await stripe.prices.create({
      product: product.id,
      currency: CURRENCY,
      unit_amount: amountCentavos,
      metadata: {sku: SKU},
    });
    console.log(`Precio creado: ${price.id} ($${AMOUNT_MXN} MXN)`);
  }

  console.log(`\nSTRIPE_PRICE_INSCRIPCION=${price.id}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
