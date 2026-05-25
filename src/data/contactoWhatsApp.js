/** WhatsApp institucional (mismo número que contacto y footer). */

export const WHATSAPP_PHONE = "5215548885013"

export const buildWhatsAppUrl = (message) =>
  `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`

/** Mensaje prellenado para acompañamiento en inscripción desde la portada. */
export const WHATSAPP_INSCRIPCION_URL = buildWhatsAppUrl(
  "Hola, me interesa inscribirme a un diplomado Montessori en línea. ¿Me pueden guiar paso a paso con la inscripción y compartirme la información?"
)
