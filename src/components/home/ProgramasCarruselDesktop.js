import * as React from "react"
import { Link } from "gatsby"
import { PROGRAMAS_DESTACADOS } from "../../data/marketingPrograms"
import { isMexico } from "../../utils/localizedPrice"

const ProgramCard = ({ programa, coin, useMxn }) => {
  const price = useMxn ? programa.priceMx : programa.priceUsd
  const anchor = useMxn ? programa.anchorPriceMx : programa.anchorPriceUsd
  const isExternal = programa.cta.startsWith("http")
  const className =
    "snap-start shrink-0 w-[min(76vw,272px)] sm:w-[248px] rounded-2xl border border-white/40 bg-white/95 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl hover:border-blue/40 transition-shadow block"

  const inner = (
    <>
      <span className="inline-block text-xs font-bold uppercase tracking-wide text-blue mb-1">
        {programa.tipo}
      </span>
      <h3 className="text-base font-bold text-black leading-snug">{programa.title}</h3>
      <p className="text-xs text-gray mt-1 leading-relaxed">{programa.subtitle}</p>
      {programa.duration && (
        <p className="text-xs text-gray/80 mt-1">Duración: {programa.duration}</p>
      )}
      <div className="mt-3 flex items-end gap-2 flex-wrap">
        {anchor && <span className="text-sm text-gray line-through">${anchor}</span>}
        <span className="text-2xl font-bold text-blue">${price}</span>
        <span className="text-xs text-gray mb-1">{coin}</span>
      </div>
      <p className="text-xs text-gray mt-1">{programa.priceNote}</p>
      {programa.promoInscripcionIncluida && (
        <span className="inline-block mt-2 rounded-full bg-green/25 text-green text-xs font-semibold px-2 py-0.5">
          Inscripción incluida
        </span>
      )}
    </>
  )

  if (isExternal) {
    return (
      <a href={programa.cta} className={className} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }
  return (
    <Link to={programa.cta} className={className}>
      {inner}
    </Link>
  )
}

/** Carrusel horizontal de programas — solo visible en escritorio (lg+). */
const ProgramasCarruselDesktop = ({ geo }) => {
  const useMxn = isMexico(geo)
  const coin = useMxn ? "MXN" : "USD"
  const programas = PROGRAMAS_DESTACADOS.filter((p) => p.id !== "inscripcion")

  return (
    <div className="hidden lg:block mt-4">
      <p className="text-xs font-semibold text-white mb-2 sm:text-sm">
        Nuestros programas — desliza para comparar
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {programas.map((programa) => (
          <ProgramCard key={programa.id} programa={programa} coin={coin} useMxn={useMxn} />
        ))}
      </div>
    </div>
  )
}

export default ProgramasCarruselDesktop
