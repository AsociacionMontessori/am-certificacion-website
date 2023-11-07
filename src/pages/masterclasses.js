import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import src from "../images/gifs/output-onlinegiftools.gif"

const masterclasses = () => {
  return (
    <div>
      <Layout>
        <div className="bg-gradient-to-r from-blue via-purple to-green -z-20">
          <Nav textColor="text-white" />
          <section className="relative pl-10 h-10 sm:h-auto md:pl-28 lg:pl-40 xl:pl-60 pt-10 md:pt-20 selection:text-white selection:bg-green selection:bg-opacity-20">
            <div className="w-full m-1">
              <h1 style={{ fontFamily: "Alice", letterSpacing: ".4rem" }} className="text-[1.5rem] sm:text-[2rem] md:text-[3rem] lg:text-[5rem] xl:text-[10rem] text-white body-font">
                MONTESSORI
              </h1>
              <h2 style={{ fontFamily: "Italianno" }} className="text-[2rem] md:text-[3rem] lg:text-[5rem] text-white absolute top-[2vh] left-[10vw]">
                MasterClasses
              </h2>
              <p className="text-white text-sm md:text-md lg:text-xl pr-10 tr-0 md:text-xl z-20">
                Conoce nuestro amplio catálogo de experiencias y conocimientos que te ayudarán a mejorar tu práctica docente.
              </p>

            </div>
            <img className="absolute -bottom-40 xl:-bottom-24 right-0 z-10 hidden w-52 md:block xl:w-96" src={src} alt="" />
          </section>
          <section className="bg-white dark:bg-gray">
            {/* <Timeline /> */}
            <div className="w-full h-[280vh] md:h-[100vh]">
              <iframe className="sm:overflow-hidden" style={{ marginTop: "200px" }} title="Eventos" src="https://certificacionmontessori.com/wp/montessori-masterclass" name="myiFrame" scrolling="no" frameborder="1" marginheight="0px" marginwidth="0px" height="100%" width="100%" allowfullscreen></iframe>
            </div>

          </section>
        </div>
      </Layout>
    </div>
  )
}

export const Head = () => <Seo title="MasterClasses" description="Clases Magistrales de referentes en el Método Montessori" />

export default masterclasses
