import * as React from "react"
import '../styles/global.css'
import Layout from "../components/layout"
import Seo from "../components/seo"
import imagen from '../images/banners/home.png'
import Footer from "../components/footer"
const IndexPage = () => (
  <Layout>
    <main>
      <section id="home" class="relative flex min-h-screen items-center">
        <div aria-hidden="true" class="absolute inset-0 z-[1] bg-gradient-to-b from-white/0 via-gray/20 to-gray"></div>
        <img src={imagen} class="fixed inset-0 h-full w-full object-cover" alt="woman in dark" width="4160" height="6240" />
        <div class="relative z-10 mx-auto max-w-7xl px-6 pb-40 pt-40 lg:px-12 xl:px-6 2xl:px-0">
          <div class="pb-12 media-h:md:pb-32 media-h:lg:pb-12 xl:pb-12">
            <h1 data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" class="rellax text-6xl font-bold text-white sm:text-7xl md:text-8xl xl:leading-tight" >Asociación Montessori</h1>
          </div>
          <div>
            <div class="mr-auto md:w-3/5 md:pt-2 lg:w-2/3">
              <p class="mb-5 text-lg font-light text-white sm:text-2xl xl:leading-normal">
                Únete a nosotros en este emocionante viaje de aprendizaje y exploración. Descubre la filosofía y práctica de este gran método, con nuestras clases gratuitas, contenido y certificaciones con validez internacional.
              </p>
              <div className="mb-5">
                <button className="btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-blue text-white bg-opacity-10">Certifícate</button>
                <button className="btn btn-outline hover:text-white hover:bg-green bg-gradient-to-r from-green/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10">Conoce el Método</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="work" class="relative z-10 bg-gray pb-20 pb-72 lg:pt-0">
        <div class="mx-auto max-w-7xl px-6 lg:px-12 xl:px-6 2xl:px-0 pt-10">
          <div data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" class="rellax flex flex-wrap items-center gap-6">
            <h2 class="text-5xl font-bold text-white xl:text-6xl">EDUCACIÓN SIGNIFICATIVA</h2>
            <p className="text-2xl">
              En la educación significativa, se busca que los <strong className="text-red">estudiantes se involucren de manera activa en su propio proceso de aprendizaje</strong>, relacionando los nuevos conceptos con su conocimiento previo y con su entorno. El objetivo es que los estudiantes no solo adquieran información de manera pasiva, sino que la comprendan, le encuentren sentido y la integren en su propia estructura cognitiva.
            </p>
          </div>
        </div>
        <div className="overflow-hidden mt-5">
          <section className="my-5 block h-12 overflow-hidden relative w-max marquee-left xxl:hidden">
            <div className="flex float-left w-50">
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-blue rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
            </div>
          </section>
          <section className="my-5 block h-12 overflow-hidden relative w-max marquee-left xxl:hidden">
            <div className="flex float-left w-50">
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">No se puede ser libre, si no se es independiente</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">Lo que la mano hace, la mente lo recuerda</label>
              <label class="bg-black hover:text-green/70 rounded-full py-3 px-10 text-white/80 mx-3">El niño crea sus propios movimientos y, una vez creados, los perfecciona</label>
            </div>
          </section>

        </div>
      </section>
    </main>


  </Layout>
)
export const Head = () => <Seo title="Home" />

export default IndexPage
