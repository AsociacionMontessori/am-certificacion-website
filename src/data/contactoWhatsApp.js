/** WhatsApp institucional (mismo número que contacto y footer). */

export const WHATSAPP_PHONE = "5215548885013"

export const buildWhatsAppUrl = (message) =>
  `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`

/** Mensaje prellenado para resolver dudas antes de iniciar el pago. */
export const WHATSAPP_DUDAS_URL = buildWhatsAppUrl(
  "Hola, estoy revisando los diplomados Montessori en línea y tengo algunas dudas antes de inscribirme. ¿Me pueden orientar?"
)

/** Mensaje prellenado para acompañamiento durante la inscripción. */
export const WHATSAPP_INSCRIPCION_URL = buildWhatsAppUrl(
  "Hola, me interesa inscribirme a un diplomado Montessori en línea. ¿Me pueden guiar paso a paso con la inscripción y compartirme la información?"
)
