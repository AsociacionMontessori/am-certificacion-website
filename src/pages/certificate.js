import React, { useState, useEffect } from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import imagen from '../images/banners/cert.png'
import CertificationPrice from '../components/certificationPrice'
import Scholarship from '../components/scholarship'


const Certificate = () => {
  return (
    <Layout>
      <main>
        <section id="home" className="relative flex min-h-screen items-center">
          <div aria-hidden="true" className="absolute inset-0 z-[1] bg-gradient-to-b from-white/0 via-gray/20 to-gray"></div>
          <img src={imagen} className="fixed inset-0 h-full w-full object-cover" alt="woman in dark" width="4160" height="6240" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-40 pt-40 lg:px-12 xl:px-6 2xl:px-0">
            <div className="pb-6 media-h:md:pb-32 media-h:lg:pb-6 xl:pb-6">
              <h1 data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" className="rellax text-6xl font-bold text-white sm:text-7xl md:text-8xl xl:leading-tight" >Certifícate como <br /> Guía Montessori</h1>
            </div>
            <div>
              <div className="mr-auto md:w-3/5 md:pt-2 lg:w-2/3">
                <p className="mb-5 text-lg font-light text-white sm:text-2xl xl:leading-normal">
                  Descubre Nuestros programas de certificación con validez internacional, conoce el método Montessori y aprende a implementarlo en tu salón de clases.
                </p>
                <div className="mb-5">
                  <button className="btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-blue text-white bg-opacity-10">Conocer las certificaciones
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-caret-down" viewBox="0 0 16 16"> <path d="M3.204 5h9.592L8 10.481 3.204 5zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z" /> </svg>
                  </button>
                  <a href="https://kalpilli.com/MetodoMontessori/" target="__blank" className="btn btn-outline hover:text-white hover:bg-green bg-gradient-to-r from-green/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10">
                    Conoce el Método
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <CertificationPrice/>
        {/* <Scholarship/> */}
      </main>
    </Layout>
  )
}
export const Head = () => <Seo title="Certifícate" />
export default Certificate
