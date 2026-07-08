import { StaticImage } from "gatsby-plugin-image"
import React, { useEffect, useState } from "react"
import axios from "axios"
import { useTranslation } from "react-i18next"

/** Clave i18n de la fecha (calendario.fechas.<aaaa-mm-dd> en el namespace "diplomados"). */
const getFechaKey = (item) => `calendario.fechas.${item.date.toISOString().slice(0, 10)}`

export const DIPLOMADOS_EN_LINEA = [
    // Ciclo 2025–2026
    { date: new Date("2025-11-29T08:00:00-06:00"), label: "29 de noviembre 2025" },
    { date: new Date("2026-01-24T08:00:00-06:00"), label: "24 de enero 2026" },
    { date: new Date("2026-02-28T08:00:00-06:00"), label: "28 de febrero 2026" },
    { date: new Date("2026-04-25T08:00:00-06:00"), label: "25 de abril 2026" },
    { date: new Date("2026-05-30T08:00:00-06:00"), label: "30 de mayo 2026" },
    { date: new Date("2026-06-27T08:00:00-06:00"), label: "27 de junio 2026" },
    { date: new Date("2026-08-29T08:00:00-06:00"), label: "29 de agosto 2026" },
    { date: new Date("2026-09-26T08:00:00-06:00"), label: "26 de septiembre 2026" },
    { date: new Date("2026-10-24T08:00:00-06:00"), label: "24 de octubre 2026" },
    { date: new Date("2026-11-28T08:00:00-06:00"), label: "28 de noviembre 2026" },
]

const MS_SECOND = 1000
const MS_MINUTE = 60 * MS_SECOND
const MS_HOUR = 60 * MS_MINUTE
const MS_DAY = 24 * MS_HOUR

export const getNextItem = (items) => {
    const now = Date.now()
    return items.find((item) => item.date.getTime() > now) || null
}

const getTimeParts = (diffMs) => {
    const days = Math.floor(diffMs / MS_DAY)
    const hours = Math.floor((diffMs % MS_DAY) / MS_HOUR)
    const minutes = Math.floor((diffMs % MS_HOUR) / MS_MINUTE)
    const seconds = Math.floor((diffMs % MS_MINUTE) / MS_SECOND)
    return { days, hours, minutes, seconds }
}

const isMexico = (geo) => {
    const { countryCode, countryName } = geo
    if (countryCode === "MX" || countryName === "Mexico" || countryName === "México") return true
    if (!countryCode && !countryName) return true
    return false
}

const getLocalizedPrice = (geoState) => {
    const useMxn = isMexico(geoState)
    const coin = useMxn ? "MXN" : "USD"
    const priceToShow = useMxn ? "4,500" : "250"
    return { coin, priceToShow }
}

