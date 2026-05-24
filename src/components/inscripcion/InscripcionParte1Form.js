import * as React from "react"
import { useState } from "react"
import {
  DOMINIO_INSTITUCIONAL,
  MODALIDAD_INSCRIPCION,
  NIVELES_ESPECIALIZACION,
  getNivelByLabel,
} from "../../data/inscripcionForm"
import { submitInscripcionParte1 } from "../../utils/inscripcionApi"

const TIPO_PROGRAMA_ETIQUETA = {
  guia: "Guía",
  diplomado: "Diplomado",
  curso: "Curso",
  otro: "Otro",
}

const emptyForm = {
  nombreCompleto: "",
  fechaNacimiento: "",
  nacionalidad: "",
  nivelEspecializacion: "",
  telefonoMovil: "",
  emailContacto: "",
  usuarioInstitucional: "",
  password: "",
  confirmPassword: "",
}

const InscripcionParte1Form = ({ ordenId, initialValues = {}, onSuccess }) => {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const inputClass =
    "w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleNivelChange = (label) => {
    setForm((prev) => ({ ...prev, nivelEspecializacion: label }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!form.nivelEspecializacion) {
      setError("Selecciona tu nivel de especialización")
      return
    }
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }
    setLoading(true)
    try {
      const result = await submitInscripcionParte1(ordenId, {
        nombreCompleto: form.nombreCompleto.trim(),
        fechaNacimiento: form.fechaNacimiento,
        nacionalidad: form.nacionalidad.trim(),
        modalidad: MODALIDAD_INSCRIPCION,
        nivelEspecializacion: form.nivelEspecializacion,
        telefonoMovil: form.telefonoMovil.trim(),
        emailContacto: form.emailContacto.trim(),
        usuarioInstitucional: form.usuarioInstitucional.trim().toLowerCase(),
        password: form.password,
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

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-nombre">
          Nombre completo (nombre(s) y apellidos) *
        </label>
        <input id="p1-nombre" name="nombreCompleto" required minLength={2} value={form.nombreCompleto} onChange={handleChange} className={inputClass} autoComplete="name" />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-nacimiento">
          Fecha de nacimiento *
        </label>
        <input id="p1-nacimiento" name="fechaNacimiento" type="date" required value={form.fechaNacimiento} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-nacionalidad">
          Nacionalidad *
        </label>
        <input id="p1-nacionalidad" name="nacionalidad" required value={form.nacionalidad} onChange={handleChange} className={inputClass} placeholder="Ej. Mexicana" />
      </div>

      <fieldset className="space-y-3">
        <legend className="block text-sm font-medium text-black mb-2">
          Nivel de especialización *
        </legend>
        {NIVELES_ESPECIALIZACION.map((nivel) => {
          const selected = form.nivelEspecializacion === nivel.label
          const tipoEtiqueta = TIPO_PROGRAMA_ETIQUETA[nivel.tipoPrograma] || "Programa"
          return (
            <label
              key={nivel.id}
              className={`block rounded-2xl border px-4 py-4 cursor-pointer transition-colors min-h-[48px] ${
                selected
                  ? "border-blue bg-blue/5 ring-2 ring-blue/30"
                  : "border-gray/25 bg-white hover:border-blue/40"
              }`}
            >
              <input
                type="radio"
                name="nivelEspecializacion"
                value={nivel.label}
                checked={selected}
                onChange={() => handleNivelChange(nivel.label)}
                className="sr-only"
              />
              <span className="inline-block text-xs font-semibold uppercase tracking-wide text-blue mb-1">
                {tipoEtiqueta}
              </span>
              <span className="block text-sm text-black leading-snug">{nivel.label}</span>
              {selected && getNivelByLabel(nivel.label) && (
                <span className="block text-xs text-green font-medium mt-2">Seleccionado</span>
              )}
            </label>
          )
        })}
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-tel">
          Teléfono móvil de contacto *
        </label>
        <input id="p1-tel" name="telefonoMovil" type="tel" required minLength={8} value={form.telefonoMovil} onChange={handleChange} className={inputClass} autoComplete="tel" />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-email">
          Correo electrónico de contacto *
        </label>
        <input id="p1-email" name="emailContacto" type="email" required value={form.emailContacto} onChange={handleChange} className={inputClass} autoComplete="email" />
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

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-pass">
          Contraseña para el portal *
        </label>
        <input id="p1-pass" name="password" type="password" required minLength={8} value={form.password} onChange={handleChange} className={inputClass} autoComplete="new-password" />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-pass2">
          Confirmar contraseña *
        </label>
        <input id="p1-pass2" name="confirmPassword" type="password" required minLength={8} value={form.confirmPassword} onChange={handleChange} className={inputClass} autoComplete="new-password" />
      </div>

      {error && (
        <p className="text-sm text-red rounded-lg bg-red/5 px-3 py-2" role="alert">{error}</p>
      )}

      <button type="submit" disabled={loading} className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green disabled:opacity-60">
        {loading ? "Creando cuenta…" : "Crear mi cuenta y continuar"}
      </button>
    </form>
  )
}

export default InscripcionParte1Form
