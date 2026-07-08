import '../styles/global.css'
import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import React, { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { getT } from '../i18n'

const TODOS = 'Todos'

// País (en español, como lo devuelve Places) -> emoji de bandera.
const FLAGS = {
  'México': '🇲🇽', 'Colombia': '🇨🇴', 'Argentina': '🇦🇷', 'Chile': '🇨🇱',
  'Perú': '🇵🇪', 'Ecuador': '🇪🇨', 'Uruguay': '🇺🇾', 'Paraguay': '🇵🇾',
  'Bolivia': '🇧🇴', 'Venezuela': '🇻🇪', 'Panamá': '🇵🇦', 'Guatemala': '🇬🇹',
  'El Salvador': '🇸🇻', 'Honduras': '🇭🇳', 'Nicaragua': '🇳🇮',
  'República Dominicana': '🇩🇴', 'Costa Rica': '🇨🇷', 'Puerto Rico': '🇵🇷',
  'España': '🇪🇸', 'Estados Unidos': '🇺🇸', 'Canadá': '🇨🇦', 'Italia': '🇮🇹',
  'Reino Unido': '🇬🇧', 'Irlanda': '🇮🇪', 'Francia': '🇫🇷', 'Alemania': '🇩🇪',
  'Países Bajos': '🇳🇱', 'Portugal': '🇵🇹', 'Bélgica': '🇧🇪', 'Austria': '🇦🇹',
  'Suiza': '🇨🇭', 'Israel': '🇮🇱', 'India': '🇮🇳', 'Australia': '🇦🇺',
  'Nueva Zelanda': '🇳🇿', 'Filipinas': '🇵🇭',
}
const flagOf = (country) => FLAGS[country] || ''

const Directorio = () => {
  const { t } = useTranslation('directorio')
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

  const LIMIT = 120
  const visibles = filtered.slice(0, LIMIT)

  return (
    <Layout>
      <Nav textColor="text-white" />
      <main className="bg-gradient-to-r from-blue via-purple to-green min-h-screen">
        <div className="max-w-screen-xl px-6 md:px-20 pb-16 mx-auto pt-28 md:pt-36">
          <div className="text-white max-w-3xl">
            <p className="text-sm uppercase tracking-[0.2em] text-green-200">{t('header.eyebrow')}</p>
            <h1 className="text-3xl md:text-5xl font-bold mt-3">{t('header.title')}</h1>
            <p className="text-lg md:text-xl pt-4 text-white/90">
              <Trans
                i18nKey="header.description"
                ns="directorio"
                components={{ distintivo: <span className="font-semibold text-green-200" /> }}
              />
            </p>
          </div>

          {/* Controles */}
          <div className="mt-8 flex flex-col gap-4">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('filtros.buscarPlaceholder')}
              className="w-full md:w-2/3 rounded-full px-6 py-3 text-black placeholder-black/50 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-300"
              aria-label={t('filtros.buscarAriaLabel')}
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
                  {c === TODOS ? t('filtros.todos') : `${flagOf(c)} ${c}`}
                </button>
              ))}
              <label className="ml-2 flex items-center gap-2 text-sm text-white/90 cursor-pointer select-none">
                <input type="checkbox" checked={soloAmmac} onChange={e => setSoloAmmac(e.target.checked)} className="accent-green-400" />
                {t('filtros.soloAmmac')}
              </label>
            </div>
          </div>

          {/* Resultados */}
          <div className="mt-6 text-white/80 text-sm">
            {loading
              ? t('resultados.cargando')
              : filtered.length > LIMIT
                ? t('resultados.muchas', { total: filtered.length, limite: LIMIT })
                : t('resultados.contador', { total: filtered.length })}
          </div>

          {error && (
            <p className="mt-10 text-white">{t('resultados.error')}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            {visibles.map((s, i) => {
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
                      {t('tarjeta.certificacion')}
                    </span>
                  )}
                  <div className="font-semibold text-lg leading-tight">{s.name}</div>
                  {s.address && <div className="text-sm text-white/85">{s.address}</div>}
                  <div className="mt-auto pt-2 text-sm text-white/70">
                    {flagOf(s.country) && <span className="mr-1">{flagOf(s.country)}</span>}
                    {[s.city, s.state, s.country].filter(Boolean).join(' · ')}
                  </div>
                  {s.phone && <div className="text-sm text-white/80">{t('tarjeta.telefono', { telefono: s.phone })}</div>}
                </Card>
              )
            })}
          </div>

          {!loading && !error && filtered.length === 0 && (
            <div className="mt-10 text-white/90">
              <p>{t('resultados.vacio')}</p>
            </div>
          )}

          {/* Cobertura: si tu país/ciudad no está en nuestro directorio, buscamos en Google Maps */}
          {!loading && !error && (
            <div className="mt-12 rounded-2xl bg-white/10 border border-white/20 p-6 text-white">
              <p className="text-base md:text-lg">
                {t('cobertura.descripcion')}
              </p>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(
                  `escuela Montessori ${query || (country !== TODOS ? country : '')}`.trim()
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-4 rounded-full bg-green-400 text-blue-900 font-semibold px-6 py-2 hover:bg-green-300 transition"
              >
                {t('cobertura.boton', { termino: query ? `"${query}"` : t('cobertura.terminoPorDefecto') })}
              </a>
            </div>
          )}
        </div>
      </main>
    </Layout>
  )
}

export const Head = ({ location }) => {
  const t = getT(location.pathname, 'directorio')
  return (
    <Seo
      title={t('seo.title')}
      pathname={location.pathname}
      description={t('seo.description')}
    />
  )
}

export default Directorio
