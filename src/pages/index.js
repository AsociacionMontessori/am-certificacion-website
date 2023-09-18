import * as React from "react"
import '../styles/global.css'
import Layout from "../components/layout"
import Seo from "../components/seo"
import imagen from '../images/banners/home.png'
import ImgMap from '../images/banners/map.png'
import ImgMapDark from '../images/banners/dark_map.png'
import { StaticImage } from "gatsby-plugin-image"
import Timeline from '../components/timeline/timeline'
import Nav from "../components/nav"

function CustomParagraph1({ text }) {
  return (
    <p className="italic bg-red/20 dark:bg-black hover:font-semibold dark:hover:text-blue rounded-full py-3 px-10 dark:text-white/80 mx-3 selection:bg-blue selection:text-white">
      {text}
    </p>
  );
}
function CustomParagraph2({ text }) {
  return (
    <p className="italic bg-red/20 dark:bg-black hover:font-semibold dark:hover:text-green/70 rounded-full py-3 px-10 dark:text-white/80 mx-3 selection:bg-green/70 selection:text-white">
      {text}
    </p>
  );
}

const phrases = [
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
];

const phrases2 = [
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
];

const IndexPage = () => (
  <Layout>
    {/* <Nav textColor="text-white" /> */}
    <main>
      <section id="home" className="relative flex items-center">
        <div aria-hidden="true" className="absolute inset-0 z-[1] bg-gradient-to-b from-white/0 via-white/10 to-white/60  dark:bg-gradient-to-b dark:from-white/0 dark:via-gray/20 dark:to-gray" />
        <img src={imagen} className="fixed inset-0 h-full w-full object-cover" alt="woman in dark" width="4160" height="6240" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-40 pt-40 lg:px-12 xl:px-6 2xl:px-0 selection:text-white selection:bg-green selection:bg-opacity-20">
          <div className="pb-12 media-h:md:pb-32 media-h:lg:pb-4 xl:pb-4">
            <h1 data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" className="rellax text-6xl font-bold text-white sm:text-7xl md:text-8xl xl:leading-tight" >
              Asociación Montessori <br />de México A.C.
            </h1>
          </div>
          <div>
            <div className="mr-auto md:w-3/5 md:pt-2 lg:w-2/3">
              <p className="mb-5 text-lg font-light text-white sm:text-2xl xl:leading-normal">
                Únete a nosotros en este emocionante viaje de aprendizaje y exploración. Descubre la filosofía y práctica de este gran método, con nuestras clases gratuitas, contenido y certificaciones con validez internacional.
              </p>
              <div className="mb-5">
                <a href="./certificate" className="btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-blue text-white bg-opacity-10">
                  Certifícate
                </a>
                <a href="https://kalpilli.com/MetodoMontessori/" target="__blank" className="pt-3 sm:pt-0 btn btn-outline hover:text-white hover:bg-green bg-gradient-to-r from-green/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10">
                  Conoce el Método
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="work" className="relative py-5 z-10 bg-white dark:bg-gray lg:pt-0">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-6 2xl:px-0 pt-10">
          <div data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" className="rellax flex flex-wrap items-center gap-6 selection:text-white selection:bg-red selection:bg-opacity-20">
            <h2 className="pt-5 text-5xl text-red font-bold dark:text-white xl:text-6xl">EDUCACIÓN SIGNIFICATIVA</h2>
            <p className="text-2xl">
              En la educación significativa, se busca que los <strong className="text-blue dark:text-red">estudiantes se involucren de manera activa en su propio proceso de aprendizaje,</strong> relacionando los nuevos conceptos con su conocimiento previo y con su entorno. El objetivo es que los estudiantes no solo adquieran información de manera pasiva, sino que la comprendan, le encuentren sentido y la integren en su propia estructura cognitiva.
            </p>
          </div>
        </div>
        <div className="overflow-hidden mt-5">
          <section className="my-5 block h-12 overflow-hidden relative w-max marquee-left xxl:hidden">
            <div className="flex float-left w-50">
              {phrases.map((phrase, index) => (
                <CustomParagraph1 key={index} text={phrase} />
              ))}
            </div>
          </section>
          <section className="my-5 block h-12 overflow-hidden relative w-max marquee-left xxl:hidden mb-20">
            <div className="flex float-left w-50">
              {phrases2.map((phrase, index) => (
                <CustomParagraph2 key={index} text={phrase} />
              ))}
            </div>
          </section>
          <section className="bg-gradient-to-r from-blue via-purple to-green py-20">
            <div className="flex justify-center">
              <div className="flex justify-center relative w-full selection:text-white selection:bg-green selection:bg-opacity-20">
                <img src={ImgMapDark} className="w-full h-3/12 dark:hidden" alt="map" />
                <img src={ImgMap} className="w-full h-3/12 hidden dark:block" alt="map in dark" />
                <div className="flex justify-center absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                  <h2 className="text-white">
                    <span className="font-bold text-center xl:text-6xl text-2xl ">Certificación internacional</span>
                  </h2>
                </div>
                <div className="pt-20 md:pt-0 flex space-x-2 md:space-x-14 lg:space-x-24 absolute top-2/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-max">
                  <StaticImage src="../images/countries/mex.png" alt="Mexican flag" className="h-10 w-10 md:w-16 md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-0s" />
                  <StaticImage src="../images/countries/eua.png" alt="United States flag" className="h-10 w-10 md:w-16 md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-3s" />
                  <StaticImage src="../images/countries/col.png" alt="Colombian flag" className="h-10 w-10 md:w-16 md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-6s" />
                  <StaticImage src="../images/countries/arg.png" alt="Argentinian flag" className="h-10 w-10 md:w-[4.25rem] md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-9s" />
                  <StaticImage src="../images/countries/can.png" alt="Canadian flag" className="h-10 w-10 md:w-[4.95rem] md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-12s" />
                  <StaticImage src="../images/countries/ale.png" alt="German flag" className="h-10 w-10 md:w-16 md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-15s" />
                  <StaticImage src="../images/countries/eng.png" alt="English flag" className="h-10 w-10 md:w-16 md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-18s" />
                </div>
                <div className="absolute mb-20 md:mt-0 mt-20 top-3/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                  <p className="font-bold text-center lg:text-2xl text-xs md:text-sm lg:p-0 p-2 text-white uppercase font-light">
                    Las certificaciones Montessori cuentan con un gran reconocimiento en todo el mundo
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
        <Timeline />
      </section>
    </main>
  </Layout>
)
export const Head = () => <Seo title="Home" description="Conoce la Asociación Montessori De México A.C." />
export default IndexPage
