import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Timeline from "../components/timeline/timeline"
import Nav from "../components/nav"


const nosotros = () => {
  return (
    <div className="bg-white dark:bg-gray">
      <Layout>
      <Nav textColor="dark:text-white text-black" />
        <main className="bg-gradient-to-r from-blue via-purple to-green">
          <div className="bg-white dark:bg-gray">
            <Timeline />
          </div>
        </main>
      </Layout>
    </div>
  )
}

export const Head = () => <Seo title="Sobre Nosotros" />

export default nosotros
