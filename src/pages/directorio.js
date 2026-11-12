import '../styles/global.css'
import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import React, { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { getT, useLocalization } from '../i18n'
import { useVisitorGeo } from '../hooks/useVisitorGeo'
import { countryMatchesLanguage } from '../data/directoryLanguages'

const TODOS = 'Todos'
const PAGE_SIZE = 120
// Normalize spelling accents/case, but keep country/state in the identity.
const normalizeCity = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
const cityKey = school => JSON.stringify([school.country, school.state || '', normalizeCity(school.city)])

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
  'Nueva Zelanda': '🇳🇿', 'Filipinas': '🇵🇭', 'Brasil': '🇧🇷',
}
const flagOf = (country) => FLAGS[country] || ''

const Directorio = () => {
  const { t } = useTranslation('directorio')
  const { language } = useLocalization()
  const { detectedCountryCode, detectedCity, detectedRegion } = useVisitorGeo({ fallbackCountryLookup: true })
  const [scope, setScope] = useState('auto')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState(TODOS)
  const [city, setCity] = useState(TODOS)
  const [soloAmmac, setSoloAmmac] = useState(false)

  useEffect(() => {
    fetch('/schools.json')
      .then(r => { if (!r.ok) throw new Error('fetch'); return r.json() })
      .then(d => setSchools(Array.isArray(d.schools) ? d.schools : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setScope('auto')
    setCountry(TODOS)
    setCity(TODOS)
  }, [language])

  const detectedCountry = useMemo(() => {
    if (!detectedCountryCode || typeof Intl.DisplayNames !== 'function') return null
    try {
      const name = new Intl.DisplayNames(['es'], { type: 'region' }).of(detectedCountryCode)
      return schools.some(s => s.country === name) ? name : null
    } catch {
      return null
    }
  }, [schools, detectedCountryCode])

  const localCity = useMemo(() => {
    if (!detectedCountry || !detectedCity) return null
    let matches = schools.filter(s => s.country === detectedCountry && normalizeCity(s.city) === normalizeCity(detectedCity))
    if (new Set(matches.map(cityKey)).size > 1 && detectedRegion) {
      matches = matches.filter(s => normalizeCity(s.state) === normalizeCity(detectedRegion))
    }
    const keys = new Set(matches.map(cityKey))
    // An ambiguous city name must not choose a state arbitrarily.
    return keys.size === 1 ? matches[0] : null
  }, [schools, detectedCountry, detectedCity, detectedRegion])
  const activeCity = scope === 'auto' && localCity ? cityKey(localCity) : city
  const activeScope = scope === 'auto' ? (detectedCountry ? 'local' : 'language') : scope
  const changeScope = next => { setScope(next); setCountry(TODOS); setCity(TODOS) }
  // Freeze a manual choice so a late IP response never overrides it.
  const keepManualScope = () => { setScope(activeScope); setCity(activeCity) }

  const scopedSchools = useMemo(() => schools.filter(s => {
    if (activeScope === 'local') return s.country === detectedCountry
    if (activeScope === 'others') return s.country !== detectedCountry
    return activeScope === 'all' || countryMatchesLanguage(s.country, language)
  }), [schools, activeScope, detectedCountry, language])

  const countries = useMemo(() => {
    const set = new Set(scopedSchools.map(s => s.country).filter(Boolean))
    return [TODOS, ...[...set].sort((a, b) => a.localeCompare(b))]
  }, [scopedSchools])

  const cities = useMemo(() => {
    const options = new Map()
    scopedSchools.filter(s => country === TODOS || s.country === country).forEach(s => {
      if (s.city && s.city.trim()) options.set(cityKey(s), { key: cityKey(s), label: [s.city.trim(), s.state, s.country].filter(Boolean).join(' · ') })
    })
    return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, language))
  }, [scopedSchools, country, language])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scopedSchools.filter(s => {
      if (country !== TODOS && s.country !== country) return false
      if (activeCity !== TODOS && cityKey(s) !== activeCity) return false
      if (soloAmmac && !s.ammacCertified) return false
      if (!q) return true
      return [s.name, s.address, s.city, s.state, s.country]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [scopedSchools, query, country, soloAmmac, activeCity])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, country, soloAmmac, activeScope, activeCity, detectedCountry, language])

  const visibles = filtered.slice(0, visibleCount)

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
              onChange={e => { keepManualScope(); setQuery(e.target.value) }}
              placeholder={t('filtros.buscarPlaceholder')}
              className="w-full md:w-2/3 rounded-full px-6 py-3 text-black placeholder-black/50 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-300"
              aria-label={t('filtros.buscarAriaLabel')}
            />
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('filtros.alcance')}>
              {localCity && (
                <button type="button"
                  aria-pressed={activeScope === 'local' && activeCity === cityKey(localCity)}
                  onClick={() => { setScope('local'); setCountry(TODOS); setCity(cityKey(localCity)) }}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${activeScope === 'local' && activeCity === cityKey(localCity) ? 'bg-white text-blue shadow' : 'bg-white/15 text-white hover:bg-white/25'}`}
                >{t('filtros.miCiudad', { ciudad: localCity.city })}</button>
              )}
              {detectedCountry && (
                <button
                  type="button"
                  aria-pressed={activeScope === 'local'}
                  onClick={() => changeScope('local')}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${activeScope === 'local' ? 'bg-white text-blue shadow' : 'bg-white/15 text-white hover:bg-white/25'}`}
                >
                  {flagOf(detectedCountry)} {t('filtros.miPais', { pais: detectedCountry })}
                </button>
              )}
              <button
                type="button"
                aria-pressed={activeScope === 'others'}
                onClick={() => changeScope('others')}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${activeScope === 'others' ? 'bg-white text-blue shadow' : 'bg-white/15 text-white hover:bg-white/25'}`}
              >
                {t('filtros.otrosPaises')}
              </button>
              <button
                type="button"
                aria-pressed={activeScope === 'language'}
                onClick={() => changeScope('language')}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${activeScope === 'language' ? 'bg-white text-blue shadow' : 'bg-white/15 text-white hover:bg-white/25'}`}
              >
                {t('filtros.porIdioma')}
              </button>
              <button
                type="button"
                aria-pressed={activeScope === 'all'}
                onClick={() => changeScope('all')}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${activeScope === 'all' ? 'bg-white text-blue shadow' : 'bg-white/15 text-white hover:bg-white/25'}`}
              >
                {t('filtros.todos')}
              </button>
            </div>
            <p className="text-sm text-white/80">{t(activeScope === 'local' ? 'filtros.descripcionPais' : activeScope === 'others' ? 'filtros.descripcionOtros' : activeScope === 'all' ? 'filtros.descripcionTodos' : 'filtros.descripcionIdioma', { pais: detectedCountry })}</p>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('filtros.pais')}>
              {countries.map(c => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={country === c}
                  onClick={() => { keepManualScope(); setCountry(c); setCity(TODOS) }}
                  className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
                    country === c ? 'bg-white text-blue shadow' : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {c === TODOS ? t('filtros.todosPaises') : `${flagOf(c)} ${c}`}
                </button>
              ))}
              <label className="ml-2 flex items-center gap-2 text-sm text-white/90 cursor-pointer select-none">
                <input type="checkbox" checked={soloAmmac} onChange={e => { keepManualScope(); setSoloAmmac(e.target.checked) }} className="accent-green-400" />
                {t('filtros.soloAmmac')}
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm text-white md:max-w-xl">
              <span>{t('filtros.ciudad')}</span>
              <select aria-label={t('filtros.ciudad')} aria-describedby="city-help" value={activeCity} disabled={loading || cities.length === 0}
                onChange={e => { keepManualScope(); setCity(e.target.value) }}
                className="w-full min-w-0 rounded-2xl px-4 py-3 text-black bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value={TODOS}>{t('filtros.todasCiudades')}</option>
                {cities.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <span id="city-help" className="text-white/80">{t('filtros.descripcionCiudad')}</span>
            </label>
          </div>

          {/* Resultados */}
          <div className="mt-6 text-white/80 text-sm" role="status" aria-live="polite">
            {loading
              ? t('resultados.cargando')
              : filtered.length > visibles.length
                ? t('resultados.muchas', { total: filtered.length, limite: visibles.length })
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

          {!loading && !error && visibles.length < filtered.length && (
            <button
              type="button"
              onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
              className="block mx-auto mt-8 rounded-full bg-white text-blue font-semibold px-6 py-3 shadow hover:bg-green-100 transition"
            >
              {t('resultados.cargarMas')}
            </button>
          )}

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
                  `escuela Montessori ${[query, activeCity !== TODOS ? cities.find(c => c.key === activeCity)?.label : (country !== TODOS ? country : detectedCountry)].filter(Boolean).join(' ')}`.trim()
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
