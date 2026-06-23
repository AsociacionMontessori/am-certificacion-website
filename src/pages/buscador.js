import '../styles/global.css'
import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import React, { useEffect, useMemo, useState } from 'react'

const TODOS = 'Todos'

const Buscador = () => {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState(TODOS)
  const [soloAmmac, setSoloAmmac] = useState(false)

  useEffect(() => {
    fetch('/schools.json')
      .then(r => { if (!r.ok) throw new Error('fetch'); return r.json() })
      .then(d => setSchools(Array.isArray(d.schools) ? d.schools : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const countries = useMemo(() => {
    const set = new Set(schools.map(s => s.country).filter(Boolean))
    return [TODOS, ...[...set].sort((a, b) => a.localeCompare(b))]
  }, [schools])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return schools.filter(s => {
      if (country !== TODOS && s.country !== country) return false
      if (soloAmmac && !s.ammacCertified) return false
      if (!q) return true
      return [s.name, s.address, s.city, s.state, s.country]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [schools, query, country, soloAmmac])

  const ammacCount = useMemo(() => schools.filter(s => s.ammacCertified).length, [schools])

  return (
    <Layout>
      <Nav textColor="text-white" />
      <main className="bg-gradient-to-r from-blue via-purple to-green min-h-screen">
        <div className="max-w-screen-xl px-6 md:px-20 pb-16 mx-auto pt-28 md:pt-36">
          <div className="text-white max-w-3xl">
            <p className="text-sm uppercase tracking-[0.2em] text-green-200">Directorio Montessori</p>
            <h1 className="text-3xl md:text-5xl font-bold mt-3">Buscador de Escuelas Montessori</h1>
            <p className="text-lg md:text-xl pt-4 text-white/90">
              Encuentra escuelas Montessori en México y el resto del mundo. Las marcadas con el
              distintivo <span className="font-semibold text-green-200">★ Certificación AMMAC</span> cuentan
              con el aval de la Asociación Montessori de México A.C.
            </p>
          </div>

          {/* Controles */}
          <div className="mt-8 flex flex-col gap-4">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre, ciudad o estado…"
              className="w-full md:w-2/3 rounded-full px-6 py-3 text-black placeholder-black/50 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-300"
              aria-label="Buscar escuela Montessori"
            />
            <div className="flex flex-wrap items-center gap-2">
              {countries.map(c => (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
                    country === c ? 'bg-white text-blue shadow' : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {c}
                </button>
              ))}
              <label className="ml-2 flex items-center gap-2 text-sm text-white/90 cursor-pointer select-none">
                <input type="checkbox" checked={soloAmmac} onChange={e => setSoloAmmac(e.target.checked)} className="accent-green-400" />
                Solo certificadas AMMAC ({ammacCount})
              </label>
            </div>
          </div>

          {/* Resultados */}
          <div className="mt-6 text-white/80 text-sm">
            {loading ? 'Cargando escuelas…' : `${filtered.length} escuela(s) encontradas`}
          </div>

          {error && (
            <p className="mt-10 text-white">No se pudo cargar el directorio. Intenta de nuevo más tarde.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            {filtered.map((s, i) => {
              const Card = s.website ? 'a' : 'div'
              const props = s.website ? { href: s.website, target: '_blank', rel: 'noreferrer' } : {}
              return (
                <Card
                  key={s.placeId || `${s.name}-${i}`}
                  {...props}
                  className={`flex flex-col gap-2 rounded-2xl p-5 text-white backdrop-blur-lg border ${
                    s.ammacCertified
                      ? 'bg-green/20 border-green-300 shadow-xl ring-1 ring-green-300/60'
                      : 'bg-white/15 border-white/20 hover:bg-white/25'
                  } transition`}
                >
                  {s.ammacCertified && (
                    <span className="self-start rounded-full bg-green-400 text-blue-900 text-xs font-bold px-3 py-0.5">
                      ★ Certificación AMMAC
                    </span>
                  )}
                  <div className="font-semibold text-lg leading-tight">{s.name}</div>
                  {s.address && <div className="text-sm text-white/85">{s.address}</div>}
                  <div className="mt-auto pt-2 text-sm text-white/70">
                    {[s.city, s.state, s.country].filter(Boolean).join(' · ')}
                  </div>
                  {s.phone && <div className="text-sm text-white/80">Tel: {s.phone}</div>}
                </Card>
              )
            })}
          </div>

          {!loading && !error && filtered.length === 0 && (
            <p className="mt-10 text-white/90">
              No hay escuelas que coincidan con tu búsqueda. Prueba con otra ciudad o quita los filtros.
            </p>
          )}
        </div>
      </main>
    </Layout>
  )
}

export const Head = () => (
  <Seo
    title="Buscador de Escuelas Montessori"
    pathname="/buscador/"
    description="Directorio público de escuelas Montessori en México y el mundo. Identifica las escuelas con certificación de la Asociación Montessori de México A.C. (AMMAC)."
  />
)

export default Buscador
