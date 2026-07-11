const { initializeAnalyticsConsent } = require("./src/utils/analyticsConsent")
const { trackAttributedArrival, trackPageView } = require("./src/utils/analytics")

import './src/styles/global.css'
import wrapPage from './src/i18n/wrap-page'
import { maybeRedirectToBrowserLanguage } from './src/i18n/browser-language'

export const wrapPageElement = wrapPage

export const onClientEntry = () => {
  initializeAnalyticsConsent()
  maybeRedirectToBrowserLanguage()
}

export const onRouteUpdate = ({ location }) => {
  trackPageView(location)
  trackAttributedArrival(location)
}
