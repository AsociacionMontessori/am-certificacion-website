import * as React from "react"
import { Link } from "gatsby"
import { getInscripcionPagarUrl } from "../../data/programasOferta"

/**
 * Envuelve una tarjeta de programa y lleva al checkout de inscripción (mismo flujo que el carrusel de inicio).
 */
const ProgramCheckoutLink = ({
  programaId,
  title,
  children,
  className = "",
  disabled = false,
}) => {
  if (disabled || !programaId) {
    return <div className={className}>{children}</div>
  }

  const to = getInscripcionPagarUrl(programaId)
  const label = title ? `Inscribirte a ${title}` : "Ir al pago en línea"

  return (
    <Link
      to={to}
      className={`group block rounded-3xl transition duration-150 ease-in-out hover:scale-[1.02] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
      aria-label={label}
    >
      {children}
      <span className="sr-only">{label}</span>
      <p className="mt-2 text-center text-xs font-semibold text-white/90 group-hover:text-white">
        Toca para inscribirte en línea →
      </p>
    </Link>
  )
}

export default ProgramCheckoutLink
