import * as React from "react"
import { useState } from "react"
import {
  DOMINIO_INSTITUCIONAL,
  MODALIDAD_INSCRIPCION,
} from "../../data/inscripcionForm"
import { submitInscripcionParte1 } from "../../utils/inscripcionApi"

const emptyForm = {
  nombreCompleto: "",
  fechaNacimiento: "",
  nacionalidad: "",
  nivelEspecializacion: "",
  telefonoMovil: "",
  emailContacto: "",
  usuarioInstitucional: "",
}

const InscripcionParte1Form = ({
  ordenId,
  initialValues = {},
  nivelEspecializacionFijo = "",
  programaPagadoLabel = "",
  onSuccess,
}) => {
  const nivelFijo = nivelEspecializacionFijo || initialValues.nivelEspecializacion || ""
  const [form, setForm] = useState({
    ...emptyForm,
    ...initialValues,
    nivelEspecializacion: nivelFijo,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const inputClass =
    "w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!nivelFijo) {
      setError("No se encontró el programa de tu pago. Contacta a soporte.")
      return
    }
    setLoading(true)
    try {
      const result = await submitInscripcionParte1(ordenId, {
        nombreCompleto: form.nombreCompleto.trim(),
        fechaNacimiento: form.fechaNacimiento,
        nacionalidad: form.nacionalidad.trim(),
        modalidad: MODALIDAD_INSCRIPCION,
        nivelEspecializacion: nivelFijo,
        telefonoMovil: form.telefonoMovil.trim(),
        emailContacto: form.emailContacto.trim(),
        usuarioInstitucional: form.usuarioInstitucional.trim().toLowerCase(),
      })
      onSuccess?.(result)
    } catch (err) {
      setError(err.message || "No se pudo crear tu cuenta")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray leading-relaxed">
        Con estos datos crearemos tu cuenta en el portal de alumnos. El pago ya está
        vinculado; no subas comprobante de inscripción si pagaste en línea.
      </p>

      <div className="rounded-xl border border-blue/20 bg-blue/5 px-4 py-3">
        <p className="text-xs text-gray">Modalidad</p>
        <p className="text-sm font-semibold text-blue">{MODALIDAD_INSCRIPCION}</p>
      </div>

      <div className="rounded-xl border-2 border-green/30 bg-green/5 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-green mb-1">
          Programa pagado (no modificable)
        </p>
        <p className="text-sm font-semibold text-black leading-snug">
          {nivelFijo}
        </p>
        {programaPagadoLabel && (
          <p className="text-xs text-gray mt-2">
            Checkout: {programaPagadoLabel}. Cada programa tiene un costo distinto; por eso no
            se puede cambiar después del pago.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-yellow/30 bg-yellow/10 px-4 py-3 space-y-2">
        <p className="text-sm text-gray leading-relaxed">
          <strong className="text-black">Acceso:</strong> generamos una contraseña única para ti
          (la misma en el portal de alumnos y en Google Classroom). La enviamos a tu correo de
          contacto y queda en tu expediente del portal.
        </p>
        <p className="text-sm text-gray leading-relaxed">
          <strong className="text-black">Google:</strong> creamos tu usuario{" "}
          <strong>@certificacionmontessori.com</strong>, te asignamos la unidad organizativa de
          tu programa y te inscribimos en tus clases de Classroom.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-nombre">
          Nombre completo (nombre(s) y apellidos) *
        </label>
        <input
          id="p1-nombre"
          name="nombreCompleto"
          required
          minLength={2}
          value={form.nombreCompleto}
          onChange={handleChange}
          className={inputClass}
          autoComplete="name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-nacimiento">
          Fecha de nacimiento *
        </label>
        <input
          id="p1-nacimiento"
          name="fechaNacimiento"
          type="date"
          required
          value={form.fechaNacimiento}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-nacionalidad">
          Nacionalidad *
        </label>
        <input
          id="p1-nacionalidad"
          name="nacionalidad"
          required
          value={form.nacionalidad}
          onChange={handleChange}
          className={inputClass}
          placeholder="Ej. Mexicana"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-tel">
          Teléfono móvil de contacto *
        </label>
        <input
          id="p1-tel"
          name="telefonoMovil"
          type="tel"
          required
          minLength={8}
          value={form.telefonoMovil}
          onChange={handleChange}
          className={inputClass}
          autoComplete="tel"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-email">
          Correo electrónico de contacto *
        </label>
        <input
          id="p1-email"
          name="emailContacto"
          type="email"
          required
          value={form.emailContacto}
          onChange={handleChange}
          className={inputClass}
          autoComplete="email"
        />
        <p className="text-xs text-gray mt-1.5">
          Recibirás aquí la confirmación de tu cuenta y acceso al portal.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-usuario">
          Usuario institucional *
        </label>
        <div className="flex rounded-xl border border-gray/25 overflow-hidden min-h-[48px] bg-white">
          <input
            id="p1-usuario"
            name="usuarioInstitucional"
            required
            minLength={3}
            pattern="[a-z0-9._-]+"
            value={form.usuarioInstitucional}
            onChange={handleChange}
            className="flex-1 px-4 py-2.5 text-black text-base border-0 outline-none lowercase"
            placeholder="tu.nombre"
            autoComplete="username"
          />
          <span className="inline-flex items-center px-3 text-sm text-gray bg-gray/5 shrink-0">
            @{DOMINIO_INSTITUCIONAL}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red rounded-lg bg-red/5 px-3 py-2" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green disabled:opacity-60"
      >
        {loading ? (
          <>
            <span
              className="inline-block h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin"
              aria-hidden="true"
            />
            Creando tu cuenta…
          </>
        ) : (
          "Crear mi cuenta y continuar"
        )}
      </button>
      {loading && (
        <p className="text-xs text-gray text-center">
          Estamos configurando tu acceso al portal y Google Classroom.
        </p>
      )}
    </form>
  )
}

export default InscripcionParte1Form
