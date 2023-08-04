import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import imagen from '../images/banners/cert.png'
import Timeline from "../components/timeline/timeline"

const nosotros = () => {
  return (
    <div className="bg-white dark:bg-gray">
      <Layout>
        <main className="">
          <Timeline />
        </main>
      </Layout>
    </div>
  )
}

export const Head = () => <Seo title="Sobre Nosotros" />

export default nosotros
