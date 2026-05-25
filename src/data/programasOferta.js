/**
 * Catálogo público de programas — un solo punto de verdad (precios, nombres, checkout).
 */

export const INSCRIPCION_PRECIO = {
  priceMx: "4,900",
  priceUsd: "270",
  anchorPriceMx: "5,900",
}

/** Promoción activa: Neuro incluye inscripción sin cargo extra en checkout Stripe. */
export const PROMO_NEURO_INSCRIPCION_INCLUIDA = {
  activa: true,
  programaId: "neuro",
  badge: "Inscripción incluida",
  detalle:
    "Promoción vigente: al inscribirte al Diplomado en Neuroeducación pagas solo el programa; la inscripción institucional va incluida.",
}

export const INSCRIPCION_MARKETING_COPY = {
  titulo: "Inscripción",
  subtitulo:
    "Pagas la inscripción una sola vez. Si después tomas otro diplomado o curso con nosotros, no volvemos a cobrarla.",
  beneficio: "Inscripción única de por vida en la institución",
  textoMonto: "Monto de inscripción (hoy)",
}

/** @typedef {'guia'|'diplomado'|'curso'|'inscripcion'} TipoPrograma */

export const PROGRAMAS_OFERTA = [
  {
    id: "inscripcion",
    tipo: "inscripcion",
    checkoutLabel: "Inscripción (primer programa)",
    cardTitle: "Aparta tu lugar",
    cardSubtitle: "Da el primer paso hacia tu certificación",
    priceMx: INSCRIPCION_PRECIO.priceMx,
    priceUsd: INSCRIPCION_PRECIO.priceUsd,
    anchorPriceMx: INSCRIPCION_PRECIO.anchorPriceMx,
    priceNote: "Pago único — no se repite en otros programas",
    duration: null,
    cta: "/inscripcion/pagar",
    featured: true,
    nivelFormulario: null,
  },
  {
    id: "cosmica",
    tipo: "diplomado",
    checkoutLabel: "Educación Cósmica y Grandes Lecciones",
    cardTitle: "Educación Cósmica",
    cardSubtitle: "Diplomado · Grandes Lecciones Montessori",
    priceMx: "2,800",
    priceUsd: "155",
    anchorPriceMx: "3,400",
    priceNote: `Programa $2,800 + inscripción $${INSCRIPCION_PRECIO.priceMx} (solo la primera vez)`,
    paymentNote: "programa + inscripción",
    duration: "5 meses",
    cta: "/inscripcion/pagar",
    featured: true,
    nivelFormulario: "Diplomado en Educación Cósmica y Grandes Lecciones (5 meses)",
  },
  {
    id: "neuro",
    tipo: "diplomado",
    checkoutLabel: "Diplomado en Neuroeducación",
    cardTitle: "Neuroeducación",
    cardSubtitle: "3 meses • A tu ritmo • 100% en línea",
    priceMx: "4,500",
    priceUsd: "250",
    anchorPriceMx: "5,500",
    priceNote: "Promoción: $4,500 todo incluido (programa + inscripción)",
    paymentNote: "promo todo incluido",
    promoInscripcionIncluida: true,
    duration: "3 meses",
    cta: "/inscripcion/pagar",
    featured: true,
    nivelFormulario: "Diplomado en Neuroeducación (3 meses)",
  },
  {
    id: "taller",
    tipo: "guia",
    checkoutLabel: "Guía en Taller I y II",
    cardTitle: "Taller I y II",
    cardSubtitle: "Certificación internacional",
    priceMx: "3,900",
    priceUsd: "220",
    anchorPriceMx: "4,500",
    priceNote: `Inscripción $${INSCRIPCION_PRECIO.priceMx} (1 vez) + colegiatura mensual`,
    paymentNote: "colegiatura mensual",
    duration: "20 meses",
    cta: "/diplomados/#certificacion_internacional",
    nivelFormulario: "Guía en Taller I y II (con duración 20 meses)",
  },
  {
    id: "casa",
    tipo: "guia",
    checkoutLabel: "Guía en Casa de Niños",
    cardTitle: "Casa de Niños",
    cardSubtitle: "Certificación internacional",
    priceMx: "3,500",
    priceUsd: "195",
    anchorPriceMx: "4,100",
    priceNote: `Inscripción $${INSCRIPCION_PRECIO.priceMx} (1 vez) + colegiatura mensual`,
    paymentNote: "colegiatura mensual",
    duration: "17 meses",
    cta: "/diplomados/#certificacion_internacional",
    nivelFormulario: "Guía en Casa de Niños (con duración 17 meses)",
  },
  {
    id: "nido",
    tipo: "guia",
    checkoutLabel: "Guía en Nido y Comunidad Infantil",
    cardTitle: "Nido y Comunidad Infantil",
    cardSubtitle: "Certificación internacional",
    priceMx: "3,100",
    priceUsd: "170",
    anchorPriceMx: "3,600",
    priceNote: `Inscripción $${INSCRIPCION_PRECIO.priceMx} (1 vez) + colegiatura mensual`,
    paymentNote: "colegiatura mensual",
    duration: "16 meses",
    cta: "/diplomados/#certificacion_internacional",
    nivelFormulario: "Guía en Nido & Comunidad Infantil (Duración 16 meses)",
  },
]

