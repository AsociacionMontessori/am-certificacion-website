import * as React from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { getT, useLocalization } from "../../i18n"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import DatosBancariosCard from "../../components/inscripcion/DatosBancariosCard"
import ApartarInscripcionForm from "../../components/checkout/ApartarInscripcionForm"
import { useVisitorGeo } from "../../hooks/useVisitorGeo"
import { INSCRIPCION_PRECIO } from "../../data/programasOferta"

const InscripcionPagarPage = () => {
  const { t } = useTranslation("checkout")
  const { localizedPath } = useLocalization()
  const { esMexico } = useVisitorGeo()
  const coin = esMexico ? "MXN" : "USD"
  const price = esMexico ? `$${INSCRIPCION_PRECIO.priceMx}` : `$${INSCRIPCION_PRECIO.priceUsd}`

  return (
    <CheckoutPageShell
      title={t("payPage.title")}
      description={t("payPage.description")}
      backTo="/diplomados"
    >
      <ApartarInscripcionForm coin={coin} price={price} cancelHref="/diplomados" />

      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-gray/20" />
        <span className="text-xs font-medium uppercase tracking-wide text-gray">
          {t("payPage.transferDivider")}
        </span>
        <span className="h-px flex-1 bg-gray/20" />
      </div>

      <DatosBancariosCard compact esMexico={esMexico} />

      <div className="mt-4 space-y-3">
        <Link
          to={localizedPath("/inscripcion/transferencia")}
          className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-blue"
        >
          {t("payPage.transferInstructions")}
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray text-center leading-relaxed">
        {t("payPage.alreadyPaid")}{" "}
        <Link to={localizedPath("/inscripcion/completar")} className="text-blue underline font-medium">
          {t("payPage.continueStep2")}
        </Link>
      </p>

      <p className="mt-2 text-xs text-gray text-center leading-relaxed">
        {t("common.contactQuestions")}{" "}
        <a href="mailto:admin@certificacionmontessori.com" className="text-blue underline font-medium">
          admin@certificacionmontessori.com
        </a>
      </p>
    </CheckoutPageShell>
  )
}

export const Head = ({ location }) => {
  const t = getT(location.pathname, "checkout")
  return (
    <Seo
      title={t("payPage.seoTitle")}
      description={t("payPage.seoDescription")}
      pathname={location.pathname}
      robots="noindex,follow"
    />
  )
}

export default InscripcionPagarPage
