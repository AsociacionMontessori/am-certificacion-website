import * as React from "react"
import { Link } from "gatsby"
import { roxanaBooks } from "../data/roxanaBooks"
import { roxanaBookBundles } from "../data/roxanaBookOffers"

const DEFAULT_DESCRIPTION = (
  <>
    Serie en español basada en las obras de María Montessori. Elige libro
    impreso, ebook o compra en <strong className="font-semibold text-yellow">Amazon México</strong>.
  </>
)

function BookCard({ book }) {
  const digitalFormats = book.digital?.formats?.join(" + ")
  const isGift = Boolean(book.gift)

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
            alt={`Portada de «${book.title}»`}
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
          {isGift ? "🎁 Regalo gratis" : `Libro ${book.volume}`}
        </p>
        <h3 className="mt-3 text-lg font-bold leading-snug text-blue sm:text-xl">
          {book.title}
        </h3>
        {isGift ? (
          <div className="mt-3 text-sm text-blue">
            <p className="rounded-md bg-yellow/15 px-3 py-2 font-semibold">
              Gratis con cualquier compra
              <span className="block text-xs font-normal text-gray">
                Recibes {digitalFormats} al comprar cualquier libro o paquete
              </span>
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 text-sm text-blue">
            {book.priceMx && (
              <p className="rounded-md bg-blue/5 px-3 py-2 font-semibold">
                Impreso: ${book.priceMx} MXN
                <span className="block text-xs font-normal text-gray">
                  Más gastos de envío
                </span>
              </p>
            )}
            {book.digital?.enabled && (
              <p className="rounded-md bg-green/10 px-3 py-2 font-semibold">
                Ebook: ${book.digital.priceMx} MXN
                <span className="block text-xs font-normal text-gray">
                  {digitalFormats} descargable
                </span>
              </p>
            )}
          </div>
        )}
        <p className="mt-3 flex-grow text-sm leading-relaxed text-gray sm:text-base">
          {book.description}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {!isGift && (
            <>
              <Link
                to={`/checkout/libro?sku=${book.stripeSku}`}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-green px-5 py-3 text-center text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-green/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2"
              >
                Comprar impreso
              </Link>
              {book.digital?.enabled && (
                <Link
                  to={`/checkout/libro?sku=${book.digital.stripeSku}`}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-green/50 bg-white px-5 py-3 text-center text-sm font-semibold text-green transition hover:bg-green/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-green"
                >
                  Comprar ebook
                </Link>
              )}
            </>
          )}
          <a
            href={book.amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-blue/40 bg-white px-5 py-3 text-center text-sm font-semibold text-blue transition hover:bg-blue/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            title={`Ver «${book.title}» en Amazon`}
          >
            Ver en Amazon
          </a>
        </div>
      </div>
    </article>
  )
}

function BundleCard({ bundle }) {
  const formats = bundle.formats?.join(" + ") || "PDF + EPUB"
  const count = bundle.bookIds?.length || 0

  return (
    <div className="overflow-hidden rounded-lg border border-yellow/40 bg-white/95 p-5 text-left shadow-xl sm:p-6">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="inline-flex rounded-md bg-yellow/20 px-3 py-1 text-xs font-semibold text-blue">
            Paquete digital
          </p>
          <h3 className="mt-3 text-xl font-bold text-blue">
            {bundle.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray sm:text-base">
            {bundle.description}
          </p>
          <p className="mt-3 text-base font-semibold text-blue">
            ${bundle.priceMx} MXN
            <span className="block text-xs font-normal text-gray">
              {bundle.note || `Incluye ${formats} de los ${count} libros`}
            </span>
          </p>
        </div>
        <Link
          to={`/checkout/libro?sku=${bundle.stripeSku}`}
          className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-green px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-green/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2"
        >
          Comprar paquete
        </Link>
      </div>
    </div>
  )
}

const RoxanaBooksSection = ({
  id = "libros",
  headingId = "roxana-libros-heading",
  eyebrow = "Publicaciones",
  title = "Sus libros",
  description = DEFAULT_DESCRIPTION,
  className = "border-t border-white/20 pt-10",
}) => {
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={className}
    >
      <div className="container mx-auto px-6 pb-12">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <p className="inline-flex rounded-md bg-yellow/25 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {eyebrow}
            </p>
          )}
          <h2
            id={headingId}
            className="mt-4 text-2xl font-bold text-white md:text-3xl"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-sm text-white/90 sm:text-base">
              {description}
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
          Los precios en sitio son referencia; el monto final se confirma en la pasarela
          de pago al crear el pedido.
        </p>
      </div>
    </section>
  )
}

export default RoxanaBooksSection
