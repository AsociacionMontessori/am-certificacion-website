import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import MiloComponent from "../components/milo/milo"
import Nav from "../components/nav"

const NotFoundPage = () => (
  <Layout>
    <Nav textColor="dark:text-white text-gray" />
    <div className="h-[70vh]">
      <MiloComponent />
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>

    </div>
  </Layout>
)

export const Head = () => <Seo title="404: Not Found" />

export default NotFoundPage
