import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"


const IndexPage = () => (
  <Layout>
    <div>
      <p>Hello world</p>
     </div>
  </Layout>
)
export const Head = () => <Seo title="Home" />

export default IndexPage
