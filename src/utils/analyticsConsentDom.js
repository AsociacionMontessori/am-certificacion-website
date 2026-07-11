const { CONSENT_OPEN_EVENT } = require("./analyticsConsent")

const BODY_CLASS = "analytics-consent-open"

const getRuntime = target =>
  target || (typeof window !== "undefined" ? window : undefined)

const getDocument = target => {
  try {
    return getRuntime(target)?.document
  } catch (_error) {
    return undefined
  }
}

const focusElement = element => {
  try {
    if (typeof element?.focus !== "function") return false
    element.focus()
    return true
  } catch (_error) {
    return false
  }
}

const createAnalyticsConsentDomController = target => {
  let opener = null

  return {
    subscribeOpen(handler) {
      const runtime = getRuntime(target)
      let subscribed = false
      try {
        if (typeof runtime?.addEventListener !== "function") return () => {}
        runtime.addEventListener(CONSENT_OPEN_EVENT, handler)
        subscribed = true
      } catch (_error) {
        return () => {}
      }
      return () => {
        if (!subscribed) return
        try {
          runtime.removeEventListener?.(CONSENT_OPEN_EVENT, handler)
        } catch (_error) {
          // Effect cleanup remains fail-safe when browser APIs are restricted.
        }
      }
    },

    setPanelOpen(open) {
      let classList
      try {
        classList = getDocument(target)?.body?.classList
        classList?.toggle?.(BODY_CLASS, open)
      } catch (_error) {
        // Consent choices remain functional without body-class integration.
      }
      return () => {
        try {
          classList?.remove?.(BODY_CLASS)
        } catch (_error) {
          // Effect cleanup remains fail-safe when classList is unavailable.
        }
      }
    },

    captureOpener() {
      try {
        const activeElement = getDocument(target)?.activeElement
        opener =
          typeof activeElement?.focus === "function" ? activeElement : null
        return opener !== null
      } catch (_error) {
        opener = null
        return false
      }
    },

    focusEntry(element) {
      return focusElement(element)
    },

    restoreOpener() {
      const element = opener
      opener = null
      return focusElement(element)
    },
  }
}

module.exports = {
  BODY_CLASS,
  createAnalyticsConsentDomController,
  focusElement,
}
