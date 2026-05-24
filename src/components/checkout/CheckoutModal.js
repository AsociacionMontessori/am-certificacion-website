import * as React from "react"
import { useEffect, useRef } from "react"

const FORM_INSCRIPCION_ADMIN =
  "https://forms.gle/8mNepRAmhS82awAr7"

/**
 * Panel modal mobile-first para formularios de pago.
 * El contenedor exterior permite scroll si el panel no cabe en pantalla.
 */
const CheckoutModal = ({ open, onClose, title, titleId = "checkout-modal-title", children }) => {
  const overlayRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined
    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = "hidden"
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
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

  useEffect(() => {
    if (!open) return
    if (overlayRef.current) overlayRef.current.scrollTop = 0
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain touch-pan-y"
      role="presentation"
    >
      <div className="flex min-h-full items-end justify-center sm:items-center p-0 sm:p-4 py-4 sm:py-8">
        <button
          type="button"
          className="fixed inset-0 bg-black/55 backdrop-blur-[2px] cursor-default"
          aria-label="Cerrar"
          onClick={onClose}
          tabIndex={-1}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative z-[101] w-full max-w-lg max-h-[min(92dvh,100%)] sm:max-h-[min(90dvh,100%)] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl my-auto sm:my-0"
        >
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
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-5"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export { FORM_INSCRIPCION_ADMIN }
export default CheckoutModal
