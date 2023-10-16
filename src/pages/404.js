import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import MiloComponent from "../components/milo/milo"
import Nav from "../components/nav"

const NotFoundPage = () => (
  <>
    <Layout>
      <div className="bg-gradient-to-r from-blue via-purple to-green -z-20">
        <Nav textColor="text-white" />
        <section className="relative py-40 pl-10 h-10 sm:h-auto md:pl-28 lg:pl-40 pt-10 md:pt-20 selection:text-white selection:bg-green selection:bg-opacity-20">
          <div className="w-full m-1">
            <h1 style={{ fontFamily: "Alice", letterSpacing: ".1rem" }} className="text-[1.5rem] lg:text-[2rem] xl:text-[6rem] text-white body-font">
              RECURSO NO ENCONTRADO
            </h1>
            <h2 style={{ fontFamily: "Italianno" }} className="text-[2rem] md:text-[3rem] lg:text-[5rem] text-white absolute top-[2vh] left-[10vw]">
              Error 404
            </h2>
            <h3 className="text-white text-sm md:text-md lg:text-3xl pr-10 tr-0 md:text-xl z-20">
              Lamentamos los incovenientes. 
            </h3>
          </div>
        </section>
      </div>
    </Layout>
  </>
)

export const Head = () => <Seo title="404: Not Found" />

export default NotFoundPage
