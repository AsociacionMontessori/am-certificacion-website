const CONSENT_KEY = "ammac-analytics-consent-v1"
const MEASUREMENT_ID = "G-P0CNEGW276"
const SCRIPT_ID = "ammac-google-tag"
const CONSENT_CHANGE_EVENT = "ammac:analytics-consent-change"
const CONSENT_OPEN_EVENT = "ammac:analytics-consent-open"
const { buildSafePageContext } = require("./analyticsPageContext")

const memoryConsent = new WeakMap()
const loaderStates = new WeakMap()

const getRuntime = target =>
  target || (typeof window !== "undefined" ? window : undefined)

const isRuntime = runtime =>
  (typeof runtime === "object" && runtime !== null) ||
  typeof runtime === "function"

const isConsentState = value => value === "granted" || value === "denied"

const getAnalyticsConsent = target => {
  const runtime = getRuntime(target)
  if (!isRuntime(runtime)) return "unknown"

  const memory = memoryConsent.get(runtime)
  if (memory?.authoritative && isConsentState(memory.state)) return memory.state

  try {
    const stored = runtime.localStorage?.getItem(CONSENT_KEY)
    if (isConsentState(stored)) {
      memoryConsent.set(runtime, { state: stored, authoritative: false })
      return stored
    }
  } catch (_error) {
    // The in-memory choice remains valid for this page session.
  }

  return memory?.state || "unknown"
}

const isAnalyticsGranted = target => getAnalyticsConsent(target) === "granted"

const consentPayload = analyticsStorage => ({
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: analyticsStorage,
})

const ensureGtagQueue = runtime => {
  try {
    runtime.dataLayer = runtime.dataLayer || []
    runtime.gtag =
      runtime.gtag ||
      function gtag() {
        runtime.dataLayer.push(arguments)
      }
    return typeof runtime.gtag === "function"
  } catch (_error) {
    return false
  }
}

const queueGtag = (runtime, ...args) => {
  try {
    if (typeof runtime.gtag !== "function") return false
    runtime.gtag(...args)
    return true
  } catch (_error) {
    return false
  }
}

const getLoaderState = runtime => {
  let state = loaderStates.get(runtime)
  if (!state) {
    state = {
      defaultQueued: false,
      grantedUpdateRequired: true,
      jsQueued: false,
      configQueued: false,
      loaded: false,
      script: null,
      failedScripts: new WeakSet(),
    }
    loaderStates.set(runtime, state)
  }
  return state
}

const queueInitialCommands = (runtime, state) => {
  if (!state.defaultQueued) {
    if (!queueGtag(runtime, "consent", "default", consentPayload("denied"))) {
      return false
    }
    state.defaultQueued = true
  }
  if (state.grantedUpdateRequired) {
    if (!queueGtag(runtime, "consent", "update", consentPayload("granted"))) {
      return false
    }
    state.grantedUpdateRequired = false
  }
  if (!state.jsQueued) {
    if (!queueGtag(runtime, "js", new Date())) return false
    state.jsQueued = true
  }
  if (!state.configQueued) {
    if (
      !queueGtag(runtime, "config", MEASUREMENT_ID, {
        send_page_view: false,
        ...buildSafePageContext(runtime),
      })
    ) {
      return false
    }
    state.configQueued = true
  }
  return true
}

const getDocument = runtime => {
  try {
    return runtime.document
  } catch (_error) {
    return undefined
  }
}

const findScript = (document, state) => {
  try {
    const script =
      typeof document?.querySelector === "function"
        ? document.querySelector(`#${SCRIPT_ID}`)
        : null
    return script && !state.failedScripts.has(script) ? script : null
  } catch (_error) {
    return null
  }
}

