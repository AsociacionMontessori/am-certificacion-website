import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Link } from "gatsby"
import axios from "axios"
import imagen from "../../images/banners/home.png"
import DiplomadoCountdown from "./DiplomadoCountdown"
import {
  BENEFICIOS_HERO,
  INSCRIPCION_MARKETING,
  PROGRAMAS_DESTACADOS,
  TRUST_BADGES,
} from "../../data/marketingPrograms"
import { WHATSAPP_INSCRIPCION_URL } from "../../data/contactoWhatsApp"
import { getLocalizedPrice, isMexico } from "../../utils/localizedPrice"

const PROGRAM_VISUALS = {
  inscripcion: {
    eyebrow: "Inicio",
    coverClass: "from-blue via-green to-yellow",
    panelClass: "bg-blue/90",
  },
  cosmica: {
    eyebrow: "Grandes Lecciones",
    coverClass: "from-red via-yellow to-green",
    panelClass: "bg-red/90",
  },
  neuro: {
    eyebrow: "Cerebro y aprendizaje",
    coverClass: "from-green via-blue to-white",
    panelClass: "bg-green/90",
  },
  taller: {
    eyebrow: "6 a 12 años",
    coverClass: "from-gray via-blue to-green",
    panelClass: "bg-gray/90",
  },
  casa: {
    eyebrow: "3 a 6 años",
    coverClass: "from-yellow via-orange to-red",
    panelClass: "bg-orange/90",
  },
  nido: {
    eyebrow: "0 a 3 años",
    coverClass: "from-green via-yellow to-white",
    panelClass: "bg-green/90",
  },
}

const getProgramVisual = (programa) =>
  PROGRAM_VISUALS[programa.id] || PROGRAM_VISUALS.inscripcion

const getProgramCtaText = (programa) =>
  programa.id === "inscripcion" ? "Pagar inscripción" : "Inscríbete y paga"

const PROGRAMAS_ALBUM = [
  ...PROGRAMAS_DESTACADOS.filter(({ id }) => id !== "neuro"),
  ...PROGRAMAS_DESTACADOS.filter(({ id }) => id === "neuro"),
]

const parsePriceAmount = (price) =>
  Number(String(price || "").replace(/,/g, "")) || 0

const getLowestProgramPrice = (tipo, useMxn) =>
  PROGRAMAS_DESTACADOS.filter((programa) => programa.tipo === tipo)
    .map((programa) => (useMxn ? programa.priceMx : programa.priceUsd))
    .filter(Boolean)
    .sort((a, b) => parsePriceAmount(a) - parsePriceAmount(b))[0] || null

const PaymentClarity = ({ coin, inscripcionPrice, useMxn }) => {
  const guiaDesde = getLowestProgramPrice("Guía", useMxn)
  const diplomadoDesde = getLowestProgramPrice("Diplomado", useMxn)

  return (
    <div className="mt-4 border-t border-white/15 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-green">
        Pagos sin sorpresas
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Qué pagas hoy</p>
          <p className="text-xs leading-relaxed text-white/75">
            Inscripción única de {" "}
            <strong className="text-white">${inscripcionPrice} {coin}</strong>. Si
            eliges inicio completo, también cubres el primer pago del programa en
            Stripe.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Qué pagas después</p>
          <p className="text-xs leading-relaxed text-white/75">
            Guías desde {" "}
            <strong className="text-white">${guiaDesde} {coin} al mes</strong> o
            diplomados cortos desde {" "}
            <strong className="text-white">${diplomadoDesde} {coin}</strong>. La
            inscripción no se repite.
          </p>
        </div>
      </div>
    </div>
  )
}

