import * as React from "react"
import { Link } from "gatsby"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import Seo from "../../components/seo"

// NOTA: La compra de libros vía Stripe está temporalmente deshabilitada
// mientras se completa la activación de Stripe Live. Para reactivarla,
// restaurar `BookCheckoutForm` y la lógica de SKU desde git history.

const LibroCheckoutPage = () => {
  return (
    <CheckoutPageShell title="Compra de libros en mantenimiento" backTo="/roxana">
      <div className="rounded-2xl border-2 border-yellow/40 bg-yellow/10 px-5 py-5 mb-6">
        <p className="text-sm font-semibold text-black mb-2">
          Compras en línea temporalmente pausadas
        </p>
        <p className="text-sm text-gray leading-relaxed">
          Estamos finalizando la verificación con nuestro procesador de pagos.
          Mientras tanto, escríbenos para ayudarte con tu pedido.
        </p>
      </div>

      <div className="space-y-3">
        <a
          href="mailto:admin@certificacionmontessori.com?subject=Compra%20de%20libro%20Roxana"
          className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-blue"
        >
          Escribir a admin@certificacionmontessori.com
        </a>
        <a
          href="https://api.whatsapp.com/send?phone=5215548885013&text=Hola,%20me%20interesa%20comprar%20un%20libro"
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-blue border-2 border-blue bg-white"
        >
          WhatsApp 55 4888 5013
        </a>
        <Link
          to="/roxana"
          className="min-h-[48px] w-full inline-flex items-center justify-center text-sm text-gray underline"
        >
          Volver al catálogo de libros
        </Link>
      </div>
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
