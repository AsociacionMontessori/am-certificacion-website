/**
 * Crea (idempotente) un cupón 100% off acotado a los ebooks de Roxana Muñoz y
 * un Promotion Code legible para «descarga gratis» en el checkout público.
 *
 * El cupón solo descuenta los productos ebook (applies_to.products), así un
 * código 100% NUNCA puede regalar un libro físico + envío. Además, el checkout
 * solo muestra el campo de código en órdenes 100% digitales
 * (allow_promotion_codes en createPublicCheckout.js).
 *
 * Uso (cuenta LIVE):
 *   STRIPE_SECRET_KEY="$(cat /home/carlos/secrets/stripe_clave_secreta)" \
 *     node scripts/stripe-create-ebook-gift-coupon.cjs
 *
 * Re-ejecutar es seguro: reusa el cupón/código si ya existen.
 */

const path = require("path");

// SKUs de ebook que el código deja en $0 (deben existir como product.metadata.sku).
const EBOOK_SKUS = [
  "ebook_ammac_1",
  "ebook_ammac_2",
  "ebook_ammac_3",
  "ebook_ammac_4",
  "ebook_pack_ammac_4",
  "ebook_pack_cosmica_2",
];

const CAMPAIGN = "ebook_gift_roxana100";
const CODE = "ROXANA100";
const MAX_REDEMPTIONS = 100;
const EXPIRES_DAYS = 90;

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

  // 1) Resolver product ids de cada ebook por metadata.sku.
  const productIds = [];
  for (const sku of EBOOK_SKUS) {
    const r = await stripe.products.search({query: `metadata['sku']:'${sku}'`});
    if (r.data[0]) {
      productIds.push(r.data[0].id);
    } else {
      console.warn(`  ⚠ sin producto para sku ${sku} (se omite)`);
    }
  }
  if (!productIds.length) {
    console.error("No se encontró ningún producto ebook. Aborta.");
    process.exit(1);
  }
  console.log(`Productos ebook (${productIds.length}): ${productIds.join(", ")}`);

  // 2) Cupón 100% off idempotente (por metadata.campaign).
  let coupon = (await stripe.coupons.list({limit: 100})).data
      .find((c) => c.metadata && c.metadata.campaign === CAMPAIGN);
  if (coupon) {
    console.log(`Cupón existente: ${coupon.id}`);
  } else {
    coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: "once",
      name: "Descarga gratis · ebooks Roxana Muñoz",
      applies_to: {products: productIds},
      metadata: {campaign: CAMPAIGN},
    });
    console.log(`Cupón creado: ${coupon.id}`);
  }

  // 3) Promotion Code legible idempotente (por code).
  const existing = (await stripe.promotionCodes.list({code: CODE, limit: 1})).data[0];
  if (existing) {
    console.log(`Promotion code ya existe: ${existing.code} (${existing.id}) active=${existing.active}`);
    return;
  }
  const expiresAt = Math.floor(Date.now() / 1000) + EXPIRES_DAYS * 86400;
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: CODE,
    max_redemptions: MAX_REDEMPTIONS,
    expires_at: expiresAt,
    metadata: {campaign: CAMPAIGN},
  });
  console.log(
      `Promotion code creado: ${promo.code} (${promo.id}) ` +
      `max=${promo.max_redemptions} expira=${new Date(expiresAt * 1000).toISOString()}`,
  );
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
