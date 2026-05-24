import * as React from "react"
import { useEffect, useState } from "react"
import axios from "axios"
import { Link } from "gatsby"
import CheckoutPageShell from "../../components/checkout/CheckoutPageShell"
import InscriptionCheckoutForm from "../../components/checkout/InscriptionCheckoutForm"
import DatosBancariosCard from "../../components/inscripcion/DatosBancariosCard"
import { INSCRIPCION_PUBLIC } from "../../data/inscripcionPublic"
import { getLocalizedPrice } from "../../utils/localizedPrice"

const InscripcionPagarPage = () => {
  const [geo, setGeo] = useState({ countryCode: "MX", countryName: "Mexico" })

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
        setGeo({ countryCode: "MX", countryName: "Mexico" })
      })
  }, [])

  const { coin, price } = getLocalizedPrice(
    geo,
    INSCRIPCION_PUBLIC.priceMx,
    INSCRIPCION_PUBLIC.priceUsd
  )

  return (
    <CheckoutPageShell
      title="Paso 1 · Pago de inscripción"
      description="Pago seguro con tarjeta en línea. Al confirmarlo, continuarás con tu cuenta y expediente en nuestro sistema."
      backTo="/diplomados"
    >
      <InscriptionCheckoutForm coin={coin} price={price} cancelHref="/#precios" />

      <div className="mt-8 pt-6 border-t border-gray/15 space-y-4">
        <p className="text-sm font-semibold text-black text-center">
          ¿Prefieres pagar por transferencia?
        </p>
        <DatosBancariosCard compact />
        <Link
          to="/inscripcion/transferencia"
          className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-blue border-2 border-blue bg-white"
        >
          Ver instrucciones de transferencia
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray text-center leading-relaxed">
        ¿Ya pagaste en línea?{" "}
        <Link to="/inscripcion/completar" className="text-blue underline font-medium">
          Continuar al paso 2
        </Link>
      </p>
    </CheckoutPageShell>
  )
}

export default InscripcionPagarPage
