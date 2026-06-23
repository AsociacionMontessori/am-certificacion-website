import { useEffect, useState } from "react"
import axios from "axios"
import { isMexico } from "../utils/localizedPrice"

const DEFAULT_GEO = { countryCode: "MX", countryName: "Mexico" }

/**
 * Detecta país del visitante (ipapi.co). Misma lógica que precios MXN/USD.
 */
export function useVisitorGeo() {
  const [geo, setGeo] = useState(DEFAULT_GEO)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get("https://ipapi.co/json/")
      .then((response) => {
        const data = response.data
        setGeo({
          countryCode: (data.country_code || "MX").toUpperCase(),
          countryName: data.country_name || "Mexico",
        })
      })
      .catch(() => {
        setGeo(DEFAULT_GEO)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return {
    geo,
    loading,
    esMexico: isMexico(geo),
  }
}
