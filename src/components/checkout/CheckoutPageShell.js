import * as React from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"
import Layout from "../layout"
import Nav from "../nav"
import InscripcionAyudaWhatsApp from "../inscripcion/InscripcionAyudaWhatsApp"

const CheckoutPageShell = ({ title, description, backTo = "/", children }) => {
  const { t } = useTranslation("checkout")
  const { localizedPath } = useLocalization()
  const backHref = /^https?:\/\//.test(backTo) ? backTo : localizedPath(backTo)

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
      <section className="min-h-screen px-4 py-20 sm:py-24 pb-12">
        <div className="max-w-lg mx-auto">
          <Link
            to={backHref}
            className="inline-flex min-h-[44px] items-center text-sm font-medium text-white/90 hover:text-white mb-6"
          >
            ← {t("common.back")}
          </Link>
          <article className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <header className="px-5 sm:px-6 py-5 border-b border-gray/10">
              <h1 className="text-xl sm:text-2xl font-bold text-blue leading-snug">{title}</h1>
              {description && (
                <p className="mt-2 text-sm text-gray leading-relaxed">{description}</p>
              )}
            </header>
            <div className="px-5 sm:px-6 py-6 space-y-6">
              <InscripcionAyudaWhatsApp />
              {children}
            </div>
          </article>
        </div>
      </section>
      </div>
    </Layout>
  )
}

export default CheckoutPageShell
