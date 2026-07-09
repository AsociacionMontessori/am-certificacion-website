/**
 * Serie editorial de Roxana Muñoz Guevara (Asociación Montessori de México A.C.)
 * stripeSku: identificador en catálogo Stripe (ver docs/STRIPE_SETUP.md)
 *
 * ⚠️ VENTA DIGITAL DESACTIVADA (2026-06-25): los títulos están inscritos en
 * Amazon KDP Select, que exige exclusividad digital. Vender el ebook/PDF/EPUB
 * fuera de Amazon viola los términos (riesgo de cierre de cuenta KDP). Por eso
 * todos los `digital.enabled` están en false y se quitó el regalo. Solo se
 * promueve la edición IMPRESA vía Amazon (la impresión no tiene exclusividad).
 * Para reactivar: salir de KDP Select y poner `enabled: true`.
 */
export const roxanaBooks = [
  {
    id: "ammac-libro-5",
    volume: 5,
    // Se vende como ebook ($213) y además se entrega GRATIS (PDF + EPUB) con la
    // compra de cualquier OTRO libro o paquete. Ver functions-stripe/stripe/
    // digitalBooks.js (orderQualifiesForGift, excluye su propio SKU). Mantiene
    // gift:true para conservar la insignia; va primero por su gancho publicitario.
    gift: false,
    digital: {
      enabled: false,
      stripeSku: "ebook_ammac_5",
      priceMx: "213",
      netMx: "200",
      formats: ["PDF", "EPUB"],
    },
    title: "La mente absorbente: Montessori a la luz de la neuroeducación y la psicomotricidad actuales",
    description:
      "La síntesis más madura de María Montessori (1949) puesta a dialogar, capítulo a capítulo, con la neurociencia del desarrollo, la neuroeducación y la psicomotricidad: plasticidad cerebral, períodos sensibles, la unidad entre movimiento e inteligencia y la emoción como motor del aprendizaje. Con honestidad sobre convergencias, tensiones y neuromitos.",
    coverImage: "/books/mente-absorbente.jpg",
    amazonUrl: "https://www.amazon.com.mx/dp/B0H3R8YX6Q",
  },
  {
    id: "ammac-libro-1",
    volume: 1,
    stripeSku: "libro_ammac_1",
    priceMx: "450",
    digital: {
      enabled: false,
      stripeSku: "ebook_ammac_1",
      priceMx: "213",
      netMx: "200",
      formats: ["PDF", "EPUB"],
    },
    title: "Montessori: Una presentación del método de la pedagogía científica",
    description:
      "Primer volumen de la serie AMMAC: Roxana Muñoz Guevara revisa, presenta y actualiza la pedagogía científica de María Montessori — fruto de años de estudio y práctica con niños. Un método adoptado en escuelas de todo el mundo que abre una nueva posibilidad de enseñanza y pone en entredicho los presupuestos de la educación tradicional.",
    coverImage: "/books/pedagogia-cientifica.jpg",
    amazonUrl: "https://www.amazon.com.mx/dp/B0GZY8N61G",
    amazonUrlEn: "https://www.amazon.com/dp/B0H35ZB7DK",
  },
  {
    id: "ammac-libro-2",
    volume: 2,
    stripeSku: "libro_ammac_2",
    priceMx: "450",
    digital: {
      enabled: false,
      stripeSku: "ebook_ammac_2",
      priceMx: "213",
      netMx: "200",
      formats: ["PDF", "EPUB"],
    },
    title: "Montessori: Una presentación del secreto de la infancia",
    description:
      "Segundo volumen de la serie basada en las obras originales de María Montessori. Roxana Muñoz Guevara sintetiza las ideas de El niño, el secreto de la infancia: la etapa incipiente de la vida donde el niño guarda el secreto práctico de nuestra propia existencia. Introducción y herramienta de estudio para todo público interesado en el método.",
    coverImage: "/books/secreto-infancia.jpg",
    amazonUrl: "https://www.amazon.com.mx/dp/B0H13SC1QK",
    amazonUrlEn: "https://www.amazon.com/dp/B0H2SRM231",
  },
  {
    id: "ammac-libro-3",
    volume: 3,
    stripeSku: "libro_ammac_3",
    priceMx: "450",
    digital: {
      enabled: false,
      stripeSku: "ebook_ammac_3",
      priceMx: "317",
      netMx: "300",
      formats: ["PDF", "EPUB"],
    },
    title: "Educación Cósmica: Una pedagogía para que el niño se sepa parte del universo",
    description:
      "Alrededor de los seis años, el niño empieza a preguntar por la totalidad: cómo nació el universo, cómo apareció la vida, cómo el ser humano llegó a hablar. La Educación Cósmica de María Montessori toma esa pregunta en serio. Presentación accesible de las cinco grandes lecciones, las cascadas curriculares y la formación del adulto que acompaña al niño.",
    coverImage: "/books/educacion-cosmica.jpg",
    amazonUrl: "https://www.amazon.com.mx/dp/B0H143L8GN",
    amazonUrlEn: "https://www.amazon.com/dp/B0H2TVSGT1",
  },
  {
    id: "ammac-libro-4",
    volume: 4,
    stripeSku: "libro_ammac_4",
    priceMx: "450",
    digital: {
      enabled: false,
      stripeSku: "ebook_ammac_4",
      priceMx: "317",
      netMx: "300",
      formats: ["PDF", "EPUB"],
    },
    title: "Guiones Cósmicos: Las cinco grandes lecciones y las lecciones complementarias",
    description:
      "Las grandes lecciones de María Montessori se cuentan, no se leen. Colección completa de doce guiones narrativos del Taller del segundo plano: las cinco grandes lecciones (Universo, Vida, Ser Humano, Escritura y Números) y siete lecciones complementarias, con indicaciones técnicas, materiales y notas de seguimiento. Complemento técnico de Educación Cósmica.",
    coverImage: "/books/guiones-cosmicos.jpg",
    amazonUrl: "https://www.amazon.com.mx/dp/B0H14FT9K4",
  },
]