export const PROGRAMAS_CHECKOUT_OPCIONES = PROGRAMAS_OFERTA.filter(
  (p) => p.id !== "inscripcion"
)
  .sort((a, b) => {
    if (a.promoInscripcionIncluida && !b.promoInscripcionIncluida) return -1
    if (!a.promoInscripcionIncluida && b.promoInscripcionIncluida) return 1
    return 0
  })
  .map((p) => p.checkoutLabel)

export const getProgramaByCheckoutLabel = (label) =>
  PROGRAMAS_OFERTA.find((p) => p.checkoutLabel === label) || null

/** @param {string} checkoutLabel */
export const programaTienePromoInscripcionIncluida = (checkoutLabel) => {
  if (!PROMO_NEURO_INSCRIPCION_INCLUIDA.activa) return false
  const p = getProgramaByCheckoutLabel(checkoutLabel)
  return Boolean(p?.promoInscripcionIncluida)
}

const parsePrecioMx = (priceMx) =>
  Number(String(priceMx || "").replace(/,/g, "")) || 0

const formatPrecioMx = (n) =>
  Number(n).toLocaleString("es-MX", { maximumFractionDigits: 0 })

/** Total estimado en checkout público (inscripción + programa o solo inscripción). */
export const getTotalPagoCheckout = (checkoutLabel, soloInscripcion = false) => {
  const ins = parsePrecioMx(INSCRIPCION_PRECIO.priceMx)
  const programa = getProgramaByCheckoutLabel(checkoutLabel)
  if (!programa) return ins
  if (soloInscripcion) return ins
  if (programaTienePromoInscripcionIncluida(checkoutLabel)) {
    return parsePrecioMx(programa.priceMx)
  }
  return ins + parsePrecioMx(programa.priceMx)
}

/** Texto bajo el selector de programa en el checkout. */
export const getResumenPagoInscripcion = (
  checkoutLabel,
  coin = "MXN",
  soloInscripcion = false
) => {
  const programa = getProgramaByCheckoutLabel(checkoutLabel)
  const ins = INSCRIPCION_PRECIO.priceMx
  if (!programa) {
    return `Hoy pagas la inscripción (${coin} ${ins}). Después definimos el plan de tu programa.`
  }
  if (programaTienePromoInscripcionIncluida(checkoutLabel)) {
    if (soloInscripcion) {
      return `Este diplomado tiene la inscripción incluida en la promoción. Elige «Inicio completo» y paga solo ${coin} ${programa.priceMx}.`
    }
    return `${PROMO_NEURO_INSCRIPCION_INCLUIDA.detalle} Total hoy en Stripe: ${coin} $${programa.priceMx}.`
  }
  if (soloInscripcion) {
    return `Hoy pagas solo la inscripción (${coin} ${ins}). El programa (${programa.cardTitle}) se liquida después en el portal o por transferencia. La inscripción no se vuelve a cobrar en otros programas.`
  }
  const total = formatPrecioMx(getTotalPagoCheckout(checkoutLabel, false))
  if (programa.tipo === "guia") {
    return `Inicio completo en un solo pago: inscripción (${coin} ${ins}) + primera colegiatura (${coin} ${programa.priceMx}) = ${coin} $${total}. Las colegiaturas siguientes son mensuales en el portal. La inscripción solo se paga una vez.`
  }
  if (programa.tipo === "diplomado") {
    return `Inicio completo: inscripción (${coin} ${ins}) + programa ${programa.cardTitle} (${coin} ${programa.priceMx}, ${programa.duration}) = ${coin} $${total} hoy en Stripe. La inscripción no se repite en otros diplomados.`
  }
  return `Hoy pagas la inscripción (${coin} ${ins}).`
}

export const mapProgramaCheckoutANivel = (checkoutLabel) => {
  const p = getProgramaByCheckoutLabel(checkoutLabel)
  return p?.nivelFormulario || ""
}
