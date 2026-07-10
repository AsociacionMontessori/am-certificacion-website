import * as React from "react"
import { useState } from "react"
import { Link } from "gatsby"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"
import { createPublicCheckoutSession } from "../../utils/stripeCheckout"

const BookCheckoutForm = ({ book, purchase = "physical", cancelHref, onCancel }) => {
  const { t } = useTranslation("checkout")
  const { language, localizedPath } = useLocalization()
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkoutUrl, setCheckoutUrl] = useState("")

  const isDigital = purchase === "digital"
  const selectedSku = isDigital ? book.digital?.stripeSku : book.stripeSku
  const selectedPrice = isDigital ? book.digital?.priceMx : book.priceMx
  const digitalFormats = book.digital?.formats?.join(" + ")
  const label = book.volume
    ? t("bookForm.bookLabel", { volume: book.volume })
    : t("bookForm.bundleLabel")

  const handleBuy = async (e) => {
    e.preventDefault()
    setError("")
    setCheckoutUrl("")
    setLoading(true)
    // Abrimos la pestaña ya, dentro del gesto de clic, para que el navegador
    // no la bloquee tras el await. El sitio se queda en esta pestaña.
    const stripeTab = typeof window !== "undefined" ? window.open("", "_blank") : null
    try {
      const { url } = await createPublicCheckoutSession({
        sku: selectedSku,
        quantity: 1,
        cliente: {
          nombre: nombre.trim(),
          email: email.trim(),
        },
        language,
        ...(isDigital && codigo.trim() ? { codigo: codigo.trim() } : {}),
      })
      if (stripeTab && !stripeTab.closed) {
        stripeTab.location = url
        setCheckoutUrl(url)
        setLoading(false)
      } else if (typeof window !== "undefined") {
        // Popup bloqueado: redirige en esta misma pestaña como respaldo.
        window.location.href = url
      }
    } catch (err) {
      if (stripeTab && !stripeTab.closed) stripeTab.close()
      setError(err.message || t("bookForm.error"))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleBuy} className="w-full text-left space-y-4">
      <p className="text-sm text-gray leading-relaxed">
        <span className="font-semibold text-blue">
          {label} · {isDigital ? t("bookForm.ebook") : t("bookForm.printed")}
        </span>
        <br />
        {book.title}
      </p>
      {selectedPrice && (
        <p className="text-base font-semibold text-blue">
          ${selectedPrice} MXN
          <span className="block text-xs font-normal text-gray mt-1">
            {isDigital
              ? t("bookForm.includesDownload", { formats: digitalFormats })
              : t("bookForm.shipping")}
          </span>
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-black mb-1.5" htmlFor={`book-nombre-${book.id}`}>
            {t("bookForm.name")}
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
            {t("bookForm.email")}
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
              {t("bookForm.giftCode")} <span className="font-normal text-gray">{t("bookForm.optional")}</span>
            </label>
            <input
              id={`book-codigo-${book.id}`}
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder={t("bookForm.placeholder")}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray/25 text-black text-base bg-white uppercase placeholder:normal-case placeholder:text-gray/60"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <span className="block text-xs text-gray mt-1">
              {t("bookForm.giftHint")}
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red rounded-lg bg-red/5 px-3 py-2" role="alert">
          {error}
        </p>
      )}

      {checkoutUrl && (
        <p className="text-sm text-blue rounded-lg bg-blue/5 px-3 py-2 leading-relaxed">
          {t("common.openPayment")}{" "}
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            {t("common.openHere")}
          </a>
          .
        </p>
      )}

      <div className="flex flex-col gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="min-h-[48px] w-full rounded-full bg-green px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? t("common.redirecting") : t("bookForm.submit")}
        </button>
        {cancelHref ? (
          <Link
            to={localizedPath(cancelHref)}
            className="min-h-[48px] w-full inline-flex items-center justify-center rounded-full border border-blue/30 text-blue text-sm font-medium text-center"
          >
            {t("common.cancel")}
          </Link>
        ) : onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] w-full rounded-full border border-blue/30 text-blue text-sm font-medium"
          >
            {t("common.cancel")}
          </button>
        ) : null}
      </div>
    </form>
  )
}

export default BookCheckoutForm
