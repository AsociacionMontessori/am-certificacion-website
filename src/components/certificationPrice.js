import React, { useState, useEffect } from "react"

import Card from "./cards/card"
import CardInscription from "./cards/inscriptionCard"
import CardCertification from "./cards/cardCertification"
import axios from "axios"

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
            .catch(error => {
                console.error(error)
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

    // Orden: Nido, Casa de Niños, Taller, Neuroeducación, Grandes Lecciones, Certificado (filas de 3 en pantallas anchas)
    const prices = [
        {
            cardType: "monthly",
            title: "Nido y Comunidad Infantil",
            subtitle: "Certifícate como guía Montessori",
            priceMx: "3,100",
            priceUsd: "170",
            text: "Colegiatura mensual",
            duration: "16 meses",
        },
        {
            cardType: "monthly",
            title: "Casa de Niños",
            subtitle: "Certifícate como guía Montessori",
            priceMx: "3,500",
            priceUsd: "195",
            text: "Colegiatura mensual",
            duration: "17 meses",
        },
        {
            cardType: "monthly",
            title: "Taller",
            subtitle: "Certifícate como guía Montessori",
            priceMx: "3,900",
            priceUsd: "220",
            text: "Colegiatura mensual",
            duration: "20 meses",
        },
    ]

    const neuroeducacion = {
        cardType: "certification",
        title: "Neuroeducación",
        subtitle: "Diplomado en línea. A tu ritmo.",
        priceMx: "4,500",
        priceUsd: "250",
        text: "",
        time: "3 meses",
        footer: null,
    }

    const grandesLecciones = {
        cardType: "certification",
        title: "Grandes Lecciones",
        subtitle: "Curso en línea. Las cinco grandes lecciones Montessori para enriquecer tu práctica.",
        priceMx: "2,800",
        priceUsd: "155",
        text: "",
        time: "2 meses",
        footer: "100% en línea",
    }

    const certificado = {
        cardType: "certification",
        title: "Certificado",
        subtitle: "Diploma físico con sellos y firmas oficiales, validado con código QR y folio único.",
        priceMx: "2,700",
        priceUsd: "150",
        text: "",
        time: null,
        footer: "+ gastos de envío",
    }

    const allCards = [...prices, neuroeducacion, grandesLecciones, certificado]

    const inscripcion = [
        {
            title: "Inscripción",
            subtitle: "Da el primer paso. Después, colegiaturas mensuales según el programa que elijas.",
            priceMx: "4,900",
            priceUsd: "270",
            text: "Monto inicial",
        },
    ]
    return (
        <>
            <section
                id="certificacion_internacional"
                className="relative py-5 z-10  bg-gradient-to-r from-blue to-green"
            >
                <h2 className="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0">
                    <span className="text-white text-2xl md:text-6xl font-bold">
                        Certificación Montessori
                    </span>
                </h2>
                <div className="bg-white rounded-3xl">
                    <div className="sm:flex sm:mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0">
                        <div className="w-full md:2/4 w-3/4 md:relative md:block md:flex sm:flex-col ">
                            <h3>
                                <span className="text-red md:text-2xl text-xl selection:text-white selection:bg-red selection:bg-opacity-40">
                                    Certificación internacional
                                </span>
                            </h3>
                            <h2 className="mt-5">
                                <span className="font-medium text-black md:text-6xl text-3xl selection:text-white selection:bg-red selection:bg-opacity-40">
                                    Guía Montessori
                                </span>
                            </h2>
                            <div className="w-full sm:w-3/4 sm:pt-10 md:pr-24 text-lg text-black selection:text-white selection:bg-red selection:bg-opacity-40">
                                <p>
                                    Ofrecemos programas de certificación con reconocimiento internacional, diseñados para proporcionar una sólida base en el método y la filosofía Montessori.
                                    <br />
                                    <br />
                                    Ya sea que busques una introducción a Montessori o desees profundizar tu conocimiento y práctica, <a className="text-red" href="../diplomados/">tenemos el programa adecuado para ti.</a>
                                    <br />
                                    <br />
                                    <br />
                                    <span className="text-gray text-sm">Aplican términos y condiciones *</span>
                                </p>
                            </div>
                        </div>
                        <div className="pb-5 my-10 sm:my-0 max-h-128 outline outline-offset-2 outline-blue sm:outline-none sm:flex sm:flex-end items-center justify-center bg-white rounded-3xl sm:absolute sm:left-1/2 sm:translate-x-52 lg:translate-x-52 xl:translate-x-80 transform 2xl:translate-x-96 md:translate-y-[-5rem] lg:translate-y-[-4rem] md:h-[36rem] lg:h-[32rem]">
                            {inscripcion.map((price, index) => {
                                const { title, subtitle, text } = price;
                                const { coin, priceToShow } = getLocalizedPrice(state, price);
                                return (
                                    <CardInscription
                                        key={index}
                                        title={title}
                                        subtitle={subtitle}
                                        coin={coin}
                                        price={priceToShow}
                                        text={text}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
                <section id="prices" className="mt-24 mb-10 px-4 sm:mx-auto max-w-7xl px-6 lg:px-12 xl:px-6 2xl:px-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center selection:bg-blue selection:text-black">
                        {allCards.map((item, index) => {
                            const { coin, priceToShow } = getLocalizedPrice(state, item)
                            const wrapperClass = "py-3 sm:pt-0 xl:m-10 lg:m-5 md:m-2 sm:m-1"
                            if (item.cardType === "certification") {
                                return (
                                    <div className={wrapperClass} key={index}>
                                        <CardCertification
                                            title={item.title}
                                            subtitle={item.subtitle}
                                            coin={coin}
                                            price={priceToShow}
                                            text={item.text}
                                            time={item.time}
                                            footer={item.footer}
                                        />
                                    </div>
                                )
                            }
                            return (
                                <div className={wrapperClass} key={index}>
                                    <Card
                                        title={item.title}
                                        subtitle={item.subtitle}
                                        coin={coin}
                                        price={priceToShow}
                                        text={item.text}
                                        time={item.duration}
                                    />
                                </div>
                            )
                        })}
                    </div>
                    <div className="mt-10 mx-auto max-w-3xl rounded-2xl border-2 border-white/40 bg-white/10 px-6 py-5 backdrop-blur-sm">
                        <p className="text-center text-white text-sm leading-relaxed md:text-base">
                            <span className="font-semibold">¿Vas por más de un nivel?</span> Si ya cursaste Nido y Comunidad Infantil o Casa de Niños, puedes revalidar el tronco común: el siguiente diplomado se reduce aproximadamente 11 meses (por ejemplo, Casa de Niños pasa de 17 a 6 meses). Además, no volvemos a cobrarte inscripción cuando ya terminaste un nivel con nosotros.
                        </p>
                    </div>
                    <p className="mt-6 text-white md:text-sm text-xs md:text-left xl:ml-12 lg:ml-10 md:ml-6 sm:ml-2">
                        Precios sujetos a disponibilidad. Aplican Términos y Condiciones.
                    </p>
                </section>
            </section>
        </>
    )
}

export default CertificationPrice
