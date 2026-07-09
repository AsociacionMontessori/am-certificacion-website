import * as React from "react"
import Layout from "../../components/layout"
import Seo from "../../components/seo"
import Nav from "../../components/nav"
import { Link } from "gatsby"
import { roxanaBooks } from "../../data/roxanaBooks"
import { roxanaBookBundles, roxanaGiftEbook } from "../../data/roxanaBookOffers"
import { downloadDigitalBookFile } from "../../utils/stripeCheckout"

const CheckoutSuccessPage = () => {
  const [checkoutParams, setCheckoutParams] = React.useState({
    ordenId: "",
    tipo: "",
    promoNeuro: false,
    downloadToken: "",
    sku: "",
    gift: "",
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
    })
  }, [])

  const { ordenId, tipo, promoNeuro, downloadToken, sku, gift } = checkoutParams
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
    ? `/inscripcion/completar?orden=${encodeURIComponent(ordenId)}`
    : "/inscripcion/completar"

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
          error: err.message || "No se pudo preparar la descarga",
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
          <h1 className="text-2xl font-bold text-blue mb-3">¡Pago recibido!</h1>
          <p className="text-gray text-base leading-relaxed mb-4">
            {esEbook
              ? "Tu compra digital quedó registrada. Descarga tus formatos desde esta página."
              : esInscripcion
                ? promoNeuro
                  ? "Tu pago del diplomado quedó registrado. Con la promoción vigente, tu inscripción institucional va incluida. Sigue con la creación de tu cuenta y el expediente administrativo."
                  : inicioCompleto
                    ? "Tu inscripción y el pago inicial de tu programa quedaron registrados. Sigue con la creación de tu cuenta y el expediente administrativo."
                    : "Tu pago de inscripción quedó registrado. Sigue con la creación de tu cuenta y el expediente administrativo."
                : "Gracias por tu pago. En las próximas 24-48 horas revisaremos tu pedido y te contactaremos por correo."}
          </p>
          {ordenId && (
            <p className="text-sm text-gray mb-6">
              Referencia: <span className="font-mono text-blue">{ordenId}</span>
            </p>
          )}

          {esEbook && (
            <div className="text-left rounded-2xl border border-green/20 bg-green/5 px-5 py-4 mb-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green mb-1">
                  Descarga digital
                </p>
                <p className="text-sm text-gray leading-relaxed">
                  {esPaquete ? bundleTitle : ebookBook?.title || "Tu libro digital"}.
                </p>
                <p className="mt-2 text-xs text-gray leading-relaxed">
                  Cada enlace se genera por seguridad y expira después de abrirlo.
                </p>
              </div>
              {!downloadToken ? (
                <p className="text-sm text-red rounded-lg bg-red/5 px-3 py-2">
                  Falta el token de descarga. Escríbenos con tu referencia para ayudarte.
                </p>
              ) : (
                <div className="grid gap-4">
                  {downloadBooks.map((book) => (
                    <div key={book.id} className="rounded-lg border border-green/15 bg-white p-3">
                      <p className="mb-2 text-sm font-semibold text-blue">
                        Libro {book.volume}: {book.title}
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
                                {state.loading ? "Preparando..." : `Descargar ${format}`}
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
                  🎁 {giftBooks.length > 1 ? "Tus regalos" : "Tu regalo"}
                </p>
                <p className="text-sm text-gray leading-relaxed">
                  Incluido{giftBooks.length > 1 ? "s" : ""} sin costo con tu compra. Descarga en PDF + EPUB.
                </p>
              </div>
              {!downloadToken ? (
                <p className="text-sm text-red rounded-lg bg-red/5 px-3 py-2">
                  Falta el token de descarga. Escríbenos con tu referencia para ayudarte.
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
                                {state.loading ? "Preparando..." : `Descargar ${format}`}
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
                  Paso 2 · Cuenta en el portal
                </p>
                <p className="text-sm text-gray leading-relaxed mb-3">
                  Crea tu usuario <strong>@certificacionmontessori.com</strong> con tus datos básicos.
                </p>
                <Link
                  to={completarUrl}
                  className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green text-center"
                >
                  Crear mi cuenta
                </Link>
              </div>
              <p className="text-xs text-gray leading-relaxed">
                Después completarás el <strong>expediente administrativo</strong> (documentos y reglamento firmado).
                No necesitas adjuntar comprobante de pago.
              </p>
            </div>
          )}

          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center justify-center px-8 py-3 rounded-full font-semibold text-white bg-blue hover:bg-blue/90"
          >
            Volver al inicio
          </Link>
        </article>
      </section>
      </div>
    </Layout>
  )
}

export const Head = () => (
  <Seo title="Pago recibido" description="Tu pago fue procesado correctamente." pathname="/checkout/success" robots="noindex,follow" />
)

export default CheckoutSuccessPage
