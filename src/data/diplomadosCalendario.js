/** Fechas históricas de inicio y aperturas mensuales de inscripción 2027.
 * 2027: último sábado de enero a noviembre, 00:00 America/Mexico_City. */

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
  { date: new Date("2027-01-30T00:00:00-06:00"), label: "30 de enero de 2027", kind: "enrollment" },
  { date: new Date("2027-02-27T00:00:00-06:00"), label: "27 de febrero de 2027", kind: "enrollment" },
  { date: new Date("2027-03-27T00:00:00-06:00"), label: "27 de marzo de 2027", kind: "enrollment" },
  { date: new Date("2027-04-24T00:00:00-06:00"), label: "24 de abril de 2027", kind: "enrollment" },
  { date: new Date("2027-05-29T00:00:00-06:00"), label: "29 de mayo de 2027", kind: "enrollment" },
  { date: new Date("2027-06-26T00:00:00-06:00"), label: "26 de junio de 2027", kind: "enrollment" },
  { date: new Date("2027-07-31T00:00:00-06:00"), label: "31 de julio de 2027", kind: "enrollment" },
  { date: new Date("2027-08-28T00:00:00-06:00"), label: "28 de agosto de 2027", kind: "enrollment" },
  { date: new Date("2027-09-25T00:00:00-06:00"), label: "25 de septiembre de 2027", kind: "enrollment" },
  { date: new Date("2027-10-30T00:00:00-06:00"), label: "30 de octubre de 2027", kind: "enrollment" },
  { date: new Date("2027-11-27T00:00:00-06:00"), label: "27 de noviembre de 2027", kind: "enrollment" },
]

export const getNextItem = (items, now = Date.now()) => {
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
