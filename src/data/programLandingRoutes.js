const PROGRAM_LANDING_ROUTES = Object.freeze([
  { id: "nido", slug: "nido-comunidad-infantil" },
  { id: "casa", slug: "casa-de-ninos" },
  { id: "taller", slug: "taller-i-ii" },
  { id: "cosmica", slug: "educacion-cosmica" },
  { id: "neuro", slug: "neuroeducacion" },
])

const getProgramLandingRoute = id =>
  PROGRAM_LANDING_ROUTES.find(route => route.id === id) || null

module.exports = { PROGRAM_LANDING_ROUTES, getProgramLandingRoute }