const ProgramAlbumCard = ({ programa, coin, useMxn }) => {
  const price = useMxn ? programa.priceMx : programa.priceUsd
  const anchor = useMxn ? programa.anchorPriceMx : programa.anchorPriceUsd
  const isExternal = programa.cta.startsWith("http")
  const visual = getProgramVisual(programa)
  const ctaText = getProgramCtaText(programa)

  const inner = (
    <div className="program-album-card grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-lg bg-white text-black shadow-2xl shadow-black/30 ring-1 ring-white/30 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow">
      <div className={`program-album-cover relative min-h-[176px] bg-gradient-to-br ${visual.coverClass} p-4 transition duration-200`}>
        <div className="absolute inset-y-0 left-0 w-8 bg-black/20" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start">
            <span className="rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase text-gray">
              {programa.tipo}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/90">{visual.eyebrow}</p>
            <h3 className="mt-1 max-w-[13rem] text-2xl font-bold leading-tight text-white drop-shadow-md">
              {programa.title}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex min-h-[250px] flex-col p-4">
        <div className="flex flex-col gap-2 text-xs font-semibold text-gray">
          {programa.duration && (
            <span className="inline-flex w-fit shrink-0 whitespace-nowrap rounded-md bg-blue/10 px-2.5 py-1 text-blue">
              {programa.duration}
            </span>
          )}
          <span className="leading-relaxed">{programa.subtitle}</span>
        </div>
        <div className="mt-4 flex items-end gap-2">
          {anchor && <span className="text-sm text-gray line-through">${anchor}</span>}
          <span className="text-3xl font-bold text-blue">${price}</span>
          <span className="mb-1 text-xs font-semibold text-gray">{coin}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-gray">{programa.priceNote}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {programa.featured && programa.id === "cosmica" && (
            <span className="rounded-md bg-green/20 px-2 py-1 text-xs font-semibold text-green">
              Más accesible
            </span>
          )}
          {programa.promoInscripcionIncluida && (
            <span className="rounded-md bg-green/20 px-2 py-1 text-xs font-semibold text-green">
              Inscripción incluida
            </span>
          )}
          {programa.featured && programa.id !== "cosmica" && !programa.promoInscripcionIncluida && (
            <span className="rounded-md bg-yellow/30 px-2 py-1 text-xs font-semibold text-black">
              Popular
            </span>
          )}
        </div>
        <div className="mt-auto pt-4">
          <span className={`inline-flex min-h-[40px] w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-bold text-white ${visual.panelClass}`}>
            {ctaText}
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </div>
  )

  const className =
    "program-album-link snap-start shrink-0 w-[min(82vw,310px)] sm:w-[296px]"

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

const ProgramAlbumDeck = ({ coin, useMxn }) => {
  const railRef = useRef(null)

  const scrollPrograms = (direction) => {
    const rail = railRef.current
    if (!rail) return
    const card = rail.querySelector(".program-album-link")
    const amount = card ? card.getBoundingClientRect().width + 16 : 320
    rail.scrollBy({ left: direction * amount, behavior: "smooth" })
  }

  return (
    <div className="mt-10 lg:mt-12">
      <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-green">
            Catálogo de formación
          </p>
          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
            Programas disponibles
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/75">
            Recorre las portadas y compara el inicio de cada programa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollPrograms(-1)}
            className="min-h-[40px] rounded-lg border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20"
            aria-label="Ver programas anteriores"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollPrograms(1)}
            className="min-h-[40px] rounded-lg border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20"
            aria-label="Ver programas siguientes"
          >
            →
          </button>
          <Link
            to="/diplomados/#certificacion_internacional"
            className="min-h-[40px] rounded-lg bg-white px-3 py-2 text-sm font-bold text-blue transition hover:bg-white/90"
          >
            Comparar
          </Link>
        </div>
      </div>
      <div
        ref={railRef}
        className="program-album-rail -mx-4 flex gap-4 overflow-x-auto px-4 pb-5 pt-1 snap-x snap-mandatory scroll-smooth sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        aria-label="Programas disponibles"
      >
        {PROGRAMAS_ALBUM.map((programa) => (
          <ProgramAlbumCard
            key={programa.id}
            programa={programa}
            coin={coin}
            useMxn={useMxn}
          />
        ))}
      </div>
    </div>
  )
}


