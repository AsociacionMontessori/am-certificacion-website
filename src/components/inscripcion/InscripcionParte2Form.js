import * as React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  DOCUMENTOS_PARTE2,
  ESCOLARIDAD_OPCIONES,
  getReglamentoUrl,
} from "../../data/inscripcionForm"
import { submitInscripcionParte2 } from "../../utils/inscripcionApi"
import FileUploadField from "./FileUploadField"

const emptyForm = {
  escolaridad: "",
  domicilio: "",
  curpPasaporte: "",
  ocupacion: "",
  empresa: "",
  telefonoEmpresa: "",
}

const InscripcionParte2Form = ({ ordenId, accessToken, nivelEspecializacion, requiereFactura = false, initialValues = {}, onSuccess }) => {
  const { t } = useTranslation("checkout")
  const [form, setForm] = useState({ ...emptyForm, ...initialValues })
  const [documentos, setDocumentos] = useState(initialValues.documentos || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // La cédula de identificación fiscal solo aplica si el alumno pidió factura.
  const documentosVisibles = DOCUMENTOS_PARTE2.filter(
    (d) => d.id !== "cedulaFiscal" || requiereFactura
  )

  const reglamentoUrl = getReglamentoUrl(nivelEspecializacion)
  const inputClass =
    "w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white"

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleDocUploaded = (docId, meta) => {
    setDocumentos((prev) => ({ ...prev, [docId]: meta }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const faltantes = documentosVisibles.filter((d) => d.required && !documentos[d.id]?.storagePath)
    if (faltantes.length > 0) {
      const docs = faltantes
        .map((d) => t(`part2.documentLabels.${d.id}`, { defaultValue: d.label }))
        .join(", ")
      setError(t("part2.missingDocs", { docs }))
      return
    }
    setLoading(true)
    try {
      await submitInscripcionParte2(ordenId, { ...form, documentos }, accessToken)
      onSuccess?.()
    } catch (err) {
      setError(err.message || t("part2.submitError"))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray leading-relaxed">
        {t("part2.intro")}
      </p>

      <div className="rounded-2xl border border-blue/20 bg-blue/5 px-4 py-4 space-y-2">
        <p className="text-sm font-semibold text-blue">{t("part2.rulesTitle")}</p>
        <p className="text-xs text-gray leading-relaxed">
          {t("part2.rulesText")}
        </p>
        <a
          href={reglamentoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center px-5 py-2 rounded-full text-sm font-semibold text-white bg-blue"
        >
          {t("part2.downloadRules")}
        </a>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p2-escolaridad">
          {t("part2.education")}
        </label>
        <select id="p2-escolaridad" name="escolaridad" required value={form.escolaridad} onChange={handleChange} className={inputClass}>
          <option value="">{t("part2.educationPlaceholder")}</option>
          {ESCOLARIDAD_OPCIONES.map((e) => (
            <option key={e} value={e}>{t(`part2.educationOptions.${e}`, { defaultValue: e })}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p2-domicilio">
          {t("part2.address")}
        </label>
        <textarea id="p2-domicilio" name="domicilio" required rows={3} value={form.domicilio} onChange={handleChange} className={`${inputClass} min-h-[96px] py-3`} />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p2-curp">
          {t("part2.curpPassport")}
        </label>
        <input id="p2-curp" name="curpPasaporte" required value={form.curpPasaporte} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p2-ocupacion">
          {t("part2.occupation")}
        </label>
        <input id="p2-ocupacion" name="ocupacion" required value={form.ocupacion} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p2-empresa">
          {t("part2.company")}
        </label>
        <input id="p2-empresa" name="empresa" value={form.empresa} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1.5" htmlFor="p2-tel-empresa">
          {t("part2.companyPhone")}
        </label>
        <input id="p2-tel-empresa" name="telefonoEmpresa" type="tel" value={form.telefonoEmpresa} onChange={handleChange} className={inputClass} />
      </div>

      <div className="space-y-3 pt-2">
        <p className="text-sm font-semibold text-black">{t("part2.documents")}</p>
        {documentosVisibles.map((doc) => (
          <FileUploadField
            key={doc.id}
            ordenId={ordenId}
            accessToken={accessToken}
            docId={doc.id}
            label={t(`part2.documentLabels.${doc.id}`, { defaultValue: doc.label })}
            hint={t(`part2.documentHints.${doc.id}`, {
              defaultValue: t("part2.documentHints.default", { defaultValue: doc.hint }),
            })}
            required={doc.required}
            value={documentos[doc.id]}
            onUploaded={handleDocUploaded}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-red rounded-lg bg-red/5 px-3 py-2" role="alert">{error}</p>
      )}

      <button type="submit" disabled={loading} className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green disabled:opacity-60">
        {loading ? t("part2.submitting") : t("part2.submit")}
      </button>
    </form>
  )
}

export default InscripcionParte2Form
