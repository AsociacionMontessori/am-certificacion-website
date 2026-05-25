/** Programas y precios para marketing (portada). Derivado de programasOferta.js */

import { INSCRIPCION_PRECIO, INSCRIPCION_MARKETING_COPY, PROGRAMAS_OFERTA } from "./programasOferta"

export const INSCRIPCION_MARKETING = {
  title: "Inscripción",
  subtitle: "Aparta tu lugar hoy",
  priceMx: INSCRIPCION_PRECIO.priceMx,
  priceUsd: INSCRIPCION_PRECIO.priceUsd,
  anchorPriceMx: INSCRIPCION_PRECIO.anchorPriceMx,
  anchorPriceUsd: "320",
  badge: "Oferta de inicio",
  beneficioUnica: INSCRIPCION_MARKETING_COPY.beneficio,
}

/** Carrusel portada: mismo orden estratégico, los 6 programas */
export const PROGRAMAS_DESTACADOS = [
  "inscripcion",
  "cosmica",
  "neuro",
  "taller",
  "casa",
  "nido",
].map((id) => {
  const p = PROGRAMAS_OFERTA.find((x) => x.id === id)
  return {
    id: p.id,
    tipo: p.tipo === "guia" ? "Guía" : p.tipo === "diplomado" ? "Diplomado" : "Inscripción",
    title: p.cardTitle,
    subtitle: p.cardSubtitle,
    priceMx: p.priceMx,
    priceUsd: p.priceUsd,
    anchorPriceMx: p.anchorPriceMx,
    anchorPriceUsd: p.anchorPriceUsd,
    priceNote: p.priceNote,
    duration: p.duration,
    cta: p.cta,
    featured: Boolean(p.featured),
  }
})

export const TRUST_BADGES = [
  "Certificación internacional",
  "100% en línea",
  "Google for Education",
  "Estándar CONOCER",
]

export const BENEFICIOS_HERO = [
  { icon: "🌐", title: "100% en línea", text: "Estudia desde cualquier lugar" },
  { icon: "⚡", title: "Aplicación inmediata", text: "Enfoque práctico Montessori" },
  { icon: "👥", title: "Acompañamiento experto", text: "Guías certificadas" },
  { icon: "🎓", title: "Inscripción única", text: "No pagas de nuevo al cambiar de programa" },
]
