// Country names match the Spanish names in schools.json. A multilingual
// country may belong to more than one group; this does not classify schools.
const COUNTRIES_BY_LANGUAGE = {
  es: [
    'México', 'Colombia', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Uruguay',
    'Paraguay', 'Bolivia', 'Venezuela', 'Panamá', 'Guatemala', 'El Salvador',
    'Honduras', 'Nicaragua', 'República Dominicana', 'Costa Rica', 'Puerto Rico',
    'España', 'Guinea Ecuatorial',
  ],
  en: [
    'Estados Unidos', 'Canadá', 'Reino Unido', 'Irlanda', 'Australia',
    'Nueva Zelanda', 'India', 'Filipinas', 'Sudáfrica', 'Nigeria', 'Ghana',
    'Kenia', 'Uganda', 'Tanzania', 'Zambia', 'Zimbabue', 'Botsuana',
    'Malaui', 'Ruanda', 'Camerún', 'Lesoto', 'Esuatini', 'Liberia',
    'Sierra Leona', 'Gambia', 'Sudán del Sur', 'Sudán', 'Mauricio',
    'Seychelles', 'Singapur', 'Pakistán', 'Belice', 'Guyana', 'Jamaica',
    'Bahamas', 'Barbados', 'Trinidad y Tobago', 'Antigua y Barbuda',
    'Dominica', 'Granada', 'San Cristóbal y Nieves', 'Santa Lucía',
    'San Vicente y las Granadinas', 'Fiyi', 'Papúa Nueva Guinea',
    'Islas Salomón', 'Vanuatu', 'Samoa', 'Tonga', 'Kiribati', 'Tuvalu',
    'Nauru', 'Islas Marshall', 'Micronesia', 'Palaos',
  ],
  pt: [
    'Brasil', 'Portugal', 'Angola', 'Mozambique', 'Cabo Verde',
    'Guinea-Bisáu', 'Guinea Ecuatorial', 'Santo Tomé y Príncipe', 'Timor Oriental',
  ],
}

export const countryMatchesLanguage = (country, language = 'es') => {
  const baseLanguage = language.toLowerCase().split('-')[0]
  return (COUNTRIES_BY_LANGUAGE[baseLanguage] || COUNTRIES_BY_LANGUAGE.es).includes(country)
}