const loadGoogleTag = target => {
  const runtime = getRuntime(target)
  if (!isRuntime(runtime) || !isAnalyticsGranted(runtime)) return false
  if (!ensureGtagQueue(runtime)) return false

  const state = getLoaderState(runtime)
  if (!queueInitialCommands(runtime, state)) return false
  if (state.loaded) return true
  if (state.script && !state.failedScripts.has(state.script)) return true

  const document = getDocument(runtime)
  if (!document) return false

  const existing = findScript(document, state)
  if (existing) {
    state.script = existing
    return true
  }

  let script
  try {
    if (
      typeof document.createElement !== "function" ||
      typeof document.head?.appendChild !== "function"
    ) {
      return false
    }
    script = document.createElement("script")
    script.id = SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
    script.onload = () => {
      if (state.failedScripts.has(script)) return
      state.loaded = true
      state.script = script
    }
    script.onerror = () => {
      state.failedScripts.add(script)
      state.loaded = false
      if (state.script === script) state.script = null
      try {
        script.id = `${SCRIPT_ID}-failed`
      } catch (_error) {
        // Removing the canonical id still permits a later query and retry.
      }
      try {
        script.remove?.()
      } catch (_error) {
        // A later initialize call can still query and retry insertion.
      }
    }
    state.script = script
    document.head.appendChild(script)
    return true
  } catch (_error) {
    if (state.script === script) state.script = null
    try {
      script?.remove?.()
    } catch (_removeError) {
      // Script insertion remains fail-safe when DOM cleanup is unavailable.
    }
    return false
  }
}

const dispatch = (runtime, type, detail = {}) => {
  try {
    if (
      typeof runtime?.dispatchEvent !== "function" ||
      typeof runtime?.CustomEvent !== "function"
    ) {
      return false
    }
    runtime.dispatchEvent(new runtime.CustomEvent(type, { detail }))
    return true
  } catch (_error) {
    return false
  }
}

const removeGoogleAnalyticsCookies = runtime => {
  const document = getDocument(runtime)
  if (!document) return false

  let cookieNames
  try {
    cookieNames = String(document.cookie || "")
      .split(";")
      .map(cookie => cookie.split("=", 1)[0].trim())
      .filter(name => name === "_ga" || name.startsWith("_ga_"))
  } catch (_error) {
    return false
  }

  const expiry =
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Path=/; SameSite=Lax"
  for (const name of new Set(cookieNames)) {
    for (const domain of [
      "",
      " Domain=certificacionmontessori.com;",
      " Domain=.certificacionmontessori.com;",
    ]) {
      try {
        document.cookie = `${name}=;${domain} ${expiry}`
      } catch (_error) {
        // Continue removing any remaining GA cookies and domain variants.
      }
    }
  }
  return cookieNames.length > 0
}

const setAnalyticsConsent = (state, target) => {
  if (!isConsentState(state)) return false
  const runtime = getRuntime(target)
  if (!isRuntime(runtime)) return false

  const previous = getAnalyticsConsent(runtime)
  let persisted = false
  try {
    if (typeof runtime.localStorage?.setItem === "function") {
      runtime.localStorage.setItem(CONSENT_KEY, state)
      persisted = true
    }
  } catch (_error) {
    // Consent remains effective in memory for the current page session.
  }
  memoryConsent.set(runtime, { state, authoritative: !persisted })

  if (state === "granted") {
    const loaderState = getLoaderState(runtime)
    loadGoogleTag(runtime)
  } else if (previous === "granted") {
    const loaderState = getLoaderState(runtime)
    queueGtag(runtime, "consent", "update", consentPayload("denied"))
    loaderState.grantedUpdateRequired = true
    removeGoogleAnalyticsCookies(runtime)
  }

  dispatch(runtime, CONSENT_CHANGE_EVENT, { state })
  return true
}

const initializeAnalyticsConsent = target =>
  isAnalyticsGranted(target) ? loadGoogleTag(target) : false

const openAnalyticsConsent = target =>
  dispatch(getRuntime(target), CONSENT_OPEN_EVENT)

module.exports = {
  CONSENT_CHANGE_EVENT,
  CONSENT_KEY,
  CONSENT_OPEN_EVENT,
  MEASUREMENT_ID,
  SCRIPT_ID,
  getAnalyticsConsent,
  initializeAnalyticsConsent,
  isAnalyticsGranted,
  loadGoogleTag,
  openAnalyticsConsent,
  removeGoogleAnalyticsCookies,
  setAnalyticsConsent,
}