const DiplomadoCountdown = () => {
    const { t } = useTranslation("diplomados")
    const [state, setState] = useState({
        status: "loading", // loading | noMore | live | upcoming
        next: null,
        diff: 0,
    })

    useEffect(() => {
        const update = () => {
            const next = getNextItem(DIPLOMADOS_EN_LINEA)
            if (!next) {
                setState({ status: "noMore", next: null, diff: 0 })
                return
            }
            const now = Date.now()
            const diff = next.date.getTime() - now
            if (diff <= 0) {
                setState({ status: "live", next, diff: 0 })
            } else {
                setState({ status: "upcoming", next, diff })
            }
        }

        update()
        const id = setInterval(update, 1000)
        return () => clearInterval(id)
    }, [])

    if (state.status === "loading") {
        return (
            <p className="text-sm text-white/80 sm:text-base md:text-lg">
                {t("proximo.calculando")}
            </p>
        )
    }

    if (state.status === "noMore") {
        return (
            <p className="text-sm text-white sm:text-base md:text-lg">
                {t("proximo.cierre.titulo")}
                <br className="hidden sm:block" />
                <span className="text-xs text-slate-200 sm:text-sm">
                    {t("proximo.cierre.subtitulo")}
                </span>
            </p>
        )
    }

    if (state.status === "live") {
        return (
            <p className="text-sm text-white sm:text-base md:text-lg">
                {t("proximo.envivo.texto")}{" "}
                <a
                    href="https://youtube.com/live/1LVgUc94Z2k?feature=share"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-blue/60 hover:text-blue-100"
                >
                    {t("proximo.envivo.link")}
                </a>
            </p>
        )
    }

    const { days, hours, minutes } = getTimeParts(state.diff)
    const isUrgent = days <= 7 // Urgencia cuando quedan 7 días o menos
    return (
        <div className="space-y-4">
            {/* Badge de urgencia */}
            {isUrgent && (
                <div className="inline-flex items-center gap-2 rounded-full bg-red/90 px-4 py-1.5 text-xs font-bold text-white shadow-lg animate-pulse sm:text-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                    </span>
                    {t("proximo.urgencia")}
                </div>
            )}

            {/* Fecha destacada */}
            <div>
                <p className="text-sm text-white/90 sm:text-base md:text-lg">
                    <span className="font-semibold text-white">
                        {t("proximo.iniciamos")}{" "}
                    </span>
                    {state.next && (
                        <span className="inline-block rounded-lg bg-gradient-to-r from-blue/90 to-green/90 px-3 py-1.5 text-sm font-bold text-white shadow-lg sm:text-base">
                            {t(getFechaKey(state.next), { defaultValue: state.next.label })}
                        </span>
                    )}
                </p>
            </div>

            {/* Contador visual mejorado */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-sm font-medium text-white/90 sm:text-base">{t("proximo.faltan")}</span>
                {days > 0 && (
                    <div className="flex flex-col items-center rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm sm:px-4 sm:py-3">
                        <span className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">{days}</span>
                        <span className="text-xs text-white/80 sm:text-sm">{days !== 1 ? t("proximo.dias") : t("proximo.dia")}</span>
                    </div>
                )}
                {hours > 0 && (
                    <div className="flex flex-col items-center rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm sm:px-4 sm:py-3">
                        <span className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">{hours}</span>
                        <span className="text-xs text-white/80 sm:text-sm">{hours !== 1 ? t("proximo.horas") : t("proximo.hora")}</span>
                    </div>
                )}
                {days <= 0 && hours <= 0 && (
                    <div className="flex flex-col items-center rounded-lg bg-red/80 px-3 py-2 backdrop-blur-sm sm:px-4 sm:py-3">
                        <span className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">{t("proximo.ya")}</span>
                        <span className="text-xs text-white/80 sm:text-sm">{t("proximo.iniciaPronto")}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

const NextCourse = () => {
    const { t } = useTranslation("diplomados")
    const [geoState, setGeoState] = useState({
        ip: "",
        countryName: "",
        countryCode: "",
        city: "",
    })

    const getGeoInfo = () => {
        axios
            .get("https://ipapi.co/json/")
            .then(response => {
                const data = response.data
                setGeoState(prevState => ({
                    ...prevState,
                    ip: data.ip,
                    countryName: data.country_name || "",
                    countryCode: (data.country_code || "").toUpperCase(),
                    city: data.city,
                }))
            })
            .catch(error => {
                console.error(error)
                setGeoState(prevState => ({
                    ...prevState,
                    countryCode: "MX",
                    countryName: "Mexico",
                }))
            })
    }

    useEffect(() => {
        getGeoInfo()
    }, [])

    const { coin, priceToShow } = getLocalizedPrice(geoState)

    return (
        <>
            <div className="pb-10 lg:pb-10">
                {/* Título mejorado */}
                <div className="py-2">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-white text-2xl font-bold sm:text-3xl md:text-4xl">
                            {t("proximo.titulo")}
                        </span>
                    </div>
                    <span className="block text-base font-medium text-white/95 sm:text-lg md:text-xl">
                        {t("proximo.subtitulo")}
                    </span>
                </div>

                <div className="mb-4 rounded-xl border border-green/30 bg-gradient-to-r from-green/20 to-blue/20 p-4 shadow-lg">
                    <p className="mb-1 text-xs text-white/90 sm:text-sm md:text-base">
                        {t("proximo.neuro.cta")}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">${priceToShow}</span>
                        <span className="text-sm text-white/80 sm:text-base">{coin}</span>
                        <span className="ml-auto rounded-full bg-green/80 px-3 py-1 text-xs font-semibold text-white sm:text-sm">
                            {t("proximo.neuro.pagoUnico")}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-white/80 sm:text-sm">
                        {t("proximo.neuro.duracion")}
                    </p>
                </div>

                {/* Contenedor principal con mejor diseño */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-white/30 bg-gradient-to-br from-black/40 via-black/30 to-black/40 p-6 shadow-2xl backdrop-blur-lg sm:p-8">
                    {/* Efecto de brillo sutil */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue/5 via-transparent to-green/5 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <DiplomadoCountdown />
                        
                        {/* Información sobre certificación y diplomados */}
                        <div className="mt-6 rounded-lg bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                            <p className="text-sm font-semibold text-white mb-2 sm:text-base">
                                {t("proximo.certInternacional.titulo")}
                            </p>
                            <p className="text-xs text-white/90 sm:text-sm mb-3">
                                {t("proximo.certInternacional.intro")}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-white/80 sm:text-sm">
                                {t("proximo.certInternacional.items", { returnObjects: true }).map((item) => (
                                    <div key={item} className="flex items-center gap-1">
                                        <span className="text-green">✓</span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-white/85 sm:text-sm border-t border-white/10 pt-3">
                                {t("proximo.certInternacional.alineados")}
                            </p>
                        </div>
                        
                        {/* Beneficios mejorados */}
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <div className="flex items-start gap-2 rounded-lg bg-white/5 p-3 backdrop-blur-sm">
                                <span className="text-xl sm:text-2xl">🌐</span>
                                <div>
                                    <p className="text-xs font-semibold text-white sm:text-sm">{t("proximo.beneficios.enLinea.titulo")}</p>
                                    <p className="text-xs text-white/70 sm:text-sm">{t("proximo.beneficios.enLinea.texto")}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 rounded-lg bg-white/5 p-3 backdrop-blur-sm">
                                <span className="text-xl sm:text-2xl">⚡</span>
                                <div>
                                    <p className="text-xs font-semibold text-white sm:text-sm">{t("proximo.beneficios.aplicacion.titulo")}</p>
                                    <p className="text-xs text-white/70 sm:text-sm">{t("proximo.beneficios.aplicacion.texto")}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 rounded-lg bg-white/5 p-3 backdrop-blur-sm">
                                <span className="text-xl sm:text-2xl">👥</span>
                                <div>
                                    <p className="text-xs font-semibold text-white sm:text-sm">{t("proximo.beneficios.acompanamiento.titulo")}</p>
                                    <p className="text-xs text-white/70 sm:text-sm">{t("proximo.beneficios.acompanamiento.texto")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Botones mejorados */}
                        <div className="mt-6 space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a 
                                    href="https://docs.google.com/forms/d/e/1FAIpQLScmvkdg4BSCWsempnaQhJWc0ZGaYFSrgiFcnJ3hlpQqF8PU0g/viewform" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="group relative flex-1 overflow-hidden rounded-full bg-gradient-to-r from-blue to-green px-8 py-4 text-center font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue/50"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {t("proximo.ctaInscribete")}
                                        <span className="text-xl">🚀</span>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-green to-blue opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                </a>
                                <a 
                                    href='../diplomados' 
                                    className="group flex-1 rounded-full border-2 border-white/30 bg-white/5 px-8 py-4 text-center font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/10 hover:scale-105"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {t("proximo.ctaConoce")}
                                        <StaticImage className='w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity' src="../images/elements/decor2.png" alt={t("proximo.decorAlt")} />
                                    </span>
                                </a>
                            </div>
                            
                            {/* Elementos de confianza y urgencia */}
                            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-white/80 sm:text-sm">
                                {t("proximo.confianza", { returnObjects: true }).map((item) => (
                                    <div key={item} className="flex items-center gap-1.5">
                                        <span className="text-green">✓</span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
export default NextCourse


