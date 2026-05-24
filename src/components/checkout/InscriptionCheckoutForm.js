import * as React from "react"
import { useState } from "react"
import { createPublicCheckoutSession } from "../../utils/stripeCheckout"

const PROGRAMAS = [
  "Nido y Comunidad Infantil",
  "Casa de Niños",
  "Taller",
  "Neuroeducación",
  "Grandes Lecciones",
  "Otro / Aún no definido",
]

const InscriptionCheckoutForm = ({ coin, price, onCancel }) => {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [programa, setPrograma] = useState(PROGRAMAS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { url } = await createPublicCheckoutSession({
        sku: "inscripcion_diplomado",
        quantity: 1,
        programa,
        cliente: { nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim() },
      })
      if (typeof window !== "undefined") {
        window.location.href = url
      }
    } catch (err) {
      setError(err.message || "Error al iniciar el pago")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
      <p className="text-sm text-gray leading-relaxed">
        Pago seguro con tarjeta (Stripe). Monto de inscripción:{" "}
        <strong className="text-blue">
          {coin} {price}
        </strong>
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="insc-nombre">
            Nombre completo
          </label>
          <input
            id="insc-nombre"
            type="text"
            required
            minLength={2}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="insc-email">
            Correo electrónico
          </label>
          <input
            id="insc-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="insc-tel">
            Teléfono (opcional)
          </label>
          <input
            id="insc-tel"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor="insc-programa">
            Programa de interés
          </label>
          <select
            id="insc-programa"
            value={programa}
            onChange={(e) => setPrograma(e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"
          >
            {PROGRAMAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
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
          className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green disabled:opacity-60"
        >
          {loading ? "Redirigiendo…" : "Continuar al pago seguro"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] w-full px-6 py-3 rounded-full font-medium text-blue border border-blue/30 bg-white"
          >
            Cancelar
          </button>
        )}
      </div>

      <p className="text-xs text-gray text-center leading-relaxed pb-1">
        También puedes{" "}
        <a
          href="https://forms.gle/8mNepRAmhS82awAr7"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue underline"
        >
          inscribirte con el formulario Google
        </a>{" "}
        (respaldo).
      </p>
    </form>
  )
}

export default InscriptionCheckoutForm
