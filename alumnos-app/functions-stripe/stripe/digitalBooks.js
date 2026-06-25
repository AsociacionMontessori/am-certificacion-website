const EBOOK_PACK_SKU = "ebook_pack_ammac_4";
const EBOOK_PACK_COSMICA_SKU = "ebook_pack_cosmica_2";

// Ebook de regalo: «La mente absorbente». No se vende; se entrega gratis con
// la compra de cualquier libro o paquete (ver orderQualifiesForGift).
const GIFT_EBOOK_SKU = "ebook_ammac_5";

// Prefijos de SKU cuya compra desbloquea el ebook de regalo.
const GIFT_TRIGGER_PREFIXES = ["libro_", "ebook_"];

// Regalo al apartar la inscripción: el Paquete Cósmico (ebooks 3 y 4).
const INSCRIPCION_GIFT_SKUS = ["ebook_ammac_3", "ebook_ammac_4"];

const DIGITAL_BOOKS = {
  ebook_ammac_1: {
    bookId: "ammac-libro-1",
    title: "Montessori: Una presentación del método de la pedagogía científica",
    formats: {
      pdf: {
        storagePath: "ebooks/ammac-libro-1/montessori-pedagogia-cientifica-roxana-munoz.pdf",
        fileName: "montessori-pedagogia-cientifica-roxana-munoz.pdf",
        contentType: "application/pdf",
      },
      epub: {
        storagePath: "ebooks/ammac-libro-1/montessori-pedagogia-cientifica-roxana-munoz.epub",
        fileName: "montessori-pedagogia-cientifica-roxana-munoz.epub",
        contentType: "application/epub+zip",
      },
    },
  },
  ebook_ammac_2: {
    bookId: "ammac-libro-2",
    title: "Montessori: Una presentación del secreto de la infancia",
    formats: {
      pdf: {
        storagePath: "ebooks/ammac-libro-2/montessori-secreto-infancia-roxana-munoz.pdf",
        fileName: "montessori-secreto-infancia-roxana-munoz.pdf",
        contentType: "application/pdf",
      },
      epub: {
        storagePath: "ebooks/ammac-libro-2/montessori-secreto-infancia-roxana-munoz.epub",
        fileName: "montessori-secreto-infancia-roxana-munoz.epub",
        contentType: "application/epub+zip",
      },
    },
  },
  ebook_ammac_3: {
    bookId: "ammac-libro-3",
    title: "Educación Cósmica: Una pedagogía para que el niño se sepa parte del universo",
    formats: {
      pdf: {
        storagePath: "ebooks/ammac-libro-3/educacion-cosmica-roxana-munoz.pdf",
        fileName: "educacion-cosmica-roxana-munoz.pdf",
        contentType: "application/pdf",
      },
      epub: {
        storagePath: "ebooks/ammac-libro-3/educacion-cosmica-roxana-munoz.epub",
        fileName: "educacion-cosmica-roxana-munoz.epub",
        contentType: "application/epub+zip",
      },
    },
  },
  ebook_ammac_4: {
    bookId: "ammac-libro-4",
    title: "Guiones Cósmicos: Las cinco grandes lecciones y las lecciones complementarias",
    formats: {
      pdf: {
        storagePath: "ebooks/ammac-libro-4/guiones-cosmicos-roxana-munoz.pdf",
        fileName: "guiones-cosmicos-roxana-munoz.pdf",
        contentType: "application/pdf",
      },
      epub: {
        storagePath: "ebooks/ammac-libro-4/guiones-cosmicos-roxana-munoz.epub",
        fileName: "guiones-cosmicos-roxana-munoz.epub",
        contentType: "application/epub+zip",
      },
    },
  },
  [GIFT_EBOOK_SKU]: {
    bookId: "ammac-libro-5",
    title: "La mente absorbente: Montessori a la luz de la neuroeducación y la psicomotricidad actuales",
    formats: {
      pdf: {
        storagePath: "ebooks/ammac-libro-5/la-mente-absorbente-roxana-munoz.pdf",
        fileName: "la-mente-absorbente-roxana-munoz.pdf",
        contentType: "application/pdf",
      },
      epub: {
        storagePath: "ebooks/ammac-libro-5/la-mente-absorbente-roxana-munoz.epub",
        fileName: "la-mente-absorbente-roxana-munoz.epub",
        contentType: "application/epub+zip",
      },
    },
  },
};

