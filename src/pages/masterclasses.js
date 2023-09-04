import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import src from "../images/gifs/output-onlinegiftools.gif"

const masterclasses = () => {
  return (
    <div>
      <Layout>
        <main className="bg-gradient-to-r from-blue via-purple to-green">
          <Nav textColor="text-white" />

          <section className="relative pl-10 md:pl-60 pt-10 md:pt-20">
            <h1 style={{ fontFamily: "Alice", letterSpacing: ".4rem" }} className="text-[2rem] md:text-[10rem] text-white body-font">
              MONTESSORI
            </h1>
            <h2 style={{ fontFamily: "Italianno", top: "2vh", left: "10vw" }} className="text-[2rem] md:text-[6rem] text-white absolute">
              MasterClasses
            </h2>
            <p className="text-white text-sm pr-10 tr-0 md:text-xl">
              Conoce nuestro amplio catálogo de experiencias y conocimientos que te ayudarán a mejorar tu práctica docente.
            </p>
            <img className="absolute -bottom-24 right-0 " src={src} alt="" />
          </section>
          <section className="bg-white dark:bg-gray">
            {/* <Timeline /> */}
            <div className="w-full h-[80vh]">
              <iframe className="sm:overflow-hidden" style={{ marginTop: "200px" }} src="https://staging2.certificacionmontessori.com/montessori-masterclass" name="myiFrame" scrolling="no" frameborder="1" marginheight="0px" marginwidth="0px" height="100%" width="100%" allowfullscreen></iframe>
            </div>

          </section>
        </main>
      </Layout>
    </div>
  )
}

export const Head = () => <Seo title="MasterClasses" />

export default masterclasses
