import * as React from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { getT, useLocalization } from "../../i18n"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import DatosBancariosCard from "../../components/inscripcion/DatosBancariosCard"
import { DATOS_BANCARIOS_INSCRIPCION } from "../../data/datosBancarios"
import { useVisitorGeo } from "../../hooks/useVisitorGeo"

const InscripcionTransferenciaPage = () => {
  const { t } = useTranslation("checkout")
  const { localizedPath } = useLocalization()
  const { esMexico } = useVisitorGeo()
  const pasosTransferencia = t("transferPage.steps", {
    returnObjects: true,
    email: DATOS_BANCARIOS_INSCRIPCION.correoComprobante,
  })

  return (
  <CheckoutPageShell
    title={t("transferPage.title")}
    description={t("transferPage.description")}
    backTo="/inscripcion/pagar"
  >
    <DatosBancariosCard esMexico={esMexico} />

    <div className="mt-6 space-y-4">
      {pasosTransferencia.map((paso) => (
        <article
          key={paso.title}
          className="rounded-2xl border border-gray/20 bg-white px-4 py-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-blue mb-2">{paso.title}</h2>
          <p className="text-sm text-gray leading-relaxed">{paso.text}</p>
        </article>
      ))}
    </div>

    <div className="mt-8 flex flex-col gap-3">
      <Link
        to={localizedPath("/inscripcion/completar")}
        className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-blue"
      >
        {t("transferPage.confirmedReference")}
      </Link>
    </div>
  </CheckoutPageShell>
  )
}

export const Head = ({ location }) => {
  const t = getT(location.pathname, "checkout")
  return (
    <Seo
      title={t("transferPage.seoTitle")}
      description={t("transferPage.seoDescription")}
      pathname={location.pathname}
      robots="noindex,follow"
    />
  )
}

export default InscripcionTransferenciaPage
