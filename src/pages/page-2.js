import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"

const SecondPage = () => (
  <Layout>
    <div>
      <p>Hello world 2</p>
    </div>
  </Layout>
)

export const Head = () => <Seo title="Page two" />

export default SecondPage
