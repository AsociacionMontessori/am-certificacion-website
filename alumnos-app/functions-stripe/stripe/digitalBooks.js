const EBOOK_PACK_SKU = "ebook_pack_ammac_4";

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
};

const DIGITAL_BOOK_PACKS = {
  [EBOOK_PACK_SKU]: ["ebook_ammac_1", "ebook_ammac_2", "ebook_ammac_3", "ebook_ammac_4"],
};

function getDigitalBook(sku) {
  return DIGITAL_BOOKS[sku] || null;
}

function getDigitalAsset(sku, format) {
  const normalizedFormat = String(format || "").toLowerCase();
  const book = getDigitalBook(sku);
  return book?.formats?.[normalizedFormat] || null;
}

function orderIncludesDigitalSku(lineItems, requestedSku) {
  return lineItems.some((item) => {
    if (item.sku === requestedSku) return true;
    const pack = DIGITAL_BOOK_PACKS[item.sku];
    return Array.isArray(pack) && pack.includes(requestedSku);
  });
}

module.exports = {
  DIGITAL_BOOKS,
  DIGITAL_BOOK_PACKS,
  EBOOK_PACK_SKU,
  getDigitalBook,
  getDigitalAsset,
  orderIncludesDigitalSku,
};
