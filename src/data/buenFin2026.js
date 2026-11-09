// Mexico City stays UTC-06:00 in November. End is exclusive.
const BUEN_FIN = Object.freeze({
  start: Date.parse('2026-11-13T00:00:00-06:00'),
  end: Date.parse('2026-11-18T00:00:00-06:00'),
  timeZone: 'America/Mexico_City',
})

// One-off viewing window requested by Carlos; automatically expires on server time.
// This does not change the official campaign dates or payment eligibility.
const BUEN_FIN_PREVIEW = Object.freeze({
  start: Date.parse('2026-11-09T16:40:00-06:00'),
  end: Date.parse('2026-11-09T17:10:00-06:00'),
})
const windows = [BUEN_FIN_PREVIEW, BUEN_FIN]
const isBuenFinActive = now => Number.isFinite(now) && windows.some(({ start, end }) => now >= start && now < end)
const getNextBuenFinBoundary = now => Number.isFinite(now)
  ? windows.flatMap(({ start, end }) => [start, end]).filter(time => time > now).sort((a, b) => a - b)[0] ?? null
  : null
const getServerTime = (date, age = '0') => {
  const parsed = Date.parse(date)
  const seconds = Number(age || 0)
  return Number.isFinite(parsed) && Number.isFinite(seconds) && seconds >= 0
    ? parsed + seconds * 1000
    : null
}

const BUEN_FIN_OFFERS = Object.freeze([
  {
    id: 'individual',
    title: 'Empieza con tu biblioteca Montessori',
    price: '$3,900',
    unit: 'MXN · inscripción individual',
    benefit: 'Ahorra $1,000 en tu inscripción y recibe dos libros de nuestra editorial.',
    details: 'Para Nido y Comunidad Infantil, Casa de Niños o Taller I y II. Inscripción habitual: $4,900 MXN. Colegiaturas sin cambios.',
    cta: 'Quiero la oferta individual',
    message: 'Hola, quiero la promoción individual de Buen Fin 2026: inscripción a Guía Montessori por $3,900 MXN + dos libros de su editorial. ¿Me ayudan a elegir el nivel y confirmar los libros, la entrega y el pago?',
  },
  {
    id: 'pareja',
    title: 'Aprendan juntas',
    price: '$3,500',
    unit: 'MXN · inscripción por persona, al inscribirse dos',
    benefit: 'Cada persona ahorra $1,400 y recibe dos libros de nuestra editorial.',
    details: 'Para dos nuevas inscripciones a Guía Montessori; pueden elegir distintos niveles. Ambas personas deben completar su pago durante la vigencia. Colegiaturas sin cambios.',
    cta: 'Queremos inscribirnos dos',
    message: 'Hola, somos dos personas y queremos la promoción Aprendan juntas de Buen Fin 2026: inscripción a Guía Montessori por $3,500 MXN por persona + dos libros para cada una. ¿Nos ayudan a coordinar ambos registros, los libros y el pago?',
  },
  {
    id: 'neuro',
    title: 'Neuroeducación + biblioteca',
    price: '$4,500',
    unit: 'MXN · programa con inscripción incluida',
    benefit: 'Tu diplomado de Neuroeducación y dos libros de nuestra editorial.',
    details: 'Conservamos el precio promocional vigente del diplomado de 3 meses y añadimos los dos libros durante el Buen Fin.',
    cta: 'Quiero Neuroeducación + libros',
    message: 'Hola, quiero la promoción de Buen Fin 2026: Diplomado en Neuroeducación por $4,500 MXN, inscripción incluida + dos libros de su editorial. ¿Me confirman los libros, la entrega y cómo realizar el pago?',
  },
])

module.exports = { BUEN_FIN, BUEN_FIN_PREVIEW, BUEN_FIN_OFFERS, isBuenFinActive, getNextBuenFinBoundary, getServerTime }
