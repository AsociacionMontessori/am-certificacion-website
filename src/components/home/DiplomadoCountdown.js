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

  if (state.status === "loading") {
    return <p className={`text-sm ${textMuted}`}>{t("countdown.calculando")}</p>
  }

  if (state.status === "noMore") {
    return (
      <p className={`text-sm ${textMain}`}>
        {t("countdown.sinFechas")}
      </p>
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
  const isUrgent = days <= 7
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
        <span className="font-semibold">{t("countdown.proximoInicio")}</span>
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
    </div>
  )
}

export default DiplomadoCountdown
