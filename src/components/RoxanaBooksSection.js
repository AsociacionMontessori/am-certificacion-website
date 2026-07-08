import * as React from "react"
import { Link } from "gatsby"
import { Trans, useTranslation } from "react-i18next"
import { roxanaBooks } from "../data/roxanaBooks"
import { roxanaBookBundles } from "../data/roxanaBookOffers"

function BookCard({ book }) {
  const { t } = useTranslation("publicaciones")
  const digitalFormats = book.digital?.formats?.join(" + ")
  const isGift = Boolean(book.gift)
  const bookTitle = t(`libros.${book.id}.titulo`, { defaultValue: book.title })
  const bookDescription = t(`libros.${book.id}.descripcion`, {
    defaultValue: book.description,
  })

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-lg border bg-white/95 shadow-xl backdrop-blur-sm ${
        isGift ? "border-yellow/70 ring-2 ring-yellow/40" : "border-white/30"
      }`}
    >
      <div className="flex justify-center bg-blue/5 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="aspect-[2/3] w-full max-w-[160px] overflow-hidden sm:max-w-[200px] md:max-w-[220px]">
          <img
            src={book.coverImage}
            alt={t("card.portadaAlt", { titulo: bookTitle })}
            className="h-full w-full object-contain object-center"
            loading="lazy"
            width={220}
            height={330}
          />
        </div>
      </div>
      <div className="flex flex-grow flex-col p-5 sm:p-6">
        <p
          className={`inline-flex self-start rounded-md px-3 py-1 text-xs font-semibold ${
            isGift ? "bg-yellow/40 text-blue" : "bg-yellow/20 text-blue"
          }`}
        >
          {isGift ? t("card.regaloGratis") : t("card.libroVolumen", { volumen: book.volume })}
        </p>
        <h3 className="mt-3 text-lg font-bold leading-snug text-blue sm:text-xl">
          {bookTitle}
        </h3>
        <div className="mt-3 grid gap-2 text-sm text-blue">
          {book.digital?.enabled && book.digital?.priceMx && (
            <p className="rounded-md bg-green/10 px-3 py-2 font-semibold">
              {t("card.ebookPrecio", { precio: book.digital.priceMx })}
              <span className="block text-xs font-normal text-gray">
                {t("card.formatosDescargable", { formatos: digitalFormats })}
              </span>
            </p>
          )}
          {isGift ? (
            <p className="rounded-md bg-yellow/15 px-3 py-2 font-semibold">
              {t("card.regaloConCompra")}
              <span className="block text-xs font-normal text-gray">
                {t("card.regaloDetalle", { formatos: digitalFormats })}
              </span>
            </p>
          ) : (
            <p className="rounded-md bg-blue/5 px-3 py-2 font-semibold">
              {t("card.edicionImpresa")}
              <span className="block text-xs font-normal text-gray">
                {t("card.disponibleAmazon")}
              </span>
            </p>
          )}
        </div>
        <p className="mt-3 flex-grow text-sm leading-relaxed text-gray sm:text-base">
          {bookDescription}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {book.digital?.enabled && book.digital?.priceMx && (
            <Link
              to={`/checkout/libro?sku=${book.digital.stripeSku}`}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-green px-5 py-3 text-center text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-green/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2"
            >
              {t("card.comprarEbook")}
            </Link>
          )}
          <a
            href={book.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-blue/40 bg-white px-5 py-3 text-center text-sm font-semibold text-blue transition hover:bg-blue/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            title={t("card.verEnAmazonTitle", { titulo: bookTitle })}
          >
            {t("card.verEnAmazon")}
          </a>
        </div>
      </div>
    </article>
  )
}

function BundleCard({ bundle }) {
  const { t } = useTranslation("publicaciones")
  const formats = bundle.formats?.join(" + ") || "PDF + EPUB"
  const count = bundle.bookIds?.length || 0
  const bundleTitle = t(`paquetes.${bundle.id}.titulo`, { defaultValue: bundle.title })
  const bundleDescription = t(`paquetes.${bundle.id}.descripcion`, {
    defaultValue: bundle.description,
  })
  const bundleNote = bundle.note
    ? t(`paquetes.${bundle.id}.nota`, { defaultValue: bundle.note })
    : t("bundle.incluye", { formatos: formats, cantidad: count })

  return (
    <div className="overflow-hidden rounded-lg border border-yellow/40 bg-white/95 p-5 text-left shadow-xl sm:p-6">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="inline-flex rounded-md bg-yellow/20 px-3 py-1 text-xs font-semibold text-blue">
            {t("bundle.etiqueta")}
          </p>
          <h3 className="mt-3 text-xl font-bold text-blue">
            {bundleTitle}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray sm:text-base">
            {bundleDescription}
          </p>
          <p className="mt-3 text-base font-semibold text-blue">
            {t("bundle.precio", { precio: bundle.priceMx })}
            <span className="block text-xs font-normal text-gray">
              {bundleNote}
            </span>
          </p>
        </div>
        <Link
          to={`/checkout/libro?sku=${bundle.stripeSku}`}
          className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-green px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-green/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2"
        >
          {t("bundle.comprar")}
        </Link>
      </div>
    </div>
  )
}

const RoxanaBooksSection = ({
  id = "libros",
  headingId = "roxana-libros-heading",
  eyebrow,
  title,
  description,
  className = "border-t border-white/20 pt-10",
}) => {
  const { t } = useTranslation("publicaciones")
  const eyebrowContent = eyebrow === undefined ? t("seccion.eyebrow") : eyebrow
  const titleContent = title === undefined ? t("seccion.title") : title
  const descriptionContent =
    description === undefined ? (
      <Trans
        i18nKey="seccion.description"
        ns="publicaciones"
        components={{ destacado: <strong className="font-semibold text-yellow" /> }}
      />
    ) : (
      description
    )

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={className}
    >
      <div className="container mx-auto px-6 pb-12">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrowContent && (
            <p className="inline-flex rounded-md bg-yellow/25 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {eyebrowContent}
            </p>
          )}
          <h2
            id={headingId}
            className="mt-4 text-2xl font-bold text-white md:text-3xl"
          >
            {titleContent}
          </h2>
          {descriptionContent && (
            <p className="mt-3 text-sm text-white/90 sm:text-base">
              {descriptionContent}
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:gap-6">
          {roxanaBookBundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>

        <ul className="mt-8 grid list-none grid-cols-1 gap-4 p-0 sm:gap-6 md:grid-cols-2">
          {roxanaBooks.map((book) => (
            <li key={book.id}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-white/80 sm:text-sm">
          {t("seccion.nota")}
        </p>
      </div>
    </section>
  )
}

export default RoxanaBooksSection
