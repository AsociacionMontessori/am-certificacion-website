import * as React from "react"
import { useEffect, useState } from "react"
import { Link } from "gatsby"
import axios from "axios"
import imagen from "../../images/banners/home.png"
import DiplomadoCountdown from "./DiplomadoCountdown"
import ProgramasAlbumGrid from "./ProgramasAlbumGrid"
import { useHeroParallax } from "../../hooks/useHeroParallax"
import {
  BENEFICIOS_HERO,
  INSCRIPCION_MARKETING,
  TRUST_BADGES,
} from "../../data/marketingPrograms"
import { WHATSAPP_INSCRIPCION_URL } from "../../data/contactoWhatsApp"
import { getLocalizedPrice, isMexico } from "../../utils/localizedPrice"

const HomeMarketingHero = () => {
  const [geo, setGeo] = useState({ countryCode: "MX", countryName: "Mexico" })
  const bgParallax = useHeroParallax(0.45)
  const titleParallax = useHeroParallax(-0.18)
  const contentParallax = useHeroParallax(-0.08)

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
    <section id="home" className="relative min-h-[92vh] flex items-end sm:items-center overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <img
          src={imagen}
          alt=""
          width="4160"
          height="6240"
          className="h-[115%] w-full object-cover will-change-transform"
          style={{ transform: `translate3d(0, ${bgParallax}px, 0)` }}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-black/50 to-black/85"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 sm:pb-16 lg:px-12 lg:pt-28">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-start">
          <div
            className="space-y-5 will-change-transform"
            style={{ transform: `translate3d(0, ${titleParallax}px, 0)` }}
          >
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

          <div
            className="space-y-4 will-change-transform"
            style={{ transform: `translate3d(0, ${contentParallax}px, 0)` }}
          >
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

        <div className="mt-10 lg:mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4 px-0.5">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white">
                Nuestros programas
              </h2>
              <p className="text-xs sm:text-sm text-white/75 mt-1 max-w-md">
                Explora la oferta en tarjetas — precios según tu país
              </p>
            </div>
            <Link
              to="/diplomados/#certificacion_internacional"
              className="shrink-0 min-h-[44px] inline-flex items-center justify-center rounded-full border border-white/35 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Comparar todos
            </Link>
          </div>
          <ProgramasAlbumGrid coin={coin} useMxn={useMxn} />
        </div>
      </div>
    </section>
  )
}

export default HomeMarketingHero
