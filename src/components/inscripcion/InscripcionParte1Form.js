import * as React from "react"
import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import {
  DOMINIO_INSTITUCIONAL,
  MODALIDAD_INSCRIPCION,
  NIVELES_ESPECIALIZACION,
  getAnalyticsProgramIdByNivelLabel,
} from "../../data/inscripcionForm"
import { useLocalization } from "../../i18n"
import { submitInscripcionParte1 } from "../../utils/inscripcionApi"

const { trackEvent } = require("../../utils/analytics")

const emptyForm = {
  nombreCompleto: "",
  fechaNacimiento: "",
  nacionalidad: "",
  nivelEspecializacion: "",
  telefonoMovil: "",
  emailContacto: "",
  usuarioInstitucional: "",
}

const getNivelDisplayLabel = (t, label) => {
  const nivel = NIVELES_ESPECIALIZACION.find((item) => item.label === label)
  return nivel ? t(`programs.levels.${nivel.id}`, { defaultValue: label }) : label
}

const InscripcionParte1Form = ({
  ordenId,
  accessToken,
  initialValues = {},
  nivelEspecializacionFijo = "",
  programaPagadoLabel = "",
  onSuccess,
}) => {
  const { t } = useTranslation("checkout")
  const { language } = useLocalization()
  const nivelFijo = nivelEspecializacionFijo || ""
  const [form, setForm] = useState({
    ...emptyForm,
    ...initialValues,
    nivelEspecializacion: nivelFijo || initialValues.nivelEspecializacion || "",
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
    const nivelElegido = nivelFijo || form.nivelEspecializacion
    if (!nivelElegido) {
      setError(t("part1.missingTraining"))
      return
    }
    setLoading(true)
    try {
      const result = await submitInscripcionParte1(ordenId, {
        nombreCompleto: form.nombreCompleto.trim(),
        fechaNacimiento: form.fechaNacimiento,
        nacionalidad: form.nacionalidad.trim(),
        modalidad: MODALIDAD_INSCRIPCION,
        nivelEspecializacion: nivelElegido,
        telefonoMovil: form.telefonoMovil.trim(),
        emailContacto: form.emailContacto.trim(),
        usuarioInstitucional: form.usuarioInstitucional.trim().toLowerCase(),
      }, accessToken)
      trackEvent("generate_lead", {
        language,
        program_id: getAnalyticsProgramIdByNivelLabel(nivelElegido),
        landing_path: typeof window === "undefined" ? "" : window.location.pathname,
        cta_position: "inscripcion_part_1",
        lead_channel: "form",
      })
      onSuccess?.(result)
    } catch (err) {
      setError(err.message || t("part1.submitError"))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray leading-relaxed">
        {t("part1.intro")}
      </p>

      <div className="rounded-xl border border-blue/20 bg-blue/5 px-4 py-3">
        <p className="text-xs text-gray">{t("part1.modality")}</p>
        <p className="text-sm font-semibold text-blue">{t("part1.online", { defaultValue: MODALIDAD_INSCRIPCION })}</p>
      </div>

      <div className="rounded-xl border-2 border-green/30 bg-green/5 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-green mb-1">
          {nivelFijo ? t("part1.selectedTraining") : t("part1.chooseTraining")}
        </p>
        {nivelFijo ? (
          <>
            <p className="text-sm font-semibold text-black leading-snug">
              {getNivelDisplayLabel(t, nivelFijo)}
            </p>
            {programaPagadoLabel && (
              <p className="text-xs text-gray mt-2">
                {t("common.selectedPayment")}:{" "}
                {t("part1.selectedPaymentNote", { program: programaPagadoLabel })}
              </p>
            )}
          </>
        ) : (
          <>
            <label className="sr-only" htmlFor="p1-nivel">{t("part1.trainingLabel")}</label>
            <select
              id="p1-nivel"
              name="nivelEspecializacion"
              required
              value={form.nivelEspecializacion}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">{t("part1.trainingPlaceholder")}</option>
              {NIVELES_ESPECIALIZACION.filter((nivel) => nivel.tipoPrograma !== "otro").map((nivel) => (
                <option key={nivel.id} value={nivel.label}>
                  {t(`programs.levels.${nivel.id}`, { defaultValue: nivel.label })}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray mt-2">
              {t("part1.onlyEnrollmentNote")}
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl border border-yellow/30 bg-yellow/10 px-4 py-3 space-y-2">
        <p className="text-sm text-gray leading-relaxed">
          <strong className="text-black">{t("part1.accessStrong")}</strong>{" "}
          {t("part1.accessText")}
        </p>
        <p className="text-sm text-gray leading-relaxed">
          <strong className="text-black">{t("part1.googleStrong")}</strong>{" "}
          <Trans
            i18nKey="part1.googleText"
            ns="checkout"
            components={{ strong: <strong className="text-black" /> }}
          />
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-nombre">
          {t("part1.fullName")}
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
        <p className="mt-1.5 text-xs text-amber-700">
          {t("part1.fullNameHint")}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-nacimiento">
          {t("part1.birthDate")}
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
          {t("part1.nationality")}
        </label>
        <input
          id="p1-nacionalidad"
          name="nacionalidad"
          required
          value={form.nacionalidad}
          onChange={handleChange}
          className={inputClass}
          placeholder={t("part1.nationalityPlaceholder")}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-tel">
          {t("part1.mobile")}
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
          {t("part1.email")}
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
          {t("part1.emailHint")}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p1-usuario">
          {t("part1.institutionalUser")}
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
            placeholder={t("part1.userPlaceholder")}
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
            {t("part1.submitting")}
          </>
        ) : (
          t("part1.submit")
        )}
      </button>
      {loading && (
        <p className="text-xs text-gray text-center">
          {t("part1.submittingHint")}
        </p>
      )}
    </form>
  )
}

export default InscripcionParte1Form
