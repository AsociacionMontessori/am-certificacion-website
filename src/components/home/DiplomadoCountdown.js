import * as React from "react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  DIPLOMADOS_EN_LINEA,
  getNextItem,
  getTimeParts,
} from "../../data/diplomadosCalendario"

const DiplomadoCountdown = ({ variant = "dark" }) => {
  const { t } = useTranslation("home")
  const [state, setState] = useState({
    status: "loading",
    next: null,
    diff: 0,
  })

  const textMuted = variant === "dark" ? "text-white/80" : "text-gray"
  const textMain = variant === "dark" ? "text-white" : "text-black"
  const boxBg = variant === "dark" ? "bg-white/10" : "bg-gray/5"

  useEffect(() => {
    const update = () => {
      const next = getNextItem(DIPLOMADOS_EN_LINEA)
      if (!next) {
        setState({ status: "noMore", next: null, diff: 0 })
        return
      }
      const diff = next.date.getTime() - Date.now()
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

  const enrollmentCalendar = (
      <details className={`text-sm ${textMain}`}>
        <summary className="cursor-pointer font-semibold underline underline-offset-4">{t("countdown.calendario2027")}</summary>
        <p className={`mt-3 ${textMuted}`}>{t("countdown.calendarioNota")}</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2" data-testid="enrollment-calendar-2027">
          {DIPLOMADOS_EN_LINEA.filter(item => item.kind === "enrollment").map(item => {
            const key = item.date.toISOString().slice(0, 10)
            return <li key={key}>{t(`countdown.fechas.${key}`, { defaultValue: item.label })}</li>
          })}
        </ul>
      </details>
  )

  if (state.status === "loading") {
    return <p className={`text-sm ${textMuted}`}>{t("countdown.calculando")}</p>
  }

  if (state.status === "noMore") {
    return (
      <div className="space-y-3">
        <p className={`text-sm ${textMain}`}>{t("countdown.sinFechas")}</p>
        {enrollmentCalendar}
      </div>
    )
  }

  if (state.status === "live") {
    return (
      <p className={`text-sm ${textMain}`}>
        {t("countdown.enVivo")}{" "}
        <a
          href="https://youtube.com/live/1LVgUc94Z2k?feature=share"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-blue"
        >
          {t("countdown.unete")}
        </a>
      </p>
    )
  }

  const { days, hours } = getTimeParts(state.diff)
  const isUrgent = state.next.kind !== "enrollment" && days <= 7
  // Clave por fecha (YYYY-MM-DD) para poder localizar la etiqueta visible.
  const fechaKey = state.next?.date
    ? state.next.date.toISOString().slice(0, 10)
    : ""

  return (
    <div className="space-y-3">
      {isUrgent && (
        <span className="inline-flex items-center gap-2 rounded-full bg-red px-3 py-1 text-xs font-bold text-white animate-pulse">
          {t("countdown.ultimosLugares")}
        </span>
      )}
      <p className={`text-sm ${textMain}`}>
        <span className="font-semibold">{t(state.next.kind === "enrollment" ? "countdown.proximaInscripcion" : "countdown.proximoInicio")}</span>
        <span className="inline-block rounded-lg bg-gradient-to-r from-blue to-green px-3 py-1 text-sm font-bold text-white">
          {t(`countdown.fechas.${fechaKey}`, { defaultValue: state.next?.label })}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-medium ${textMuted}`}>{t("countdown.faltan")}</span>
        {days > 0 && (
          <div className={`flex flex-col items-center rounded-lg ${boxBg} px-3 py-2 min-w-[56px]`}>
            <span className={`text-xl font-bold ${textMain}`}>{days}</span>
            <span className={`text-xs ${textMuted}`}>{t("countdown.dias")}</span>
          </div>
        )}
        {hours > 0 && (
          <div className={`flex flex-col items-center rounded-lg ${boxBg} px-3 py-2 min-w-[56px]`}>
            <span className={`text-xl font-bold ${textMain}`}>{hours}</span>
            <span className={`text-xs ${textMuted}`}>{t("countdown.horas")}</span>
          </div>
        )}
      </div>
      {enrollmentCalendar}
    </div>
  )
}

export default DiplomadoCountdown
