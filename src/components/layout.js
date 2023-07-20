import * as React from "react"
// import { useStaticQuery, graphql } from "gatsby"

import Nav from "./nav"
import Footer from "./footer"
import "./../styles/wa.css"
import { Transition } from "@headlessui/react"

const Layout = ({ children }) => {
  const [showWABtn, setShowWABtn] = React.useState(false)
  // const data = useStaticQuery(graphql`
  //   query SiteTitleQuery {
  //     site {
  //       siteMetadata {
  //         title
  //       }
  //     }
  //   }
  // `)

  return (
    <>
      <div className="dark:bg-gray-900">
        {/* <Header/> */}
        <Nav />
        <div
          style={{
            margin: `0 auto`,
            maxWidth: `var(--size-content)`,
            padding: `var(--size-gutter)`,
          }}
        >
          <main>{children}</main>

          <div id="wa" className="wa__widget_container">
            <a target="_blank" href="https://api.whatsapp.com/send?phone=5215548885013" >

              <div className="wa__btn_popup" style={{ left: 'unset', right: '30px' }}>
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
                      <div className="wa__btn_popup_txt " style={{ display: 'block', left: 'unset', right: '100%', marginRight: '7px', marginLeft: '0px', width: '228px' }}>
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
                }} onMouseOver={() => setShowWABtn(true)} style={{ background: 'rgb(45, 183, 66)' }}>
                </div>
              </div>

            </a>
          </div>
          <Footer />
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
