import * as React from "react"
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
        <p className="mt-3 flex-grow text-sm leading-relaxed text-gray sm:text-base">
          {book.description}
        </p>
        <a
          href={book.amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-blue px-5 py-3 text-center text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2"
          title={`Ver «${book.title}» en Amazon`}
        >
          Ver en Amazon
        </a>
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
            Serie en español basada en las obras de María Montessori, con revisión
            actualizada del método. Disponibles en{" "}
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
          También puedes adquirirlos directamente con la Asociación Montessori de
          México A.C. mediante{" "}
          <a
            href="/publicaciones/"
            className="font-semibold text-yellow underline-offset-2 hover:underline"
          >
            nuestra sección de publicaciones
          </a>
          .
        </p>
      </div>
    </section>
  )
}

export default RoxanaBooksSection
