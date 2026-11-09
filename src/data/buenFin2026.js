// All campaign boundaries use Mexico City (UTC-06:00); end is exclusive.
const BUEN_FIN = Object.freeze({
  id: 'buen-fin-2026',
  name: 'Buen Fin 2026',
  start: Date.parse('2026-11-09T16:40:00-06:00'),
  end: Date.parse('2026-11-18T00:00:00-06:00'),
  timeZone: 'America/Mexico_City',
})

// Every three calendar months from November 2026, for seven complete days.
// Future campaigns are not branded as official Buen Fin dates.
const getQuarterlyCampaigns = year => [1, 4, 7, 10].map(month => ({
  id: `quarterly-${year}-${month + 1}`,
  name: 'Promoción trimestral',
  start: Date.UTC(year, month, 9, 6),
  end: Date.UTC(year, month, 16, 6),
  timeZone: BUEN_FIN.timeZone,
}))
const getCampaignWindows = now => {
  if (!Number.isFinite(now)) return []
  const year = new Date(now).getUTCFullYear()
  return [BUEN_FIN, ...[year, year + 1].filter(y => y >= 2027).flatMap(getQuarterlyCampaigns)]
}
const getActiveCampaign = now => getCampaignWindows(now).find(({ start, end }) => now >= start && now < end) || null
const isBuenFinActive = now => getActiveCampaign(now) !== null
const getNextBuenFinBoundary = now => getCampaignWindows(now)
  .flatMap(({ start, end }) => [start, end]).filter(time => time > now).sort((a, b) => a - b)[0] ?? null
const formatCampaignDate = time => new Intl.DateTimeFormat('es-MX', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: BUEN_FIN.timeZone,
}).format(time)
const getCampaignLabel = campaign => `Del ${formatCampaignDate(campaign.start)} al ${formatCampaignDate(campaign.end - 1)}`
const getCampaignTerms = campaign => {
  const startTime = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: BUEN_FIN.timeZone,
  }).format(campaign.start)
  return `Vigencia: del ${formatCampaignDate(campaign.start)} a las ${startTime} al ${formatCampaignDate(campaign.end - 1)} a las 23:59, hora de Ciudad de México.`
}
const getOfferMessage = (offer, campaign) => offer.message.replaceAll('Buen Fin 2026',
  `${campaign.name} (${getCampaignLabel(campaign)})`)

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
    details: 'Conservamos el precio promocional vigente del diplomado de 3 meses y añadimos los dos libros durante la promoción.',
    cta: 'Quiero Neuroeducación + libros',
    message: 'Hola, quiero la promoción de Buen Fin 2026: Diplomado en Neuroeducación por $4,500 MXN, inscripción incluida + dos libros de su editorial. ¿Me confirman los libros, la entrega y cómo realizar el pago?',
  },
])

module.exports = { BUEN_FIN, BUEN_FIN_OFFERS, getQuarterlyCampaigns, getActiveCampaign, isBuenFinActive, getNextBuenFinBoundary, getServerTime, getCampaignLabel, getCampaignTerms, getOfferMessage }
