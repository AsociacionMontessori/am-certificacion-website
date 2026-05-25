/**
 * Serie editorial de Roxana Muñoz Guevara (Asociación Montessori de México A.C.)
 * stripeSku: identificador en catálogo Stripe (ver docs/STRIPE_SETUP.md)
 */
export const roxanaBooks = [
  {
    id: "ammac-libro-1",
    volume: 1,
    stripeSku: "libro_ammac_1",
    priceMx: "450",
    digital: {
      enabled: true,
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
  },
  {
    id: "ammac-libro-2",
    volume: 2,
    stripeSku: "libro_ammac_2",
    priceMx: "450",
    digital: {
      enabled: true,
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
  },
  {
    id: "ammac-libro-3",
    volume: 3,
    stripeSku: "libro_ammac_3",
    priceMx: "450",
    digital: {
      enabled: true,
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
  },
  {
    id: "ammac-libro-4",
    volume: 4,
    stripeSku: "libro_ammac_4",
    priceMx: "450",
    digital: {
      enabled: true,
      stripeSku: "ebook_ammac_4",
      priceMx: "317",
      netMx: "300",
      formats: ["PDF", "EPUB"],
    },
    title: "Guiones Cósmicos: Las cinco grandes lecciones y las lecciones complementarias",
    description:
      "Las grandes lecciones de María Montessori se cuentan, no se leen. Colección completa de once guiones narrativos del Taller del segundo plano: las cinco grandes lecciones (Universo, Vida, Ser Humano, Escritura y Números) y siete lecciones complementarias, con indicaciones técnicas, materiales y notas de seguimiento. Complemento técnico de Educación Cósmica.",
    coverImage: "/books/guiones-cosmicos.jpg",
    amazonUrl: "https://www.amazon.com.mx/dp/B0H14FT9K4",
  },
]
