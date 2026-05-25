import * as React from "react"
import Layout from "../../components/layout"
import Seo from "../../components/seo"
import Nav from "../../components/nav"
import { Link } from "gatsby"
import { roxanaBooks } from "../../data/roxanaBooks"
import { roxanaBookBundle } from "../../data/roxanaBookOffers"
import { getDigitalBookDownloadUrl } from "../../utils/stripeCheckout"

const CheckoutSuccessPage = () => {
  const [checkoutParams, setCheckoutParams] = React.useState({
    ordenId: "",
    tipo: "",
    promoNeuro: false,
    downloadToken: "",
    sku: "",
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
    })
  }, [])

  const { ordenId, tipo, promoNeuro, downloadToken, sku } = checkoutParams
  const esEbook = tipo === "ebook"
  const esPaquete = sku === roxanaBookBundle.stripeSku
  const esInscripcion =
    tipo === "inscripcion" || tipo === "inicio_programa" || (!tipo && !esEbook)
  const inicioCompleto = tipo === "inicio_programa"
  const ebookBook = roxanaBooks.find((book) => book.digital?.stripeSku === sku)
  const downloadBooks = esPaquete ? roxanaBooks : ebookBook ? [ebookBook] : []

  const completarUrl = ordenId
    ? `/inscripcion/completar?orden=${encodeURIComponent(ordenId)}`
    : "/inscripcion/completar"

  const handleDownload = async (downloadSku, format) => {
    const key = `${downloadSku}_${format.toLowerCase()}`
    setDownloadState((prev) => ({ ...prev, [key]: { loading: true, error: "" } }))
    try {
      const data = await getDigitalBookDownloadUrl({
        ordenId,
        token: downloadToken,
        sku: downloadSku,
        format: format.toLowerCase(),
      })
      if (typeof window !== "undefined") {
        window.location.href = data.url
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
                  {esPaquete ? roxanaBookBundle.title : ebookBook?.title || "Tu libro digital"}.
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
    </Layout>
  )
}

export const Head = () => (
  <Seo title="Pago recibido" description="Tu pago fue procesado correctamente." pathname="/checkout/success" />
)

export default CheckoutSuccessPage
