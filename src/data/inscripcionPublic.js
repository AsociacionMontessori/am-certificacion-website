/** Datos públicos del flujo de inscripción (sitio Gatsby). */

import {
  INSCRIPCION_PRECIO,
  PROGRAMAS_CHECKOUT_OPCIONES,
  mapProgramaCheckoutANivel,
  getResumenPagoInscripcion,
  getTotalPagoCheckout,
  getProgramaByCheckoutLabel,
} from "./programasOferta"

export const INSCRIPCION_PUBLIC = {
  sku: "inscripcion_diplomado",
  priceMx: INSCRIPCION_PRECIO.priceMx,
  priceUsd: INSCRIPCION_PRECIO.priceUsd,
}

export const PROGRAMAS_INSCRIPCION = PROGRAMAS_CHECKOUT_OPCIONES

export {
  mapProgramaCheckoutANivel,
  getResumenPagoInscripcion,
  getTotalPagoCheckout,
  getProgramaByCheckoutLabel,
}
