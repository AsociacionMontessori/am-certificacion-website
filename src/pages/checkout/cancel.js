import * as React from "react"
import Layout from "../../components/layout"
import Seo from "../../components/seo"
import Nav from "../../components/nav"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { getT, useLocalization } from "../../i18n"

const CheckoutCancelPage = () => {
  const { t } = useTranslation("checkout")
  const { localizedPath } = useLocalization()

  return (
    <Layout>
      <div
        className="bg-cover bg-center bg-fixed"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,151,178,0.92), rgba(0,151,178,0.80), rgba(126,217,87,0.92)), url('/backgrounds/home.webp')",
        }}
      >
      <Nav textColor="text-white" />
      <section className="min-h-[60vh] flex items-center justify-center px-6 py-24">
        <article className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-blue mb-3">{t("cancel.title")}</h1>
          <p className="text-gray text-base leading-relaxed mb-6">
            {t("cancel.message")}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to={localizedPath("/diplomados/")}
              className="inline-flex min-h-[44px] items-center justify-center px-8 py-3 rounded-full font-semibold text-white bg-blue"
            >
              {t("cancel.programs")}
            </Link>
            <Link
              to={localizedPath("/publicaciones/")}
              className="inline-flex min-h-[44px] items-center justify-center px-8 py-3 rounded-full font-medium text-blue border border-blue/30"
            >
              {t("cancel.publications")}
            </Link>
          </div>
        </article>
      </section>
      </div>
    </Layout>
  )
}

export const Head = ({ location }) => {
  const t = getT(location.pathname, "checkout")
  return (
    <Seo
      title={t("cancel.seoTitle")}
      description={t("cancel.seoDescription")}
      pathname={location.pathname}
      robots="noindex,follow"
    />
  )
}

export default CheckoutCancelPage
