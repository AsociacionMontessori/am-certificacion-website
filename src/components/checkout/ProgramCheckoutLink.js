import * as React from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"
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
  const { t } = useTranslation("programs")
  const { localizedPath } = useLocalization()

  if (disabled || !programaId) {
    return <div className={className}>{children}</div>
  }

  const to = localizedPath(getInscripcionPagarUrl(programaId))
  const label = title
    ? t("common.checkoutFor", { program: title })
    : t("common.checkout")

  return (
    <Link
      to={to}
      className={`group transition duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
      aria-label={label}
    >
      {children}
    </Link>
  )
}

export default ProgramCheckoutLink
