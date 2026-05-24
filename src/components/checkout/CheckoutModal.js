import * as React from "react"
import { useEffect } from "react"

/**
 * Panel modal mobile-first para formularios de pago (evita recortes en tarjetas fijas).
 */
const CheckoutModal = ({ open, onClose, title, titleId = "checkout-modal-title", children }) => {
  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative z-[101] w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray/15 shrink-0">
          <h2 id={titleId} className="text-lg font-bold text-blue leading-snug pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-gray hover:bg-gray/10"
            aria-label="Cerrar formulario"
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              ×
            </span>
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

export default CheckoutModal
