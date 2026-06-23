/** Fechas de inicio de diplomados en línea (sábados). */

export const DIPLOMADOS_EN_LINEA = [
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

export const getNextItem = (items) => {
  const now = Date.now()
  return items.find((item) => item.date.getTime() > now) || null
}

export const MS_SECOND = 1000
export const MS_MINUTE = 60 * MS_SECOND
export const MS_HOUR = 60 * MS_MINUTE
export const MS_DAY = 24 * MS_HOUR

export const getTimeParts = (diffMs) => {
  const days = Math.floor(diffMs / MS_DAY)
  const hours = Math.floor((diffMs % MS_DAY) / MS_HOUR)
  const minutes = Math.floor((diffMs % MS_HOUR) / MS_MINUTE)
  const seconds = Math.floor((diffMs % MS_MINUTE) / MS_SECOND)
  return { days, hours, minutes, seconds }
}
