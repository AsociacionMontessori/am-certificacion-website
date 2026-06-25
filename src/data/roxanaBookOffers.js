/**
 * Paquetes (bundles) digitales de la serie de Roxana Muñoz.
 * Cada paquete entrega los ebooks (PDF + EPUB) de los libros indicados en
 * `bookIds`. El backend resuelve qué libros incluye cada SKU en
 * functions-stripe/stripe/digitalBooks.js (DIGITAL_BOOK_PACKS).
 */
// ⚠️ PAQUETES DIGITALES DESACTIVADOS (2026-06-25) por exclusividad KDP Select
// (igual que en roxanaBooks.js). No se vende ningún ebook/paquete fuera de
// Amazon mientras los títulos sigan en Select. Para reactivar: restaurar el
// contenido de `_roxanaBookBundlesDisabled` en `roxanaBookBundles`.
export const roxanaBookBundles = []

const _roxanaBookBundlesDisabled = [
  {
    id: "ammac-ebook-pack-4",
    stripeSku: "ebook_pack_ammac_4",
    priceMx: "839",
    netMx: "800",
    title: "Paquete digital: la serie completa (5 libros)",
    description:
      "Los cuatro ebooks de la serie en PDF y EPUB —pagas el equivalente de tres libros, el de menor precio va incluido— y además recibes «La mente absorbente» de regalo. 5 libros en total.",
    formats: ["PDF", "EPUB"],
    bookIds: ["ammac-libro-1", "ammac-libro-2", "ammac-libro-3", "ammac-libro-4"],
    note: "PDF + EPUB de 4 libros + «La mente absorbente» de regalo · 5 en total",
  },
  {
    id: "ammac-ebook-pack-cosmica",
    stripeSku: "ebook_pack_cosmica_2",
    priceMx: "400",
    netMx: "400",
    title: "Paquete Cósmico: Educación Cósmica + Guiones Cósmicos",
    description:
      "Los dos libros del segundo plano juntos en PDF y EPUB: la pedagogía de la Educación Cósmica y la colección completa de guiones de las grandes lecciones. Llévate ambos por $400 en lugar de $634, con «La mente absorbente» de regalo.",
    formats: ["PDF", "EPUB"],
    bookIds: ["ammac-libro-3", "ammac-libro-4"],
    note: "PDF + EPUB de 2 libros + «La mente absorbente» de regalo",
  },
]

/**
 * Ebook que se regala (gratis) con la compra de cualquier libro o paquete.
 * No tiene precio ni SKU de venta: solo se entrega como descarga adicional.
 */
export const roxanaGiftEbook = {
  bookId: "ammac-libro-5",
  // SKU usado solo para autorizar/cablear la descarga; nunca es line item.
  stripeSku: "ebook_ammac_5",
  title: "La mente absorbente",
  formats: ["PDF", "EPUB"],
}

// Compatibilidad: primer paquete (el de 4 libros) como export individual.
// (Sin uso actual; referencia el set desactivado para no exportar undefined.)
export const roxanaBookBundle = _roxanaBookBundlesDisabled[0]
