import * as React from "react"
import { Link } from "gatsby"
import { ArrowRightIcon, ClockIcon } from "@heroicons/react/24/outline"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"
import { getInscripcionPagarUrl } from "../../data/programasOferta"
import { useVisitorGeo } from "../../hooks/useVisitorGeo"
import { getLocalizedPrice } from "../../utils/localizedPrice"

const { trackEvent } = require("../../utils/analytics")

const ProgramOfferPanel = ({ program, programId }) => {
  const { t } = useTranslation(["programs", "diplomados"])
  const { language, localizedPath } = useLocalization()
  const { geo } = useVisitorGeo()
  const { coin, price } = getLocalizedPrice(
    geo,
    program.priceMx,
    program.priceUsd
  )
  const checkoutPath = localizedPath(getInscripcionPagarUrl(programId))
  const duration = t(`diplomados:programas.${programId}.duration`, {
    defaultValue: program.duration,
  })
  const priceNoteKey = program.promoInscripcionIncluida
    ? "common.priceNotePromoIncluded"
    : program.tipo === "guia"
    ? "common.priceNoteMonthly"
    : "common.priceNoteProgram"

  return (
    <aside
      className="rounded-md border border-white/30 bg-white p-6 text-gray shadow-2xl sm:p-7"
      aria-label={t("common.currentPrice")}
    >
      <p className="inline-flex items-center gap-2 text-sm font-bold text-blueAccessible">
        <span className="h-2 w-2 rounded-full bg-green" aria-hidden="true" />
        {t("common.online")}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-5 border-y border-gray/15 py-5">
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray/80">
            <ClockIcon className="h-4 w-4" aria-hidden="true" />
            {t("common.duration")}
          </dt>
          <dd className="mt-2 text-lg font-bold text-gray">{duration}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-gray/80">
            {t("common.currentPrice")}
          </dt>
          <dd className="mt-2 text-lg font-bold text-gray">
            ${price} <span className="text-sm">{coin}</span>
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-gray/80">
        {t(priceNoteKey)}
      </p>
      <Link
        to={checkoutPath}
        onClick={() =>
          trackEvent("click_program_cta", {
            language,
            program_id: programId,
            landing_path:
              typeof window === "undefined" ? "" : window.location.pathname,
            cta_position: "program_offer",
          })
        }
        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-red px-5 py-3 font-bold text-white transition-colors hover:bg-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2"
      >
        {t("common.checkout")}
        <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
      </Link>
    </aside>
  )
}

export default ProgramOfferPanel
