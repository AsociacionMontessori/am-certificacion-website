import * as React from "react"
import { useEffect, useState } from "react"
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

const ProgramCard = ({ programa, coin, useMxn }) => {
  const price = useMxn ? programa.priceMx : programa.priceUsd
  const anchor = useMxn ? programa.anchorPriceMx : programa.anchorPriceUsd
  const isExternal = programa.cta.startsWith("http")

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
        {anchor && (
          <span className="text-sm text-gray line-through">${anchor}</span>
        )}
        <span className="text-2xl font-bold text-blue">${price}</span>
        <span className="text-xs text-gray mb-1">{coin}</span>
      </div>
      <p className="text-xs text-gray mt-1">{programa.priceNote}</p>
      {programa.featured && programa.id === "cosmica" && (
        <span className="inline-block mt-2 rounded-full bg-green/20 text-green text-xs font-semibold px-2 py-0.5">
          Más accesible
        </span>
      )}
      {programa.featured && programa.id !== "cosmica" && (
        <span className="inline-block mt-2 rounded-full bg-yellow/30 text-black text-xs font-semibold px-2 py-0.5">
          Popular
        </span>
      )}
    </>
  )

  const className =
    "snap-start shrink-0 w-[min(76vw,272px)] sm:w-[248px] rounded-2xl border border-white/40 bg-white/95 backdrop-blur-sm p-4 shadow-lg hover:shadow-xl hover:border-blue/40 transition-shadow"

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

        {/* Carrusel de programas — mobile-first */}
        <div className="mt-10 lg:mt-12">
          <div className="flex items-end justify-between gap-4 mb-3 px-1">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Programas disponibles
              </h2>
              <p className="text-xs sm:text-sm text-white/75">
                Desliza para ver los 6 programas — precio de programa e inscripción aclarados
              </p>
            </div>
            <Link
              to="/diplomados/#certificacion_internacional"
              className="shrink-0 text-xs sm:text-sm font-semibold text-white underline"
            >
              Comparar
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scroll-pl-4 -mx-1 px-4 scrollbar-hide">
            {PROGRAMAS_DESTACADOS.map((programa) => (
              <ProgramCard
                key={programa.id}
                programa={programa}
                coin={coin}
                useMxn={useMxn}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeMarketingHero
