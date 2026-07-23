import * as React from "react"
import { Link } from "gatsby"
import { ShieldCheckIcon, XMarkIcon } from "@heroicons/react/24/outline"
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

const AUTO_MINIMIZE_MS = 12000

const AnalyticsConsent = () => {
  const { t } = useTranslation("common")
  const { localizedPath } = useLocalization()
  const closeButton = React.useRef(null)
  const focusOnOpen = React.useRef(false)
  const domController = React.useMemo(
    () => createAnalyticsConsentDomController(),
    []
  )
  const [choice, setChoice] = React.useState("unknown")
  const [open, setOpen] = React.useState(false)
  const [minimized, setMinimized] = React.useState(false)
  const [autoMinimize, setAutoMinimize] = React.useState(false)

  React.useEffect(() => {
    const current = getAnalyticsConsent()
    setChoice(current)
    setOpen(current === "unknown")
    setAutoMinimize(current === "unknown")

    const reopen = () => {
      domController.captureOpener()
      focusOnOpen.current = true
      setChoice(getAnalyticsConsent())
      setMinimized(false)
      setAutoMinimize(false)
      setOpen(true)
    }
    return domController.subscribeOpen(reopen)
  }, [domController])

  React.useEffect(() => {
    if (!open || !focusOnOpen.current) return
    focusOnOpen.current = false
    domController.focusEntry(closeButton.current)
  }, [domController, open])

  React.useEffect(() => {
    return domController.setPanelOpen(open)
  }, [domController, open])

  React.useEffect(() => {
    if (!open || !autoMinimize || choice !== "unknown") return undefined

    const timeout = window.setTimeout(() => {
      setOpen(false)
      setMinimized(true)
      setAutoMinimize(false)
    }, AUTO_MINIMIZE_MS)

    return () => window.clearTimeout(timeout)
  }, [autoMinimize, choice, open])

  const minimize = () => {
    setOpen(false)
    setMinimized(choice === "unknown")
    setAutoMinimize(false)
    domController.restoreOpener()
  }

  const expand = () => {
    domController.captureOpener()
    focusOnOpen.current = true
    setMinimized(false)
    setAutoMinimize(false)
    setOpen(true)
  }

  const choose = next => {
    if (!setAnalyticsConsent(next)) return
    setChoice(next)
    setOpen(false)
    setMinimized(false)
    setAutoMinimize(false)
    if (next === "granted") {
      trackPageView(window.location)
      trackAttributedArrival(window.location)
    }
    domController.restoreOpener()
  }

  if (!open) {
    if (!minimized) return null

    return (
      <button
        type="button"
        onClick={expand}
        className="fixed bottom-3 left-3 z-50 flex min-h-[44px] items-center gap-2 rounded-full border border-blueAccessible/20 bg-white px-3 py-2 text-sm font-semibold text-blueAccessible shadow-lg focus:outline-none focus:ring-2 focus:ring-red focus:ring-offset-2 sm:bottom-5 sm:left-5"
        aria-label={t("analyticsConsent.expand")}
        title={t("analyticsConsent.expand")}
        data-consent-state={choice}
      >
        <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
        <span>{t("analyticsConsent.minimized")}</span>
      </button>
    )
  }

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="analytics-consent-title"
      className="fixed bottom-3 left-3 right-3 z-50 rounded-md border border-blueAccessible/20 bg-white p-3 text-gray shadow-xl sm:bottom-5 sm:left-auto sm:right-5 sm:w-[24rem]"
      data-consent-state={choice}
      onPointerEnter={() => setAutoMinimize(false)}
      onFocusCapture={() => setAutoMinimize(false)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2
              id="analytics-consent-title"
              className="text-sm font-bold text-blueAccessible"
            >
              {t("analyticsConsent.title")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed sm:text-sm">
              {t("analyticsConsent.body")}{" "}
              <Link
                to={localizedPath("/privacy/")}
                className="font-semibold text-blueAccessible underline decoration-red focus:outline-none focus:ring-2 focus:ring-red"
              >
                {t("analyticsConsent.privacy")}
              </Link>
            </p>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={minimize}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-blueAccessible hover:bg-blueAccessible/10 focus:outline-none focus:ring-2 focus:ring-red focus:ring-offset-2"
            aria-label={t("analyticsConsent.close")}
            title={t("analyticsConsent.close")}
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="min-h-[44px] rounded border border-blueAccessible px-3 py-2 text-sm font-semibold text-blueAccessible focus:outline-none focus:ring-2 focus:ring-red focus:ring-offset-2"
          >
            {t("analyticsConsent.reject")}
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="min-h-[44px] rounded bg-blueAccessible px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red focus:ring-offset-2"
          >
            {t("analyticsConsent.accept")}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default AnalyticsConsent
