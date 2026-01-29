import { StaticImage } from "gatsby-plugin-image"
import React, { useEffect, useState } from "react"

const DIPLOMADOS_EN_LINEA = [
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

const getNextItem = (items) => {
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

const DiplomadoCountdown = () => {
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
                Calculando la próxima fecha de diplomado…
            </p>
        )
    }

    if (state.status === "noMore") {
        return (
            <p className="text-sm text-white sm:text-base md:text-lg">
                Te deseamos un excelente cierre de año.
                <br className="hidden sm:block" />
                <span className="text-xs text-slate-200 sm:text-sm">
                    Mantente al tanto de nuevas fechas de diplomados.
                </span>
            </p>
        )
    }

    if (state.status === "live") {
        return (
            <p className="text-sm text-white sm:text-base md:text-lg">
                Estamos en vivo.{" "}
                <a
                    href="https://youtube.com/live/1LVgUc94Z2k?feature=share"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-blue/60 hover:text-blue-100"
                >
                    Únete a la clase en vivo.
                </a>
            </p>
        )
    }

    const { days, hours } = getTimeParts(state.diff)

    return (
        <div className="text-sm text-white sm:text-base md:text-lg">
            <p>
                <span className="font-semibold">
                    Inscríbete en línea, iniciamos el:{" "}
                </span>
                {state.next && (
                    <span className="rounded bg-white/80 px-2 py-0.5 text-sm font-semibold text-black shadow-sm sm:text-base">
                        {state.next.label}
                    </span>
                )}
            </p>
            <p className="mt-1 text-xs sm:text-sm md:text-base">
                Faltan{" "}
                <span className="font-semibold">
                    {days > 0 && `${days} días `}
                    {hours > 0 && `${hours} horas`}
                    {days <= 0 && hours <= 0 && "pocas horas"}
                </span>
            </p>
            <p className="mt-2 text-xs text-white/90 sm:text-sm md:text-base">
                Inscríbete a nuestro Diplomado en Neuroeducación con un costo único de{" "}
                <span className="font-semibold">$4,500 MXN</span>, duración de 3 meses y a tu ritmo.
            </p>
        </div>
    )
}

const NextCourse = () => {
    return (
        <>
            <div className="pb-10 lg:pb-10">
                <h2 className="py-2">
                    <span className="text-white text-2xl font-bold">Próximo Diplomado:</span>
                </h2>
                <div className="relative rounded-3xl border border-white/20 bg-black/30 p-4 backdrop-blur">
                    <DiplomadoCountdown />
                    <div className="pt-4">
                        <a href="https://docs.google.com/forms/d/e/1FAIpQLScmvkdg4BSCWsempnaQhJWc0ZGaYFSrgiFcnJ3hlpQqF8PU0g/viewform" target="__blank" className="group mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-blue text-white bg-opacity-10 w-full md:w-auto">
                            Inscríbete Ahora
                            <div className="inline opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                <StaticImage className='w-6 h-6' src="../images/elements/decor2.png" alt="decoration" />
                            </div>  
                        </a>
                        <a href='../diplomados' className="group mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-green bg-gradient-to-r from-green/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10 w-full md:w-auto">
                            Conoce el Diplomado
                            <div className="inline opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                <StaticImage className='w-6 h-6' src="../images/elements/decor2.png" alt="decoration" />
                            </div>                        
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}
export default NextCourse



