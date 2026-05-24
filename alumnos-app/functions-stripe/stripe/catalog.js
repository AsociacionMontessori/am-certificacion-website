const {defineString} = require("firebase-functions/params");

const priceInscripcion = defineString("STRIPE_PRICE_INSCRIPCION", {default: ""});
const priceLibro1 = defineString("STRIPE_PRICE_LIBRO_1", {default: ""});
const priceLibro2 = defineString("STRIPE_PRICE_LIBRO_2", {default: ""});
const priceLibro3 = defineString("STRIPE_PRICE_LIBRO_3", {default: ""});
const priceLibro4 = defineString("STRIPE_PRICE_LIBRO_4", {default: ""});
const priceColegiaturaNido = defineString("STRIPE_PRICE_COLEGIATURA_NIDO", {default: ""});
const priceColegiaturaCasa = defineString("STRIPE_PRICE_COLEGIATURA_CASA", {default: ""});
const priceColegiaturaTaller = defineString("STRIPE_PRICE_COLEGIATURA_TALLER", {default: ""});
const priceCertificado = defineString("STRIPE_PRICE_CERTIFICADO", {default: ""});

const SITE_URL = defineString("SITE_URL", {default: "https://certificacionmontessori.com"});
const ALUMNOS_SITE_URL = defineString("ALUMNOS_SITE_URL", {
  default: "https://alumnos.certificacionmontessori.com",
});

/** Catálogo estático: SKU → metadatos de negocio */
const CATALOG_META = {
  inscripcion_diplomado: {
    tipo: "inscripcion",
    descripcion: "Inscripción diplomado Certificación Montessori",
    requiresShipping: false,
  },
  libro_ammac_1: {tipo: "libro", descripcion: "Libro 1 - Pedagogía científica", requiresShipping: true},
  libro_ammac_2: {tipo: "libro", descripcion: "Libro 2 - Secreto de la infancia", requiresShipping: true},
  libro_ammac_3: {tipo: "libro", descripcion: "Libro 3 - Educación cósmica", requiresShipping: true},
  libro_ammac_4: {tipo: "libro", descripcion: "Libro 4 - Guiones cósmicos", requiresShipping: true},
  colegiatura_nido: {tipo: "colegiatura", descripcion: "Colegiatura mensual - Nido", requiresShipping: false},
  colegiatura_casa: {tipo: "colegiatura", descripcion: "Colegiatura mensual - Casa de Niños", requiresShipping: false},
  colegiatura_taller: {tipo: "colegiatura", descripcion: "Colegiatura mensual - Taller", requiresShipping: false},
  certificado_fisico: {tipo: "certificado", descripcion: "Certificado físico", requiresShipping: true},
};

const PARAM_PRICE_MAP = {
  inscripcion_diplomado: priceInscripcion,
  libro_ammac_1: priceLibro1,
  libro_ammac_2: priceLibro2,
  libro_ammac_3: priceLibro3,
  libro_ammac_4: priceLibro4,
  colegiatura_nido: priceColegiaturaNido,
  colegiatura_casa: priceColegiaturaCasa,
  colegiatura_taller: priceColegiaturaTaller,
  certificado_fisico: priceCertificado,
};

const NIVEL_TO_COLEGIATURA_SKU = [
  {match: /nido|comunidad infantil/i, sku: "colegiatura_nido"},
  {match: /casa de niños/i, sku: "colegiatura_casa"},
  {match: /taller/i, sku: "colegiatura_taller"},
];

/**
 * Resuelve priceId desde Firestore stripeCatalog/default o parámetros Firebase.
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {string} sku
 * @return {Promise<{priceId: string, meta: object}|null>}
 */
async function resolveSku(db, sku) {
  const meta = CATALOG_META[sku];
  if (!meta) return null;

  let priceId = "";
  try {
    const catalogSnap = await db.collection("stripeCatalog").doc("default").get();
    if (catalogSnap.exists && catalogSnap.data()?.[sku]) {
      priceId = String(catalogSnap.data()[sku]).trim();
    }
  } catch (err) {
    console.warn("No se pudo leer stripeCatalog:", err.message);
  }

  if (!priceId && PARAM_PRICE_MAP[sku]) {
    priceId = PARAM_PRICE_MAP[sku].value().trim();
  }

  if (!priceId) return null;
  return {priceId, meta};
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {string} nivel
 * @return {Promise<string|null>}
 */
async function resolveColegiaturaSkuByNivel(db, nivel) {
  if (!nivel) return null;
  const found = NIVEL_TO_COLEGIATURA_SKU.find((entry) => entry.match.test(nivel));
  if (!found) return null;
  const resolved = await resolveSku(db, found.sku);
  return resolved ? found.sku : null;
}

module.exports = {
  CATALOG_META,
  SITE_URL,
  ALUMNOS_SITE_URL,
  resolveSku,
  resolveColegiaturaSkuByNivel,
  NIVEL_TO_COLEGIATURA_SKU,
};
