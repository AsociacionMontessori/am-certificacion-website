export const isMexico = (geo) => {
  const countryCode = (geo?.countryCode || "").toUpperCase()
  const countryName = geo?.countryName || ""
  if (countryCode === "MX" || countryName === "Mexico" || countryName === "México") return true
  if (!countryCode && !countryName) return true
  return false
}

export const getLocalizedPrice = (geo, priceMx, priceUsd) => {
  const useMxn = isMexico(geo)
  return {
    coin: useMxn ? "MXN" : "USD",
    price: useMxn ? priceMx : priceUsd,
  }
}