const HomeMarketingHero = () => {
  const [geo, setGeo] = useState({ countryCode: "MX", countryName: "Mexico" })

  useEffect(() => {
    axios
      .get("https://ipapi.co/json/")
      .then((response) => {
        const data = response.data
        setGeo({
          countryCode: (data.country_code || "MX").toUpperCase(),
          countryName: data.country_name || "Mexico",
        })
      })
      .catch(() => {
        setGeo({ countryCode: "MX", countryName: "Mexico" })
      })
  }, [])

  const useMxn = isMexico(geo)
  const { coin, price: inscripcionPrice } = getLocalizedPrice(
    geo,
    INSCRIPCION_MARKETING.priceMx,
    INSCRIPCION_MARKETING.priceUsd
  )
  const anchorInscripcion = useMxn
    ? INSCRIPCION_MARKETING.anchorPriceMx
    : INSCRIPCION_MARKETING.anchorPriceUsd

  return (
    <section id="home" className="relative min-h-[92vh] flex items-end sm:items-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-gradient-to-b from-black/30 via-black/50 to-black/75"
      />
      <img
        src={imagen}
        className="absolute inset-0 h-full w-full object-cover"
        alt="Formación Montessori en línea"
        width="4160"
        height="6240"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 sm:pb-16 lg:px-12 lg:pt-28">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-start">
          {/* Columna principal — mensaje de marketing */}
          <div className="space-y-5">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-green font-semibold">
              Certificación internacional • Guía Montessori
            </p>
            <h1 className="text-3xl font-bold text-white sm:text-5xl lg:text-6xl leading-tight">
              Conviértete en Guía Montessori{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue to-green">
                100% en línea
              </span>
            </h1>
            <p className="text-base sm:text-lg text-white/90 max-w-xl leading-relaxed">
              Diplomados con validez internacional, a tu ritmo y con acompañamiento de
              especialistas. Inscríbete hoy y aparta tu lugar en el próximo ciclo.
            </p>

            <ul className="flex flex-wrap gap-2">
              {TRUST_BADGES.map((badge) => (
                <li
                  key={badge}
                  className="rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs text-white border border-white/20"
                >
                  ✓ {badge}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link
                to="/inscripcion/pagar"
                className="min-h-[48px] inline-flex items-center justify-center px-8 py-3 rounded-full font-bold text-white bg-gradient-to-r from-blue to-green shadow-lg hover:scale-[1.02] transition-transform text-center"
              >
                Inscríbete ahora
              </Link>
              <a
                href={WHATSAPP_INSCRIPCION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white border-2 border-green/70 bg-green/25 backdrop-blur-sm hover:bg-green/40 transition-colors text-center gap-2"
                aria-label="Habla con nosotros por WhatsApp; te guiamos paso a paso en tu inscripción"
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  💬
                </span>
                <span className="flex flex-col items-start text-left leading-tight sm:items-center sm:text-center">
                  <span className="text-sm sm:text-base">WhatsApp: te guiamos</span>
                  <span className="text-xs font-normal text-white/85">
                    Paso a paso en tu inscripción
                  </span>
                </span>
              </a>
            </div>
            <Link
              to="/diplomados"
              className="inline-block text-sm text-white/90 underline underline-offset-4 hover:text-white"
            >
              Ver todos los programas y precios →
            </Link>
          </div>

          {/* Columna oferta + countdown */}
          <div className="space-y-4">
            <article className="rounded-3xl border-2 border-white/30 bg-black/45 backdrop-blur-lg p-5 sm:p-6 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-yellow mb-1">
                {INSCRIPCION_MARKETING.badge}
              </p>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Próximo diplomado en línea
              </h2>
              <p className="text-sm text-white/85 mt-1 mb-4">
                Transforma la manera en que acompañas a niñas y niños.
              </p>

              <DiplomadoCountdown variant="dark" />

              <div className="mt-5 rounded-2xl bg-gradient-to-r from-green/25 to-blue/25 border border-white/20 p-4">
                <p className="text-xs text-white/90 mb-1">Inscripción + acceso al portal</p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-lg text-white/60 line-through">${anchorInscripcion}</span>
                  <span className="text-4xl font-bold text-white">${inscripcionPrice}</span>
                  <span className="text-sm text-white/80">{coin}</span>
                </div>
                <p className="text-xs text-white/75 mt-2">
                  {INSCRIPCION_MARKETING.beneficioUnica}. Colegiaturas según el programa que elijas.
                </p>
              </div>

              <PaymentClarity
                coin={coin}
                inscripcionPrice={inscripcionPrice}
                useMxn={useMxn}
              />

              <div className="mt-4 grid grid-cols-2 gap-2">
                {BENEFICIOS_HERO.slice(0, 4).map((b) => (
                  <div
                    key={b.title}
                    className="rounded-xl bg-white/5 border border-white/10 p-2.5"
                  >
                    <span className="text-lg">{b.icon}</span>
                    <p className="text-xs font-semibold text-white mt-0.5">{b.title}</p>
                    <p className="text-[11px] text-white/70 leading-snug">{b.text}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        <ProgramAlbumDeck coin={coin} useMxn={useMxn} />
      </div>
    </section>
  )
}

export default HomeMarketingHero
