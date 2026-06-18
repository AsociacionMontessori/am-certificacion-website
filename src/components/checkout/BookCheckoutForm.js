import * as React from "react"
import { useState } from "react"
import { Link } from "gatsby"
import { createPublicCheckoutSession } from "../../utils/stripeCheckout"

const BookCheckoutForm = ({ book, purchase = "physical", cancelHref, onCancel }) => {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isDigital = purchase === "digital"
  const selectedSku = isDigital ? book.digital?.stripeSku : book.stripeSku
  const selectedPrice = isDigital ? book.digital?.priceMx : book.priceMx
  const digitalFormats = book.digital?.formats?.join(" + ")
  const label = book.volume ? `Libro ${book.volume}` : "Paquete digital"

  const handleBuy = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { url } = await createPublicCheckoutSession({
        sku: selectedSku,
        quantity: 1,
        cliente: {
          nombre: nombre.trim(),
          email: email.trim(),
        },
        ...(isDigital && codigo.trim() ? { codigo: codigo.trim() } : {}),
      })
      if (typeof window !== "undefined") {
        window.location.href = url
      }
    } catch (err) {
      setError(err.message || "No se pudo iniciar el pago")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleBuy} className="w-full text-left space-y-4">
      <p className="text-sm text-gray leading-relaxed">
        <span className="font-semibold text-blue">
          {label} · {isDigital ? "Ebook" : "Impreso"}
        </span>
        <br />
        {book.title}
      </p>
      {selectedPrice && (
        <p className="text-base font-semibold text-blue">
          ${selectedPrice} MXN
          <span className="block text-xs font-normal text-gray mt-1">
            {isDigital
              ? `Incluye ${digitalFormats}; descarga disponible después del pago.`
              : "Más gastos de envío (se solicitarán en el pago)"}
          </span>
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor={`book-nombre-${book.id}`}>
            Tu nombre
          </label>
          <input
            id={`book-nombre-${book.id}`}
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor={`book-email-${book.id}`}>
            Tu correo
          </label>
          <input
            id={`book-email-${book.id}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
            autoComplete="email"
          />
        </div>
        {isDigital && (
          <div>
            <label className="block text-sm font-medium text-black mb-1.5" htmlFor={`book-codigo-${book.id}`}>
              ¿Tienes un código de regalo? <span className="font-normal text-gray">(opcional)</span>
            </label>
            <input
              id={`book-codigo-${book.id}`}
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Escríbelo aquí"
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white uppercase placeholder:normal-case placeholder:text-gray/60"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <span className="block text-xs text-gray mt-1">
              Aplica el descuento antes de pagar; lo verás reflejado en el pago seguro.
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red rounded-lg bg-red/5 px-3 py-2" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="min-h-[48px] w-full rounded-full bg-green px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Redirigiendo..." : "Continuar al pago seguro"}
        </button>
        {cancelHref ? (
          <Link
            to={cancelHref}
            className="min-h-[48px] w-full inline-flex items-center justify-center rounded-full border border-blue/30 text-blue text-sm font-medium text-center"
          >
            Cancelar
          </Link>
        ) : onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] w-full rounded-full border border-blue/30 text-blue text-sm font-medium"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  )
}

export default BookCheckoutForm
