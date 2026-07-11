import * as React from "react"
import Footer from "./footer"
import "./../styles/wa.css"
import { Transition } from "@headlessui/react"
import "../styles/fonts.css"
import { useTranslation } from "react-i18next"
import { buildWhatsAppUrl } from "../data/contactoWhatsApp"
import { useLocalization } from "../i18n"
import TrackedActionLink from "./TrackedActionLink"
import AnalyticsConsent from "./AnalyticsConsent"

const Layout = ({ children }) => {
  const [showWABtn, setShowWABtn] = React.useState(false)
  const { t } = useTranslation("footer")
  const { language } = useLocalization()
  const whatsappInformesUrl = buildWhatsAppUrl(t("whatsapp.mensajeInformes"))

  return (
    <>
      <div className="min-h-screen">
        <div
          style={{
            margin: `0 auto`,
            maxWidth: `var(--size-content)`,
            padding: `var(--size-gutter)`,
          }}
        >
          <main>{children}</main>

          <section className="relative bg-gray">
            <Footer />
          </section>

          <div id="wa" className="wa__widget_container">
            <TrackedActionLink
              target="_blank"
              rel="noreferrer"
              href={whatsappInformesUrl}
              eventName="click_whatsapp"
              eventParams={{
                language,
                landing_path: typeof window === "undefined" ? "" : window.location.pathname,
                cta_position: "floating_widget",
                lead_channel: "whatsapp",
              }}
            >

              <div className="wa__btn_popup" style={{ left: 'unset', right: '20px', bottom: '30px' }}>
                <Transition
                  show={showWABtn}
                  enter="transition-opacity duration-75"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition-opacity duration-150"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="hidden md:block">
                    <FadeIn delay="delay-[0ms]">
                      <div className="wa__btn_popup_txt" style={{ display: 'block', left: 'unset', right: '100%', marginRight: '7px', marginLeft: '0px', maxWidth: '228px', minWidth: '180px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        <span><strong>{t("whatsapp.solicitaInformes")}</strong></span>
                      </div>
                    </FadeIn>
                  </div>
                </Transition>
                <div className="wa__btn_popup_icon" onMouseOut={() => {
                  setTimeout(() => {
                    setShowWABtn(false)
                  }
                    , 4000)
                }} onMouseOver={() => {
                  setShowWABtn(true)
                }} style={{ background: 'rgb(45, 183, 66)' }}>
                </div>
              </div>

            </TrackedActionLink>
          </div>
        </div>
      </div>
      <AnalyticsConsent />
    </>
  )
}
const FadeIn = ({ delay, children }) => (
  <Transition.Child
    enter={`transition-all ease-in-out duration-700 ${delay}`}
    enterFrom="opacity-0 translate-y-6"
    enterTo="opacity-100 translate-y-0"
    leave="transition-all ease-in-out duration-300"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
  >
    {children}
  </Transition.Child>
)
export default Layout
