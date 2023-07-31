import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import imagen from '../images/banners/cert.png'
import Card from '../components/cards/card'
import CardInscription from '../components/cards/inscriptionCard'
import Button from '../components/button'
import { StaticImage } from "gatsby-plugin-image"


const certificate = () => {


  const prices = [
    { title: 'Certificado', subtitle: 'único pago', price: '2,500' },
    { name: 'SOBRE NOSOTROS', href: '../certificate', current: false },
    { name: 'PUBLICACIONES', href: '../certificate', current: false },
    { name: 'KALPILLI', href: '../certificate', current: false },
    { name: 'CONTACTO', href: '../certificate', current: false },

    // const CardPrice = ({ title, subtitle, price, coin, time, text, }) 
  ]

  return (
    <Layout>
      <main>
        <section id="home" class="relative flex min-h-screen items-center">
          <div aria-hidden="true" class="absolute inset-0 z-[1] bg-gradient-to-b from-white/0 via-gray/20 to-gray"></div>
          <img src={imagen} class="fixed inset-0 h-full w-full object-cover" alt="woman in dark" width="4160" height="6240" />
          <div class="relative z-10 mx-auto max-w-7xl px-6 pb-40 pt-40 lg:px-12 xl:px-6 2xl:px-0">
            <div class="pb-6 media-h:md:pb-32 media-h:lg:pb-6 xl:pb-6">
              <h1 data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" class="rellax text-6xl font-bold text-white sm:text-7xl md:text-8xl xl:leading-tight" >Certifícate como <br /> Guía Montessori</h1>
            </div>
            <div>
              <div class="mr-auto md:w-3/5 md:pt-2 lg:w-2/3">
                <p class="mb-5 text-lg font-light text-white sm:text-2xl xl:leading-normal">
                  Descubre Nuestros programas de certificación con validez internacional, conoce el método Montessori y aprende a implementarlo en tu salón de clases.
                </p>
                <div className="mb-5">
                  <button className="btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-blue text-white bg-opacity-10">Conocer las certificaciones
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-down" viewBox="0 0 16 16"> <path d="M3.204 5h9.592L8 10.481 3.204 5zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z" /> </svg>
                  </button>
                  <a href="https://kalpilli.com/MetodoMontessori/" target="__blank" className="btn btn-outline hover:text-white hover:bg-green bg-gradient-to-r from-green/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10">
                    Conoce el Método
                  </a>
                </div>
              </div>
            </div>
          </div>

        </section>
        <section id="certificacion_internacional" class="relative py-5 z-10 bg-gradient-to-r from-blue to-green py-20">
          <h2 className="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0">
            <span className="text-white text-2xl md:text-6xl font-bold">Certificación Montessori</span>
          </h2>
          <div className="bg-white rounded-3xl">
            <div className="flex mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0 ">
              <div className="md:2/4 w-3/4 absolute md:relative md:block flex sm:flex-col ">
                <h3>
                  <span className="text-red md:text-2xl text-xl">
                    Certificación internacional
                  </span>
                </h3>
                <h2 className="mt-5">
                  <span className="font-medium text-black md:text-6xl text-3xl">
                    Guía Montessori
                  </span>
                </h2>
                <div className="w-auto pt-10 pr-24 text-lg text-black">
                  <p>
                    Ofrecemos programas de certificación con reconocimiento internacional, diseñados para proporcionar una sólida base en el método y la filosofía Montessori.
                    <br />
                    <br />
                    Ya sea que busques una introducción a Montessori o desees profundizar tu conocimiento y práctica, tenemos el programa adecuado para ti.
                    <br />
                    <br />
                    <br />
                    <span className="text-gray text-sm">Aplican términos y condiciones *</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center bg-white pb-10 flex flex-end rounded-3xl absolute left-1/2 translate-x-52 lg:translate-x-52 xl:translate-x-80 transform 2xl:translate-x-96 md:translate-y-[-5rem] lg:translate-y-[-4rem] md:h-[36rem] lg:h-[32rem] ">
                <CardInscription title="Inscripción" subtitle="único pago" coin=" MXN" price="5,000" text="Único pago de" />
              </div>
            </div>
          </div>


          <section id="prices" className="mt-24 mb-10">
            <div className="flex space-x-32 justify-center">
              <Card title="Certificado" subtitle="unico pago" coin="USD" price="200" text="nido y comunidad" time="16 meses"></Card>
              <Card title="Certificado" subtitle="unico pago" coin="USD" price="200" text="nido y comunidad" time="16 meses"></Card>
              <Card title="Certificado" subtitle="unico pago" coin="USD" price="200" text="nido y comunidad" time="16 meses"></Card>
              <Card title="Certificado" subtitle="unico pago" coin="USD" price="200" text="nido y comunidad" time="16 meses"></Card>
            </div>
            <div>

            </div>
            <p className="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0 text-white text-sm">
              Precios sujetos a disponibilidad. Aplican Términos y Condiciones.
            </p>
          </section>
          <section id="scholarships" className="bg-white rounded-3xl">
            <div className="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0">
              <h3>
                <span className="text-red md:text-3xl text-xl text-semibold">
                  Conoce nuestro proyecto de becas
                </span>
              </h3>
              <div className="flex text-black flex-col justify-center items-center md:flex-row">
                <div className="mt-3">
                  <h4>
                    <span className="text-xl">
                      Requisitos
                    </span>
                  </h4>
                  <ul className="mt-2 ml-3">
                    <li className="my-1">
                      No tener ningún atraso en las entregas de actividades
                    </li>
                    <li className="my-1">
                      Asistir al 80 % de clases
                    </li>
                    <li className="my-1">
                      Realizar por lo menos una práctiva virtual (conferencia o proyecto)
                    </li>
                  </ul>
                  <div className="flex mt-5 items-center">
                    <div>
                      <Button text="Conocer Más" />
                    </div>
                    <div className="mx-1 w-2/3 text-blue">
                      <h5 className="md:text-lg text-base font-semibold">
                        Todas las solicitudes son revisadas y evaluadas por el comité académico
                      </h5>
                      <p className="text-xs">Sujetas a disponibilidad</p>
                    </div>
                  </div>
                </div>
                <div className="mt-10">
                  <StaticImage src="../images/sclshipp.png" className="w-72 w-56 md:w-80 ml-0 md:ml-20"/>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </Layout>
  )
}

export const Head = () => <Seo title="Certifícate" />

export default certificate