const DIGITAL_BOOK_PACKS = {
  [EBOOK_PACK_SKU]: ["ebook_ammac_1", "ebook_ammac_2", "ebook_ammac_3", "ebook_ammac_4"],
  [EBOOK_PACK_COSMICA_SKU]: ["ebook_ammac_3", "ebook_ammac_4"],
};

function getDigitalBook(sku) {
  return DIGITAL_BOOKS[sku] || null;
}

function getDigitalAsset(sku, format) {
  const normalizedFormat = String(format || "").toLowerCase();
  const book = getDigitalBook(sku);
  return book?.formats?.[normalizedFormat] || null;
}

/**
 * ¿La orden califica para el ebook de regalo? Aplica si incluye al menos un
 * libro o ebook (incluye paquetes ebook_pack_*). No lo desbloquean
 * inscripciones, colegiaturas, diplomados ni certificados.
 * @param {Array<{sku: string}>} lineItems
 * @return {boolean}
 */
function orderQualifiesForGift(lineItems) {
  return lineItems.some((item) => {
    const sku = item.sku || "";
    if (sku === GIFT_EBOOK_SKU) return false;
    return GIFT_TRIGGER_PREFIXES.some((prefix) => sku.startsWith(prefix));
  });
}

/**
 * ¿La orden incluye la inscripción (apartado)? Desbloquea el Paquete Cósmico.
 * @param {Array<{sku: string}>} lineItems
 * @return {boolean}
 */
function orderHasInscripcion(lineItems) {
  return lineItems.some((item) => (item.sku || "").startsWith("inscripcion"));
}

/**
 * SKUs de ebook que se regalan según el contenido de la orden:
 *  - cualquier libro/ebook → «La mente absorbente» (ebook_ammac_5)
 *  - inscripción → Paquete Cósmico (ebook_ammac_3 + ebook_ammac_4)
 * @param {Array<{sku: string}>} lineItems
 * @return {string[]}
 */
function resolveGiftSkus(lineItems) {
  // ⚠️ REGALO DE EBOOKS DESACTIVADO (2026-06-25): los títulos están en Amazon
  // KDP Select, cuya exclusividad prohíbe distribuir la versión digital fuera
  // de Amazon AUN GRATIS (solo se permite una muestra del 10%). Por eso no se
  // entrega ningún ebook de regalo. Para reactivar (tras salir de Select),
  // borrar este early-return.
  return [];
  // eslint-disable-next-line no-unreachable
  const gifts = new Set();
  if (orderQualifiesForGift(lineItems)) gifts.add(GIFT_EBOOK_SKU);
  if (orderHasInscripcion(lineItems)) {
    INSCRIPCION_GIFT_SKUS.forEach((sku) => gifts.add(sku));
  }
  return [...gifts];
}

function orderIncludesDigitalSku(lineItems, requestedSku) {
  const directOrPack = lineItems.some((item) => {
    if (item.sku === requestedSku) return true;
    const pack = DIGITAL_BOOK_PACKS[item.sku];
    return Array.isArray(pack) && pack.includes(requestedSku);
  });
  if (directOrPack) return true;
  // Ebooks de regalo: autorizados según lo que contenga la orden.
  if (resolveGiftSkus(lineItems).includes(requestedSku)) return true;
  return false;
}

module.exports = {
  DIGITAL_BOOKS,
  DIGITAL_BOOK_PACKS,
  EBOOK_PACK_SKU,
  EBOOK_PACK_COSMICA_SKU,
  GIFT_EBOOK_SKU,
  INSCRIPCION_GIFT_SKUS,
  getDigitalBook,
  getDigitalAsset,
  orderIncludesDigitalSku,
  orderQualifiesForGift,
  orderHasInscripcion,
  resolveGiftSkus,
};
