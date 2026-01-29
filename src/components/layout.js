import * as React from "react"
import Footer from "./footer"
import "./../styles/wa.css"
import { Transition } from "@headlessui/react"
import "../styles/fonts.css"
import { StaticImage } from "gatsby-plugin-image"

const Layout = ({ children }) => {
  const [showWABtn, setShowWABtn] = React.useState(false)
  const [showAMBtn, setShowAMBtn] = React.useState(false)
  const [readed, setReaded] = React.useState(false)

  return (
    <>
      <div className="bg-gradient-to-r from-blue via-purple to-green">
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
            <a target="_blank" rel="noreferrer" href="https://api.whatsapp.com/send?phone=5215548885013&text=Hola, Me gustaría información sobre la certificación Montessori." >

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
                        <span><strong>Solicita Informes</strong></span>
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
                  setShowAMBtn(false)
                }} style={{ background: 'rgb(45, 183, 66)' }}>
                </div>
              </div>

            </a>

              <div className="wa__btn_popup am__btn_popup_container" style={{ left: 'unset', right: '20px', bottom: '100px' }}>
                <Transition
                  show={showAMBtn}
                  enter="transition-opacity duration-75"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition-opacity duration-150"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="hidden md:block">
                    <FadeIn delay="delay-[0ms]">
                      <div className="am__popup_card">
                        <div className="am__popup_header">
                          <StaticImage src="../images/notf.png" alt="AM" placeholder="none" className="am__popup_image" />
                        </div>
                        <div className="am__popup_content">
                          <iframe 
                            className="am__popup_iframe" 
                            title="Eventos" 
                            src="https://montessorimexico.org/massterclass/" 
                            name="myiFrame" 
                            scrolling="no" 
                            frameBorder="0" 
                            marginHeight="0" 
                            marginWidth="0" 
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    </FadeIn>
                  </div>
                </Transition>
                <div className="am__btn_popup_icon" onMouseOut={() => {
                  setTimeout(() => {
                    setShowAMBtn(false)
                  }
                    , 10000)
                }} 
                 onClick={() => {
                  setShowAMBtn(true)
                  setShowWABtn(false)
                  setReaded(true)
                  setTimeout(() => {
                    setShowAMBtn(false)
                  }, 6000)
                 }}
                >
                  {!readed ? <div>
                    <div
                      className="absolute bottom-auto left-auto right-0 top-0 z-10 inline-block -translate-y-1/2 translate-x-2/4 rotate-0 skew-x-0 skew-y-0 scale-x-100 scale-y-100 whitespace-nowrap rounded-full bg-red px-2.5 py-1 text-center align-baseline text-xs font-bold leading-none text-white">
                      1
                    </div>
                  </div> : ""

                  }
                  <StaticImage src="../images/lasc.png" alt="AM" placeholder="none" className="w-full p-[0.7rem]" />
                </div>
              </div>

          </div>

        </div>
      </div>
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
