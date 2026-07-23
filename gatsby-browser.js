import "./src/styles/global.css"
import wrapPage from "./src/i18n/wrap-page"
import { maybeRedirectToBrowserLanguage } from "./src/i18n/browser-language"

const { initializeAnalyticsConsent } = require("./src/utils/analyticsConsent")
const {
  registerAnalyticsNavigation,
  trackAttributedArrival,
  trackPageView,
} = require("./src/utils/analytics")

export const wrapPageElement = wrapPage

export const onClientEntry = () => {
  initializeAnalyticsConsent()
  maybeRedirectToBrowserLanguage()
}

export const onRouteUpdate = ({ location }) => {
  registerAnalyticsNavigation(location)
  trackPageView(location)
  trackAttributedArrival(location)
}
