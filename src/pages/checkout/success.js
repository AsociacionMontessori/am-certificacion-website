import * as React from "react"
import Layout from "../../components/layout"
import Seo from "../../components/seo"
import Nav from "../../components/nav"
import { Link } from "gatsby"
import { Trans, useTranslation } from "react-i18next"
import { getT, useLocalization } from "../../i18n"
import { roxanaBooks } from "../../data/roxanaBooks"
import { roxanaBookBundles, roxanaGiftEbook } from "../../data/roxanaBookOffers"
import { downloadDigitalBookFile } from "../../utils/stripeCheckout"

const CheckoutSuccessPage = () => {
  const { t } = useTranslation("checkout")
  const { localizedPath } = useLocalization()
  const [checkoutParams, setCheckoutParams] = React.useState({
    ordenId: "",
    tipo: "",
    promoNeuro: false,
    downloadToken: "",
    sku: "",
    gift: "",
    accessToken: "",
  })
  const [downloadState, setDownloadState] = React.useState({})

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    setCheckoutParams({
      ordenId: params.get("orden") || "",
      tipo: params.get("tipo") || "",
      promoNeuro: params.get("promo") === "1",
      downloadToken: params.get("download") || "",
      sku: params.get("sku") || "",
      gift: params.get("gift") || "",
      accessToken: params.get("t") || "",
    })
  }, [])

  const { ordenId, tipo, promoNeuro, downloadToken, sku, gift, accessToken } = checkoutParams
  const esEbook = tipo === "ebook"
  const bundle = roxanaBookBundles.find((b) => b.stripeSku === sku)
  const esPaquete = Boolean(bundle)
  const esInscripcion =
    tipo === "inscripcion" || tipo === "inicio_programa" || (!tipo && !esEbook)
  const inicioCompleto = tipo === "inicio_programa"
  const ebookBook = roxanaBooks.find((book) => book.digital?.stripeSku === sku)
  const bundleTitle = bundle?.title
  const downloadBooks = esPaquete
    ? bundle.bookIds
        .map((id) => roxanaBooks.find((b) => b.id === id))
        .filter(Boolean)
    : ebookBook
      ? [ebookBook]
      : []
  // Regalos: el backend pasa en `gift` los IDs de libros regalados (coma).
  // Compat: "1" = «La mente absorbente» (esquema anterior).
  const giftBookIds = gift === "1" ? [roxanaGiftEbook.bookId] : gift.split(",").filter(Boolean)
  const giftBooks = giftBookIds
    .map((id) => roxanaBooks.find((b) => b.id === id))
    .filter(Boolean)
  const mostrarRegalo = Boolean(downloadToken) && giftBooks.length > 0

  const completarUrl = ordenId
    ? localizedPath(
        `/inscripcion/completar?orden=${encodeURIComponent(ordenId)}${
          accessToken ? `&t=${encodeURIComponent(accessToken)}` : ""
        }`
      )
    : localizedPath("/inscripcion/completar")

  const handleDownload = async (downloadSku, format) => {
    const key = `${downloadSku}_${format.toLowerCase()}`
    setDownloadState((prev) => ({ ...prev, [key]: { loading: true, error: "" } }))
    try {
      const data = await downloadDigitalBookFile({
        ordenId,
        token: downloadToken,
        sku: downloadSku,
        format: format.toLowerCase(),
      })
      if (typeof window !== "undefined") {
        const url = window.URL.createObjectURL(data.blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = data.fileName
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.URL.revokeObjectURL(url)
      }
      setDownloadState((prev) => ({ ...prev, [key]: { loading: false, error: "" } }))
    } catch (err) {
      setDownloadState((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          error: err.message || t("success.downloadError"),
        },
      }))
    }
  }

  return (
    <Layout>
      <div
        className="bg-cover bg-center bg-fixed"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,151,178,0.92), rgba(0,151,178,0.80), rgba(126,217,87,0.92)), url('/backgrounds/home.webp')",
        }}
      >
      <Nav textColor="text-white" />
      <section className="min-h-[60vh] flex items-center justify-center px-6 py-24">
        <article className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green/20 flex items-center justify-center">
            <span className="text-3xl text-green" aria-hidden="true">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-blue mb-3">{t("success.title")}</h1>
          <p className="text-gray text-base leading-relaxed mb-4">
            {esEbook
              ? t("success.ebookMessage")
              : esInscripcion
                ? promoNeuro
                  ? t("success.promoMessage")
                  : inicioCompleto
                    ? t("success.fullStartMessage")
                    : t("success.enrollmentMessage")
                : t("success.defaultMessage")}
          </p>
          {ordenId && (
            <p className="text-sm text-gray mb-6">
              {t("common.reference")}: <span className="font-mono text-blue">{ordenId}</span>
            </p>
          )}

          {esEbook && (
            <div className="text-left rounded-2xl border border-green/20 bg-green/5 px-5 py-4 mb-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green mb-1">
                  {t("success.digitalDownload")}
                </p>
                <p className="text-sm text-gray leading-relaxed">
                  {esPaquete ? bundleTitle : ebookBook?.title || t("success.yourDigitalBook")}.
                </p>
                <p className="mt-2 text-xs text-gray leading-relaxed">
                  {t("success.downloadSecurity")}
                </p>
              </div>
              {!downloadToken ? (
                <p className="text-sm text-red rounded-lg bg-red/5 px-3 py-2">
                  {t("success.missingDownloadToken")}
                </p>
              ) : (
                <div className="grid gap-4">
                  {downloadBooks.map((book) => (
                    <div key={book.id} className="rounded-lg border border-green/15 bg-white p-3">
                      <p className="mb-2 text-sm font-semibold text-blue">
                        {t("bookForm.bookLabel", { volume: book.volume })}: {book.title}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(book.digital?.formats || ["PDF", "EPUB"]).map((format) => {
                          const key = `${book.digital.stripeSku}_${format.toLowerCase()}`
                          const state = downloadState[key] || {}
                          return (
                            <div key={format}>
                              <button
                                type="button"
                                onClick={() => handleDownload(book.digital.stripeSku, format)}
                                disabled={state.loading}
                                className="min-h-[44px] w-full rounded-full bg-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                              >
                                {state.loading ? t("success.preparing") : t("success.download", { format })}
                              </button>
                              {state.error && (
                                <p className="mt-2 text-xs text-red rounded-lg bg-red/5 px-3 py-2" role="alert">
                                  {state.error}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mostrarRegalo && (
            <div className="text-left rounded-2xl border border-yellow/50 bg-yellow/10 px-5 py-4 mb-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue mb-1">
                  {giftBooks.length > 1 ? t("success.gifts") : t("success.gift")}
                </p>
                <p className="text-sm text-gray leading-relaxed">
                  {t("success.giftDetail", { plural: giftBooks.length > 1 ? "s" : "" })}
                </p>
              </div>
              {!downloadToken ? (
                <p className="text-sm text-red rounded-lg bg-red/5 px-3 py-2">
                  {t("success.missingDownloadToken")}
                </p>
              ) : (
                <div className="grid gap-4">
                  {giftBooks.map((book) => (
                    <div key={book.id} className="rounded-lg border border-yellow/30 bg-white p-3">
                      <p className="mb-2 text-sm font-semibold text-blue">
                        {book.title}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(book.digital?.formats || ["PDF", "EPUB"]).map((format) => {
                          const key = `${book.digital.stripeSku}_${format.toLowerCase()}`
                          const state = downloadState[key] || {}
                          return (
                            <div key={format}>
                              <button
                                type="button"
                                onClick={() => handleDownload(book.digital.stripeSku, format)}
                                disabled={state.loading}
                                className="min-h-[44px] w-full rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                              >
                                {state.loading ? t("success.preparing") : t("success.download", { format })}
                              </button>
                              {state.error && (
                                <p className="mt-2 text-xs text-red rounded-lg bg-red/5 px-3 py-2" role="alert">
                                  {state.error}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {esInscripcion && (
            <div className="text-left rounded-2xl border border-blue/20 bg-blue/5 px-5 py-4 mb-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue mb-1">
                  {t("success.step2Kicker")}
                </p>
                <p className="text-sm text-gray leading-relaxed mb-3">
                  <Trans
                    i18nKey="success.step2Text"
                    ns="checkout"
                    components={{ strong: <strong /> }}
                  />
                </p>
                <Link
                  to={completarUrl}
                  className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green text-center"
                >
                  {t("success.createAccount")}
                </Link>
              </div>
              <p className="text-xs text-gray leading-relaxed">
                <Trans
                  i18nKey="success.step2After"
                  ns="checkout"
                  components={{ strong: <strong /> }}
                />
              </p>
            </div>
          )}

          <Link
            to={localizedPath("/")}
            className="inline-flex min-h-[44px] items-center justify-center px-8 py-3 rounded-full font-semibold text-white bg-blue hover:bg-blue/90"
          >
            {t("success.home")}
          </Link>
        </article>
      </section>
      </div>
    </Layout>
  )
}

export const Head = ({ location }) => {
  const t = getT(location.pathname, "checkout")
  return (
    <Seo
      title={t("success.seoTitle")}
      description={t("success.seoDescription")}
      pathname={location.pathname}
      robots="noindex,follow"
    />
  )
}

export default CheckoutSuccessPage
