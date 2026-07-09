import * as React from "react"
import { Link } from "gatsby"
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
      <CheckoutPageShell title="Libro no encontrado" backTo="/publicaciones">
        <p className="text-sm text-gray mb-4">
          No encontramos ese título. Elige un libro en la página de publicaciones.
        </p>
        <Link
          to="/publicaciones"
          className="min-h-[48px] inline-flex items-center text-blue font-medium underline"
        >
          Ver libros
        </Link>
      </CheckoutPageShell>
    )
  }

  return (
    <CheckoutPageShell
      title={
        isBundle
          ? "Comprar paquete digital"
          : `Comprar ebook · Libro ${book.volume}`
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

export const Head = () => (
  <Seo
    title="Compra de libro"
    description="Compra segura de publicaciones Montessori."
    pathname="/checkout/libro"
    robots="noindex,follow"
  />
)

export default LibroCheckoutPage
