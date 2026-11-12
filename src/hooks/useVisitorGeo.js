import { useEffect, useState } from "react"
import axios from "axios"
import { isMexico } from "../utils/localizedPrice"

const DEFAULT_GEO = { countryCode: "MX", countryName: "Mexico" }

/**
 * Detecta país del visitante (ipapi.co). Misma lógica que precios MXN/USD.
 */
export function useVisitorGeo({ fallbackCountryLookup = false } = {}) {
  const [geo, setGeo] = useState(DEFAULT_GEO)
  const [detectedCountryCode, setDetectedCountryCode] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get("https://ipapi.co/json/", { timeout: 5000 })
      .then((response) => {
        const data = response.data
        if (fallbackCountryLookup && (data.error || !/^[A-Z]{2}$/i.test(data.country_code || ""))) {
          throw new Error("Country unavailable")
        }
        if (!data.error && /^[A-Z]{2}$/i.test(data.country_code || "")) {
          setDetectedCountryCode(data.country_code.toUpperCase())
        }
        setGeo({
          countryCode: (data.country_code || "MX").toUpperCase(),
          countryName: data.country_name || "Mexico",
        })
      })
      .catch(async () => {
        setGeo(DEFAULT_GEO)
        if (!fallbackCountryLookup) return
        // Country-only fallback for the directory; keep pricing defaults unchanged.
        try {
          const { data } = await axios.get("https://get.geojs.io/v1/ip/country.json", { timeout: 3000 })
          if (/^[A-Z]{2}$/i.test(data.country || "")) {
            setDetectedCountryCode(data.country.toUpperCase())
          }
        } catch {
          // No verified country: the directory keeps its language-based view.
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [fallbackCountryLookup])

  return {
    geo,
    detectedCountryCode,
    loading,
    esMexico: isMexico(geo),
  }
}
