import React, { useState, useEffect } from "react"
import { Link } from "gatsby"

import Card from "./cards/card"
import CardInscription from "./cards/inscriptionCard"
import CardCertification from "./cards/cardCertification"
import axios from "axios"
import ProgramCheckoutLink from "./checkout/ProgramCheckoutLink"
import { useTranslation, Trans } from "react-i18next"
import { useLocalization } from "../i18n"
import {
  INSCRIPCION_MARKETING_COPY,
  PROGRAMAS_OFERTA,
} from "../data/programasOferta"
import { getProgramLandingRoute } from "../data/programLandingRoutes"

const CertificationPrice = () => {
  const { t } = useTranslation(["diplomados", "programs"])
  const { localizedPath } = useLocalization()
  const [state, setState] = useState({
    ip: "",
    countryName: "",
    countryCode: "",
    city: "",
  })

  const isMexico = state => {
    const { countryCode, countryName } = state
    if (
      countryCode === "MX" ||
      countryName === "Mexico" ||
      countryName === "México"
    )
      return true
    if (!countryCode && !countryName) return true
    return false
  }

  const getLocalizedPrice = (state, priceData) => {
    const useMxn = isMexico(state)
    const coin = useMxn ? "MXN" : "USD"
    const priceToShow = useMxn ? priceData.priceMx : priceData.priceUsd
    return { coin, priceToShow }
  }

  const getGeoInfo = () => {
    axios
      .get("https://ipapi.co/json/")
      .then(response => {
        const data = response.data
        setState(prevState => ({
          ...prevState,
          ip: data.ip,
          countryName: data.country_name || "",
          countryCode: (data.country_code || "").toUpperCase(),
          city: data.city,
        }))
      })
      .catch(() => {
        setState(prevState => ({
          ...prevState,
          countryCode: "MX",
          countryName: "Mexico",
        }))
      })
  }

  useEffect(() => {
    getGeoInfo()
  }, [])

  const guias = PROGRAMAS_OFERTA.filter(p => p.tipo === "guia")
  const neuro = PROGRAMAS_OFERTA.find(p => p.id === "neuro")
  const cosmica = PROGRAMAS_OFERTA.find(p => p.id === "cosmica")

  const certificado = {
    cardType: "certification",
    title: t("precios.certificado.titulo"),
    subtitle: t("precios.certificado.subtitulo"),
    priceMx: "2,700",
    priceUsd: "150",
    text: "",
    time: null,
    paymentNote: t("precios.certificado.pagoUnico"),
    footer: t("precios.certificado.footer"),
  }

  const montoInscripcion = t("programas.inscripcion.textoMonto", {
    defaultValue: INSCRIPCION_MARKETING_COPY.textoMonto,
  })

  const allCards = [
    ...guias.map(p => ({
      cardType: "monthly",
      programaId: p.id,
      title: t(`programas.${p.id}.cardTitle`, { defaultValue: p.cardTitle }),
      subtitle: t(`programas.${p.id}.cardSubtitle`, {
        defaultValue: p.cardSubtitle,
      }),
      priceMx: p.priceMx,
      priceUsd: p.priceUsd,
      text: t("precios.colegiaturaMensual"),
      duration: t(`programas.${p.id}.duration`, { defaultValue: p.duration }),
      footnote: t(`programas.${p.id}.priceNote`, { defaultValue: p.priceNote }),
    })),
    {
      cardType: "certification",
      programaId: neuro.id,
      title: t("programas.neuro.cardTitle", { defaultValue: neuro.cardTitle }),
      subtitle: t("programas.neuro.cardSubtitle", {
        defaultValue: neuro.cardSubtitle,
      }),
      priceMx: neuro.priceMx,
      priceUsd: neuro.priceUsd,
      text: "",
      time: t("programas.neuro.duration", { defaultValue: neuro.duration }),
      paymentNote: t("programas.neuro.paymentNote", {
        defaultValue: neuro.paymentNote,
      }),
      footer: neuro.promoInscripcionIncluida
        ? t("precios.inscripcionIncluida")
        : t("precios.inscripcionAparte", { monto: montoInscripcion }),
    },
    {
      cardType: "certification",
      programaId: cosmica.id,
      title: t("programas.cosmica.cardTitle", {
        defaultValue: cosmica.cardTitle,
      }),
      subtitle: t("programas.cosmica.cardSubtitle", {
        defaultValue: cosmica.cardSubtitle,
      }),
      priceMx: cosmica.priceMx,
      priceUsd: cosmica.priceUsd,
      text: "",
      time: t("programas.cosmica.duration", { defaultValue: cosmica.duration }),
      paymentNote: t("programas.cosmica.paymentNote", {
        defaultValue: cosmica.paymentNote,
      }),
      footer: t("precios.inscripcionAparte", { monto: montoInscripcion }),
    },
    { ...certificado, programaId: null },
  ]

  const inscripcion = {
    title: t("programas.inscripcion.titulo", {
      defaultValue: INSCRIPCION_MARKETING_COPY.titulo,
    }),
    subtitle: t("programas.inscripcion.subtitulo", {
      defaultValue: INSCRIPCION_MARKETING_COPY.subtitulo,
    }),
    priceMx: PROGRAMAS_OFERTA.find(p => p.id === "inscripcion").priceMx,
    priceUsd: PROGRAMAS_OFERTA.find(p => p.id === "inscripcion").priceUsd,
    text: montoInscripcion,
    badge: t("programas.inscripcion.beneficio", {
      defaultValue: INSCRIPCION_MARKETING_COPY.beneficio,
    }),
  }

  return (
    <>
      <section
        id="certificacion_internacional"
        className="relative py-5 z-10 bg-gradient-to-r from-blue to-green"
      >
        <h2 className="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0">
          <span className="text-white text-2xl md:text-6xl font-bold">
            {t("precios.tituloSeccion")}
          </span>
        </h2>
        <section
          id="prices"
          className="relative z-10 mb-10 px-4 sm:mx-auto max-w-7xl sm:px-6 lg:px-12 xl:px-6 2xl:px-0 mt-6 lg:mt-8"
        >
          <div className="flex flex-col-reverse gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-8 xl:gap-x-10 lg:items-start">
            <div className="min-w-0 space-y-8 lg:col-start-1">
              <div className="bg-white rounded-3xl px-6 py-8 sm:px-8 max-w-3xl">
                <h3>
                  <span className="text-red md:text-2xl text-xl">
                    {t("precios.kicker")}
                  </span>
                </h3>
                <h2 className="mt-5">
                  <span className="font-medium text-black md:text-6xl text-3xl">
                    {t("precios.titulo")}
                  </span>
                </h2>
                <p className="mt-6 text-base sm:text-lg text-black leading-relaxed">
                  {t("precios.descripcion")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 gap-y-10 justify-items-center">
                {allCards.map(item => {
                  const { coin, priceToShow } = getLocalizedPrice(state, item)
                  const wrapperClass = "w-full flex justify-center"
                  const cardKey = item.programaId || item.title
                  const detailRoute = item.programaId
                    ? getProgramLandingRoute(item.programaId)
                    : null
                  const detailPath = detailRoute
                    ? localizedPath(`/diplomados/${detailRoute.slug}/`)
                    : null
                  const detailLabel = detailRoute
                    ? t("programs:common.detailsFor", { program: item.title })
                    : ""

                  if (item.cardType === "certification") {
                    return (
                      <div className={wrapperClass} key={cardKey}>
                        <div className="flex w-full max-w-[14rem] flex-col items-center gap-3">
                          {detailPath ? (
                            <Link
                              to={detailPath}
                              aria-label={detailLabel}
                              className="group block rounded-3xl transition duration-150 ease-in-out hover:scale-[1.02] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                            >
                              <CardCertification
                                title={item.title}
                                subtitle={item.subtitle}
                                coin={coin}
                                price={priceToShow}
                                text={item.text}
                                time={item.time}
                                footer={item.footer}
                                paymentNote={item.paymentNote}
                              />
                              <span className="mt-2 block text-center text-sm font-bold text-white underline decoration-white/50 underline-offset-4 group-hover:decoration-white">
                                {t("programs:common.details")} →
                              </span>
                            </Link>
                          ) : (
                            <CardCertification
                              title={item.title}
                              subtitle={item.subtitle}
                              coin={coin}
                              price={priceToShow}
                              text={item.text}
                              time={item.time}
                              footer={item.footer}
                              paymentNote={item.paymentNote}
                            />
                          )}
                          {item.programaId && (
                            <ProgramCheckoutLink
                              programaId={item.programaId}
                              title={item.title}
                              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-white/80 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-white hover:text-blue"
                            >
                              {t("programs:common.checkout")}
                            </ProgramCheckoutLink>
                          )}
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div className={wrapperClass} key={cardKey}>
                      <div className="flex w-full max-w-[14rem] flex-col items-center gap-3">
                        <Link
                          to={detailPath}
                          aria-label={detailLabel}
                          className="group block rounded-3xl transition duration-150 ease-in-out hover:scale-[1.02] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                        >
                          <Card
                            title={item.title}
                            subtitle={item.subtitle}
                            coin={coin}
                            price={priceToShow}
                            text={item.text}
                            time={item.duration}
                          />
                          <span className="mt-2 block text-center text-sm font-bold text-white underline decoration-white/50 underline-offset-4 group-hover:decoration-white">
                            {t("programs:common.details")} →
                          </span>
                        </Link>
                        <ProgramCheckoutLink
                          programaId={item.programaId}
                          title={item.title}
                          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-white/80 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-white hover:text-blue"
                        >
                          {t("programs:common.checkout")}
                        </ProgramCheckoutLink>
                        {item.footnote && (
                          <p className="text-xs text-white/90 text-center max-w-[14rem] leading-relaxed px-2">
                            {item.footnote}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mx-auto max-w-3xl rounded-2xl border-2 border-white/40 bg-white/10 px-6 py-5 backdrop-blur-sm">
                <p className="text-center text-white text-sm leading-relaxed md:text-base">
                  <Trans
                    i18nKey="precios.multiNivel"
                    ns="diplomados"
                    components={{ fuerte: <span className="font-semibold" /> }}
                  />
                </p>
              </div>
              <p className="text-white md:text-sm text-xs text-center sm:text-left">
                {t("precios.terminos")}
              </p>
            </div>

            <div className="flex justify-center lg:col-start-2 lg:row-start-1 lg:justify-end lg:sticky lg:top-24 z-20 shrink-0">
              <div className="w-full max-w-sm shadow-2xl rounded-3xl ring-2 ring-white/50 lg:w-72 xl:w-80">
                {(() => {
                  const { coin, priceToShow } = getLocalizedPrice(
                    state,
                    inscripcion
                  )
                  return (
                    <CardInscription
                      title={inscripcion.title}
                      subtitle={inscripcion.subtitle}
                      coin={coin}
                      price={priceToShow}
                      text={inscripcion.text}
                      badge={inscripcion.badge}
                    />
                  )
                })()}
              </div>
            </div>
          </div>
        </section>
      </section>
    </>
  )
}

export default CertificationPrice
