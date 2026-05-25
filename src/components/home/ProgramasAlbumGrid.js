import * as React from "react"
import { Link } from "gatsby"
import { PROGRAMAS_DESTACADOS } from "../../data/marketingPrograms"

const PROGRAMA_VISUAL = {
  inscripcion: {
    gradient: "from-yellow via-orange to-red",
    accent: "🎓",
    wide: true,
  },
  cosmica: {
    gradient: "from-blue via-purple to-green",
    accent: "🌌",
    wide: false,
  },
  neuro: {
    gradient: "from-green via-blue to-purple",
    accent: "🧠",
    wide: false,
  },
  taller: {
    gradient: "from-orange via-red to-purple",
    accent: "🔨",
    wide: false,
  },
  casa: {
    gradient: "from-blue to-green",
    accent: "🏠",
    wide: false,
  },
  nido: {
    gradient: "from-green via-blue to-yellow",
    accent: "🌱",
    wide: false,
  },
}

const ProgramAlbumCard = ({ programa, coin, useMxn }) => {
  const visual = PROGRAMA_VISUAL[programa.id] || PROGRAMA_VISUAL.cosmica
  const price = useMxn ? programa.priceMx : programa.priceUsd
  const anchor = useMxn ? programa.anchorPriceMx : programa.anchorPriceUsd
  const isExternal = programa.cta.startsWith("http")
  const isWide = visual.wide

  const cardClass = [
    "group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl",
    "bg-white/95 shadow-lg ring-1 ring-white/40",
    "transition-all duration-300 ease-out",
    "hover:-translate-y-1 hover:shadow-2xl hover:ring-white/80",
    "focus-within:ring-2 focus-within:ring-green/60",
    isWide ? "col-span-2 md:col-span-1" : "",
  ].join(" ")

  const body = (
    <>
      <div
        className={`relative flex min-h-[7.5rem] sm:min-h-[8.5rem] flex-col justify-between bg-gradient-to-br ${visual.gradient} p-4 sm:p-5`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-black/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/95 sm:text-xs">
            {programa.tipo}
          </span>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-lg backdrop-blur-sm sm:h-10 sm:w-10"
            aria-hidden="true"
          >
            {visual.accent}
          </span>
        </div>
        <h3 className="mt-3 text-sm font-bold leading-snug text-white sm:text-base line-clamp-2">
          {programa.title}
        </h3>
        {programa.promoInscripcionIncluida && (
          <span className="mt-2 inline-flex w-fit rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
            Inscripción incluida
          </span>
        )}
        {programa.featured && programa.id === "cosmica" && (
          <span className="mt-2 inline-flex w-fit rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold text-white sm:text-xs">
            Más accesible
          </span>
        )}
        {programa.featured && programa.id !== "cosmica" && !programa.promoInscripcionIncluida && (
          <span className="mt-2 inline-flex w-fit rounded-full bg-yellow/90 px-2 py-0.5 text-[10px] font-semibold text-black sm:text-xs">
            Popular
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="text-[11px] leading-relaxed text-gray line-clamp-2 sm:text-xs">
          {programa.subtitle}
        </p>
        {programa.duration && (
          <p className="mt-1 text-[10px] text-gray/75 sm:text-xs">{programa.duration}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-1.5">
              {anchor && (
                <span className="text-xs text-gray line-through">${anchor}</span>
              )}
              <span className="text-xl font-bold text-blue sm:text-2xl">${price}</span>
              <span className="text-[10px] text-gray sm:text-xs">{coin}</span>
            </div>
            <p className="text-[10px] text-gray/80 mt-0.5 line-clamp-1">{programa.priceNote}</p>
          </div>
          <span className="shrink-0 rounded-full bg-blue/10 px-2.5 py-1.5 text-[11px] font-semibold text-blue group-hover:bg-blue group-hover:text-white transition-colors min-h-[36px] inline-flex items-center">
            Ver
          </span>
        </div>
      </div>
    </>
  )

  if (isExternal) {
    return (
      <a
        href={programa.cta}
        className={cardClass}
        target="_blank"
        rel="noopener noreferrer"
      >
        {body}
      </a>
    )
  }

  return (
    <Link to={programa.cta} className={cardClass}>
      {body}
    </Link>
  )
}

/** Programas en rejilla tipo álbum (sin scroll horizontal). */
const ProgramasAlbumGrid = ({ coin, useMxn }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5">
    {PROGRAMAS_DESTACADOS.map((programa) => (
      <ProgramAlbumCard
        key={programa.id}
        programa={programa}
        coin={coin}
        useMxn={useMxn}
      />
    ))}
  </div>
)

export default ProgramasAlbumGrid
