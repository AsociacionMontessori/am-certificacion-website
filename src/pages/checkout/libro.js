import * as React from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { getT, useLocalization } from "../../i18n"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import BookCheckoutForm from "../../components/checkout/BookCheckoutForm"
import { roxanaBooks } from "../../data/roxanaBooks"
import { roxanaBookBundles } from "../../data/roxanaBookOffers"

function bundleToBook(bundle) {
  return {
    id: bundle.id,
    title: bundle.title,
    description: bundle.description,
    digital: {
      enabled: true,
      stripeSku: bundle.stripeSku,
      priceMx: bundle.priceMx,
      formats: bundle.formats,
    },
  }
}

const LibroCheckoutPage = () => {
  const { t } = useTranslation("checkout")
  const { localizedPath } = useLocalization()
  const [sku, setSku] = React.useState("")

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSku(params.get("sku") || "")
  }, [])

  const bundle = roxanaBookBundles.find((b) => b.stripeSku === sku)
  const isBundle = Boolean(bundle)
  // Venta digital desactivada por exclusividad KDP Select: solo resuelve si el
  // libro tiene `digital.enabled`. Hoy ninguno lo tiene, así que cualquier SKU
  // digital cae en "no encontrado". La edición impresa se compra en Amazon.
  const book = isBundle
    ? bundleToBook(bundle)
    : roxanaBooks.find((b) => b.digital?.enabled && b.digital?.stripeSku === sku && b.digital?.priceMx)

  if (!book) {
    return (
      <CheckoutPageShell title={t("bookPage.notFoundTitle")} backTo="/publicaciones">
        <p className="text-sm text-gray mb-4">
          {t("bookPage.notFoundText")}
        </p>
        <Link
          to={localizedPath("/publicaciones")}
          className="min-h-[48px] inline-flex items-center text-blue font-medium underline"
        >
          {t("bookPage.seeBooks")}
        </Link>
      </CheckoutPageShell>
    )
  }

  return (
    <CheckoutPageShell
      title={
        isBundle
          ? t("bookPage.bundleTitle")
          : t("bookPage.ebookTitle", { volume: book.volume })
      }
      description={book.title}
      backTo="/publicaciones"
    >
      <BookCheckoutForm
        book={book}
        purchase="digital"
        cancelHref="/publicaciones"
      />
    </CheckoutPageShell>
  )
}

export const Head = ({ location }) => {
  const t = getT(location.pathname, "checkout")
  return (
    <Seo
      title={t("bookPage.seoTitle")}
      description={t("bookPage.seoDescription")}
      pathname={location.pathname}
      robots="noindex,follow"
    />
  )
}

export default LibroCheckoutPage
