import * as React from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../i18n"
const {
  getAnalyticsConsent,
  setAnalyticsConsent,
} = require("../utils/analyticsConsent")
const { trackAttributedArrival, trackPageView } = require("../utils/analytics")
const {
  createAnalyticsConsentDomController,
} = require("../utils/analyticsConsentDom")

const AnalyticsConsent = () => {
  const { t } = useTranslation("common")
  const { localizedPath } = useLocalization()
  const declineButton = React.useRef(null)
  const domController = React.useMemo(
    () => createAnalyticsConsentDomController(),
    []
  )
  const [choice, setChoice] = React.useState("unknown")
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const current = getAnalyticsConsent()
    setChoice(current)
    setOpen(current === "unknown")

    const reopen = () => {
      domController.captureOpener()
      setChoice(getAnalyticsConsent())
      setOpen(true)
    }
    return domController.subscribeOpen(reopen)
  }, [domController])

  React.useEffect(() => {
    if (open) domController.focusEntry(declineButton.current)
  }, [domController, open])

  React.useEffect(() => {
    return domController.setPanelOpen(open)
  }, [domController, open])

  const choose = next => {
    if (!setAnalyticsConsent(next)) return
    setChoice(next)
    setOpen(false)
    if (next === "granted") {
      trackPageView(window.location)
      trackAttributedArrival(window.location)
    }
    domController.restoreOpener()
  }

  if (!open) return null

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="analytics-consent-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-blue/20 bg-white px-4 py-4 text-gray shadow-2xl sm:px-5"
      data-consent-state={choice}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h2
            id="analytics-consent-title"
            className="text-base font-bold text-blue"
          >
            {t("analyticsConsent.title")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed">
            {t("analyticsConsent.body")}{" "}
            <Link
              to={localizedPath("/privacy/")}
              className="font-semibold text-blue underline decoration-red focus:outline-none focus:ring-2 focus:ring-red"
            >
              {t("analyticsConsent.privacy")}
            </Link>
          </p>
        </div>
        <div className="grid w-full shrink-0 grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
          <button
            ref={declineButton}
            type="button"
            onClick={() => choose("denied")}
            className="min-h-[44px] border border-blue px-4 py-2 font-semibold text-blue focus:outline-none focus:ring-2 focus:ring-red focus:ring-offset-2"
          >
            {t("analyticsConsent.reject")}
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="min-h-[44px] bg-blue px-4 py-2 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red focus:ring-offset-2"
          >
            {t("analyticsConsent.accept")}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default AnalyticsConsent
