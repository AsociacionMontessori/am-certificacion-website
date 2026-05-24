import * as React from "react"
import { useState } from "react"
import { requestInscripcionUploadUrl, uploadFileToSignedUrl } from "../../utils/inscripcionApi"

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf"
const MAX_MB = 10

const FileUploadField = ({ ordenId, docId, label, hint, required, value, onUploaded }) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo debe ser menor a ${MAX_MB} MB`)
      return
    }
    setUploading(true)
    try {
      const { uploadUrl, storagePath } = await requestInscripcionUploadUrl(ordenId, docId, file)
      await uploadFileToSignedUrl(uploadUrl, file)
      onUploaded(docId, { storagePath, fileName: file.name, contentType: file.type })
    } catch (err) {
      setError(err.message || "Error al subir el archivo")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray/15 bg-white px-4 py-4 space-y-2">
      <label className="block text-sm font-medium text-black" htmlFor={`file-${docId}`}>
        {label}
        {required ? " *" : ""}
      </label>
      {hint && <p className="text-xs text-gray">{hint}</p>}
      <input
        id={`file-${docId}`}
        type="file"
        accept={ACCEPT}
        disabled={uploading}
        onChange={handleChange}
        className="w-full text-sm file:mr-3 file:min-h-[44px] file:rounded-full file:border-0 file:bg-blue/10 file:px-4 file:font-medium file:text-blue"
      />
      {value?.fileName && (
        <p className="text-xs text-green font-medium">✓ {value.fileName}</p>
      )}
      {uploading && <p className="text-xs text-gray">Subiendo archivo…</p>}
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  )
}

export default FileUploadField
