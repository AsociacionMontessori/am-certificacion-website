const {defineString} = require("firebase-functions/params");

const priceInscripcion = defineString("STRIPE_PRICE_INSCRIPCION", {default: ""});
const priceLibro1 = defineString("STRIPE_PRICE_LIBRO_1", {default: ""});
const priceLibro2 = defineString("STRIPE_PRICE_LIBRO_2", {default: ""});
const priceLibro3 = defineString("STRIPE_PRICE_LIBRO_3", {default: ""});
const priceLibro4 = defineString("STRIPE_PRICE_LIBRO_4", {default: ""});
const priceEbook1 = defineString("STRIPE_PRICE_EBOOK_1", {default: ""});
const priceEbook2 = defineString("STRIPE_PRICE_EBOOK_2", {default: ""});
const priceEbook3 = defineString("STRIPE_PRICE_EBOOK_3", {default: ""});
const priceEbook4 = defineString("STRIPE_PRICE_EBOOK_4", {default: ""});
const priceEbookPack4 = defineString("STRIPE_PRICE_EBOOK_PACK_4", {default: ""});
const priceColegiaturaNido = defineString("STRIPE_PRICE_COLEGIATURA_NIDO", {default: ""});
const priceColegiaturaCasa = defineString("STRIPE_PRICE_COLEGIATURA_CASA", {default: ""});
const priceColegiaturaTaller = defineString("STRIPE_PRICE_COLEGIATURA_TALLER", {default: ""});
const priceCertificado = defineString("STRIPE_PRICE_CERTIFICADO", {default: ""});
const priceDiplomadoNeuro = defineString("STRIPE_PRICE_DIPLOMADO_NEURO", {default: ""});
const priceDiplomadoCosmica = defineString("STRIPE_PRICE_DIPLOMADO_COSMICA", {default: ""});
const priceColegiaturaNidoInicio = defineString("STRIPE_PRICE_COLEGIATURA_NIDO_INICIO", {default: ""});
const priceColegiaturaCasaInicio = defineString("STRIPE_PRICE_COLEGIATURA_CASA_INICIO", {default: ""});
const priceColegiaturaTallerInicio = defineString("STRIPE_PRICE_COLEGIATURA_TALLER_INICIO", {default: ""});

const SITE_URL = defineString("SITE_URL", {default: "https://certificacionmontessori.com"});
const ALUMNOS_SITE_URL = defineString("ALUMNOS_SITE_URL", {
  default: "https://alumnos.certificacionmontessori.com",
});

/** Catálogo estático: SKU → metadatos de negocio (amountMxn para validación interna) */
const CATALOG_META = {
  inscripcion_diplomado: {
    tipo: "inscripcion",
    descripcion: "Inscripción diplomado Certificación Montessori",
    requiresShipping: false,
    amountMxn: 4900,
  },
  diplomado_neuroeducacion: {
    tipo: "programa",
    descripcion: "Diplomado en Neuroeducación",
    requiresShipping: false,
    amountMxn: 4500,
  },
  diplomado_educacion_cosmica: {
    tipo: "programa",
    descripcion: "Educación Cósmica y Grandes Lecciones",
    requiresShipping: false,
    amountMxn: 2800,
  },
  colegiatura_nido_inicio: {
    tipo: "programa",
    descripcion: "Primera colegiatura - Nido y Comunidad Infantil",
    requiresShipping: false,
    amountMxn: 3100,
  },
  colegiatura_casa_inicio: {
    tipo: "programa",
    descripcion: "Primera colegiatura - Casa de Niños",
    requiresShipping: false,
    amountMxn: 3500,
  },
  colegiatura_taller_inicio: {
    tipo: "programa",
    descripcion: "Primera colegiatura - Taller I y II",
    requiresShipping: false,
    amountMxn: 3900,
  },
  libro_ammac_1: {tipo: "libro", descripcion: "Libro 1 - Pedagogía científica", requiresShipping: true, amountMxn: 450},
  libro_ammac_2: {tipo: "libro", descripcion: "Libro 2 - Secreto de la infancia", requiresShipping: true, amountMxn: 450},
  libro_ammac_3: {tipo: "libro", descripcion: "Libro 3 - Educación cósmica", requiresShipping: true, amountMxn: 450},
  libro_ammac_4: {tipo: "libro", descripcion: "Libro 4 - Guiones cósmicos", requiresShipping: true, amountMxn: 450},
  ebook_ammac_1: {tipo: "ebook", descripcion: "Ebook 1 - Pedagogía científica", requiresShipping: false, amountMxn: 213},
  ebook_ammac_2: {tipo: "ebook", descripcion: "Ebook 2 - Secreto de la infancia", requiresShipping: false, amountMxn: 213},
  ebook_ammac_3: {tipo: "ebook", descripcion: "Ebook 3 - Educación cósmica", requiresShipping: false, amountMxn: 317},
  ebook_ammac_4: {tipo: "ebook", descripcion: "Ebook 4 - Guiones cósmicos", requiresShipping: false, amountMxn: 317},
  ebook_pack_ammac_4: {tipo: "ebook", descripcion: "Paquete digital - 4 ebooks Roxana Muñoz", requiresShipping: false, amountMxn: 839},
  colegiatura_nido: {tipo: "colegiatura", descripcion: "Colegiatura mensual - Nido", requiresShipping: false, amountMxn: 3100},
  colegiatura_casa: {tipo: "colegiatura", descripcion: "Colegiatura mensual - Casa de Niños", requiresShipping: false, amountMxn: 3500},
  colegiatura_taller: {tipo: "colegiatura", descripcion: "Colegiatura mensual - Taller", requiresShipping: false, amountMxn: 3900},
  certificado_fisico: {tipo: "certificado", descripcion: "Certificado físico", requiresShipping: true, amountMxn: 2700},
};

const PARAM_PRICE_MAP = {
  inscripcion_diplomado: priceInscripcion,
  libro_ammac_1: priceLibro1,
  libro_ammac_2: priceLibro2,
  libro_ammac_3: priceLibro3,
  libro_ammac_4: priceLibro4,
  ebook_ammac_1: priceEbook1,
  ebook_ammac_2: priceEbook2,
  ebook_ammac_3: priceEbook3,
  ebook_ammac_4: priceEbook4,
  ebook_pack_ammac_4: priceEbookPack4,
  colegiatura_nido: priceColegiaturaNido,
  colegiatura_casa: priceColegiaturaCasa,
  colegiatura_taller: priceColegiaturaTaller,
  certificado_fisico: priceCertificado,
  diplomado_neuroeducacion: priceDiplomadoNeuro,
  diplomado_educacion_cosmica: priceDiplomadoCosmica,
  colegiatura_nido_inicio: priceColegiaturaNidoInicio,
  colegiatura_casa_inicio: priceColegiaturaCasaInicio,
  colegiatura_taller_inicio: priceColegiaturaTallerInicio,
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
