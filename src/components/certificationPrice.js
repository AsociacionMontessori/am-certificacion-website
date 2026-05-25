import React, { useState, useEffect } from "react"

import Card from "./cards/card"
import CardInscription from "./cards/inscriptionCard"
import CardCertification from "./cards/cardCertification"
import axios from "axios"
import { INSCRIPCION_MARKETING_COPY, PROGRAMAS_OFERTA } from "../data/programasOferta"

const CertificationPrice = () => {
    const [state, setState] = useState({
        ip: "",
        countryName: "",
        countryCode: "",
        city: "",
    })

    const isMexico = (state) => {
        const { countryCode, countryName } = state
        if (countryCode === "MX" || countryName === "Mexico" || countryName === "México") return true
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

    const guias = PROGRAMAS_OFERTA.filter((p) => p.tipo === "guia")
    const neuro = PROGRAMAS_OFERTA.find((p) => p.id === "neuro")
    const cosmica = PROGRAMAS_OFERTA.find((p) => p.id === "cosmica")

    const certificado = {
        cardType: "certification",
        title: "Certificado",
        subtitle: "Diploma físico con sellos y firmas oficiales, validado con código QR y folio único.",
        priceMx: "2,700",
        priceUsd: "150",
        text: "",
        time: null,
        paymentNote: "pago único",
        footer: "+ gastos de envío",
    }

    const allCards = [
        ...guias.map((p) => ({
            cardType: "monthly",
            title: p.cardTitle,
            subtitle: p.cardSubtitle,
            priceMx: p.priceMx,
            priceUsd: p.priceUsd,
            text: "Colegiatura mensual",
            duration: p.duration,
            footnote: p.priceNote,
        })),
        {
            cardType: "certification",
            title: neuro.cardTitle,
            subtitle: neuro.cardSubtitle,
            priceMx: neuro.priceMx,
            priceUsd: neuro.priceUsd,
            text: "",
            time: neuro.duration,
            paymentNote: neuro.paymentNote,
            footer: `Inscripción aparte (${INSCRIPCION_MARKETING_COPY.textoMonto})`,
        },
        {
            cardType: "certification",
            title: cosmica.cardTitle,
            subtitle: cosmica.cardSubtitle,
            priceMx: cosmica.priceMx,
            priceUsd: cosmica.priceUsd,
            text: "",
            time: cosmica.duration,
            paymentNote: cosmica.paymentNote,
            footer: `Inscripción aparte (${INSCRIPCION_MARKETING_COPY.textoMonto})`,
        },
        certificado,
    ]

    const inscripcion = {
        title: INSCRIPCION_MARKETING_COPY.titulo,
        subtitle: INSCRIPCION_MARKETING_COPY.subtitulo,
        priceMx: PROGRAMAS_OFERTA.find((p) => p.id === "inscripcion").priceMx,
        priceUsd: PROGRAMAS_OFERTA.find((p) => p.id === "inscripcion").priceUsd,
        text: INSCRIPCION_MARKETING_COPY.textoMonto,
        badge: INSCRIPCION_MARKETING_COPY.beneficio,
    }

    return (
        <>
            <section
                id="certificacion_internacional"
                className="relative py-5 z-10 bg-gradient-to-r from-blue to-green"
            >
                <h2 className="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0">
                    <span className="text-white text-2xl md:text-6xl font-bold">
                        Certificación Montessori
                    </span>
                </h2>
                <div className="bg-white rounded-3xl mx-4 sm:mx-6 lg:mx-auto max-w-7xl">
                    <div className="px-6 pb-8 pt-10 lg:px-12 xl:px-6 2xl:px-0 max-w-3xl">
                        <h3>
                            <span className="text-red md:text-2xl text-xl">
                                Certificación internacional
                            </span>
                        </h3>
                        <h2 className="mt-5">
                            <span className="font-medium text-black md:text-6xl text-3xl">
                                Guía Montessori
                            </span>
                        </h2>
                        <p className="mt-6 text-base sm:text-lg text-black leading-relaxed">
                            Programas con reconocimiento internacional. Los precios de programa
                            (colegiatura o diplomado) son independientes de la inscripción, que solo
                            se paga una vez.
                        </p>
                    </div>
                </div>

                <section id="prices" className="mt-8 mb-10 px-4 sm:mx-auto max-w-7xl sm:px-6 lg:px-12 xl:px-6 2xl:px-0">
                    <div className="flex justify-center mb-10 px-2">
                        {(() => {
                            const { coin, priceToShow } = getLocalizedPrice(state, inscripcion)
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-10 justify-items-center">
                        {allCards.map((item, index) => {
                            const { coin, priceToShow } = getLocalizedPrice(state, item)
                            const wrapperClass = "w-full flex justify-center"
                            if (item.cardType === "certification") {
                                return (
                                    <div className={wrapperClass} key={item.title}>
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
                                    </div>
                                )
                            }
                            return (
                                <div className={wrapperClass} key={item.title}>
                                    <div className="space-y-2 flex flex-col items-center">
                                        <Card
                                            title={item.title}
                                            subtitle={item.subtitle}
                                            coin={coin}
                                            price={priceToShow}
                                            text={item.text}
                                            time={item.duration}
                                        />
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
                    <div className="mt-10 mx-auto max-w-3xl rounded-2xl border-2 border-white/40 bg-white/10 px-6 py-5 backdrop-blur-sm">
                        <p className="text-center text-white text-sm leading-relaxed md:text-base">
                            <span className="font-semibold">¿Vas por más de un nivel?</span> Si ya
                            cursaste Nido y Comunidad Infantil o Casa de Niños, puedes revalidar el
                            tronco común: el siguiente diplomado se reduce aproximadamente 11 meses.
                            Además,{" "}
                            <span className="font-semibold">
                                no volvemos a cobrarte inscripción
                            </span>{" "}
                            cuando ya terminaste un nivel con nosotros o si tomas otro programa
                            después.
                        </p>
                    </div>
                    <p className="mt-6 text-white md:text-sm text-xs text-center sm:text-left">
                        Precios sujetos a disponibilidad. Aplican Términos y Condiciones.
                    </p>
                </section>
            </section>
        </>
    )
}

export default CertificationPrice
