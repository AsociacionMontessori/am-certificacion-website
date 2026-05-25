import * as React from "react"
import { Link } from "gatsby"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"
import BookCheckoutForm from "../../components/checkout/BookCheckoutForm"
import { roxanaBooks } from "../../data/roxanaBooks"

const LibroCheckoutPage = () => {
  const [sku, setSku] = React.useState("")

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSku(params.get("sku") || "")
  }, [])

  const book = roxanaBooks.find((b) => b.stripeSku === sku)

  if (!book) {
    return (
      <CheckoutPageShell title="Libro no encontrado" backTo="/roxana">
        <p className="text-sm text-gray mb-4">No encontramos ese título. Elige un libro en la página de Roxana.</p>
        <Link to="/roxana" className="min-h-[48px] inline-flex items-center text-blue font-medium underline">
          Ver libros
        </Link>
      </CheckoutPageShell>
    )
  }

  return (
    <CheckoutPageShell
      title={`Comprar · Libro ${book.volume}`}
      description={book.title}
      backTo="/roxana"
    >
      <BookCheckoutForm book={book} cancelHref="/roxana" />
    </CheckoutPageShell>
  )
}

export const Head = () => (
  <Seo
    title="Compra de libro"
    description="Compra segura de publicaciones Montessori."
    pathname="/checkout/libro"
  />
)

export default LibroCheckoutPage
