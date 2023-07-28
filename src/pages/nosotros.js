import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import imagen from '../images/banners/cert.png'
import Timeline from "../components/timeline/timeline"

const nosotros = () => {
  return (
    <Layout>
      <main>
        <Timeline />    
      </main>
    </Layout>
  )
}

export const Head = () => <Seo title="Sobre Nosotros" />

export default nosotros
