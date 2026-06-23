import * as React from "react"
import { WHATSAPP_INSCRIPCION_URL } from "../../data/contactoWhatsApp"

const InscripcionAyudaWhatsApp = ({ className = "" }) => (
  <aside
    className={`rounded-2xl border border-green/35 bg-green/10 px-4 py-4 ${className}`}
    role="note"
  >
    <p className="text-sm font-semibold text-green">¿Dudas o necesitas ayuda?</p>
    <p className="mt-1 text-sm text-gray leading-relaxed">
      En cualquier paso de tu inscripción puedes escribirnos por WhatsApp y una persona de
      nuestro equipo te atenderá con gusto.
    </p>
    <a
      href={WHATSAPP_INSCRIPCION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 min-h-[48px] inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-green bg-white px-5 py-3 text-sm font-semibold text-green hover:bg-green/5 transition-colors"
    >
      <span aria-hidden="true">💬</span>
      Contactar por WhatsApp
    </a>
  </aside>
)

export default InscripcionAyudaWhatsApp
