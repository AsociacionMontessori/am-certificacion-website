import * as React from "react"
import { Link } from "gatsby"
import { roxanaBooks } from "../data/roxanaBooks"

function BookCard({ book }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-xl backdrop-blur-sm">
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
          <p className="inline-flex self-start rounded-full bg-yellow/20 px-3 py-1 text-xs font-semibold text-blue">
            Libro {book.volume}
          </p>
          <h3 className="mt-3 text-lg font-bold leading-snug text-blue sm:text-xl">
            {book.title}
          </h3>
          {book.priceMx && (
            <p className="mt-2 text-base font-semibold text-blue">
              ${book.priceMx} MXN
              <span className="block text-xs font-normal text-gray">
                Envío dentro de México (se solicitará en el pago)
              </span>
            </p>
          )}
          <p className="mt-3 flex-grow text-sm leading-relaxed text-gray sm:text-base">
            {book.description}
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <Link
              to={`/checkout/libro?sku=${book.stripeSku}`}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-green px-5 py-3 text-center text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-green/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2"
            >
              Comprar con la asociación
            </Link>
            <a
              href={book.amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-blue/40 bg-white px-5 py-3 text-center text-sm font-semibold text-blue transition hover:bg-blue/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              title={`Ver «${book.title}» en Amazon`}
            >
              Ver en Amazon
            </a>
          </div>
        </div>
      </article>
  )
}

const RoxanaBooksSection = () => {
  return (
    <section
      id="libros"
      aria-labelledby="roxana-libros-heading"
      className="border-t border-white/20 pt-10"
    >
      <div className="container mx-auto px-6 pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full bg-yellow/25 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Publicaciones
          </p>
          <h2
            id="roxana-libros-heading"
            className="mt-4 text-2xl font-bold text-white md:text-3xl"
          >
            Sus libros
          </h2>
          <p className="mt-3 text-sm text-white/90 sm:text-base">
            Serie en español basada en las obras de María Montessori. Compra directa con
            pago seguro o en{" "}
            <strong className="font-semibold text-yellow">Amazon México</strong>.
          </p>
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
          Stripe al crear el pedido.
        </p>
      </div>
    </section>
  )
}

export default RoxanaBooksSection
