const {
  INDEX_TRANSLATIONS,
  LANGUAGES,
  LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  parsePath,
  localizePath,
  isLocalizedPath,
} = require("./src/i18n/config")

const SITE_URL = "https://certificacionmontessori.com"

module.exports = {
  siteMetadata: {
    title: `Asociación Montessori de México A.C.`,
    siteName: `Certificación Montessori`,
    description: `Formación y certificaciones Montessori internacionales. La Asociación Montessori de México A.C. (AMMAC), fundada en 1965, forma Guías Montessori en línea para estudiantes de todo el mundo y coordina diplomados en México, América Latina, Estados Unidos, España, Europa, Israel y la India.`,
    author: `@AsociacionMontessori`,
    siteUrl: `https://certificacionmontessori.com`,
    defaultOgImage: `/og-default.svg`,
    language: `es-MX`,
    organizationName: `Asociación Montessori de México A.C.`,
    legalName: `Asociación Montessori de México A.C.`,
    foundingDate: `1965`,
    slogan: `Certificación Montessori internacional emitida por la AMMAC, para estudiantes de todo el mundo`,
    areaServedCountries: [
      `México`,
      `Colombia`,
      `Puerto Rico`,
      `España`,
      `Costa Rica`,
      `Estados Unidos`,
      `Israel`,
      `Suiza`,
      `India`,
    ],
    email: `admin@certificacionmontessori.com`,
    telephone: `+52 55 5515 2701`,
    whatsappUrl: `https://api.whatsapp.com/send?phone=5215548885013&text=Hola,%20Me%20gustar%C3%ADa%20informaci%C3%B3n%20sobre%20la%20certificaci%C3%B3n%20Montessori.`,
    whatsappNumber: `+52 1 55 4888 5013`,
    whatsappHours: `Atención por WhatsApp de 9:00 a 18:00 horas, solo por chat.`,
    address: `Avenida Dos 48, San Pedro de los Pinos, Benito Juárez, 03800 Ciudad de México, CDMX, México`,
    streetAddress: `Avenida Dos 48, San Pedro de los Pinos`,
    addressLocality: `Ciudad de México`,
    addressRegion: `CDMX`,
    postalCode: `03800`,
    addressCountry: `MX`,
    sameAs: [
      `https://www.facebook.com/asociacionmontessori`,
      `https://www.instagram.com/asociacionmontessori/`,
      `https://www.linkedin.com/in/asociaci%C3%B3n-montessori-de-m%C3%A9xico-a-c-5a868417a/?originalSubdomain=mx`,
      `https://www.youtube.com/@montessorimx`,
      `https://www.tiktok.com/@montessorimx`,
    ],
  },
  plugins: [
    'gatsby-plugin-postcss',
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `data`,
        path: `${__dirname}/src/data/`,
      },
    },
    `gatsby-transformer-json`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        excludes: [
          `/404`,
          `/404.html`,
          `/dev-404-page`,
          `/offline-plugin-app-shell-fallback`,
          `/certificate`,
          `/certificate/*`,
          `/masterclasses`,
          `/masterclasses/*`,
          `/alumnos-app`,
          `/alumnos-app/*`,
          // Flujos transaccionales (Stripe / inscripción): noindex en el <head>
          // y fuera del sitemap. Son pasos de conversión, no páginas de entrada;
          // indexarlos canibaliza las búsquedas de marca.
          ...LANGUAGE_CODES.flatMap(code => {
            const prefix = LANGUAGES[code].prefix
            return [
              `${prefix}/checkout`,
              `${prefix}/checkout/*`,
              `${prefix}/inscripcion`,
              `${prefix}/inscripcion/*`,
            ]
          }),
          // EN/PT-BR fuera del sitemap mientras estén en noindex (pre-traducción);
          // en la Fase 5 (SEO) INDEX_TRANSLATIONS pasa a true y entran solos.
          ...(INDEX_TRANSLATIONS ? [] : [`/en/`, `/en/**`, `/pt-br/`, `/pt-br/**`]),
        ],
        // hreflang en el sitemap: cada página localizada anuncia sus 3 versiones
        // + x-default (el español en la raíz).
        serialize: page => {
          const { originalPath } = parsePath(page.path)
          const entry = { url: page.path, changefreq: `weekly` }
          if (INDEX_TRANSLATIONS && isLocalizedPath(originalPath)) {
            entry.links = [
              ...LANGUAGE_CODES.map(code => ({
                lang: LANGUAGES[code].hreflang,
                url: `${SITE_URL}${localizePath(code, originalPath)}`,
              })),
              {
                lang: `x-default`,
                url: `${SITE_URL}${localizePath(DEFAULT_LANGUAGE, originalPath)}`,
              },
            ]
          }
          return entry
        },
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `kalpilli`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/lasc.png`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [`gatsby-remark-responsive-iframe`],
      },
    },
    {
      resolve: `gatsby-plugin-google-gtag`,
      options: {
        // You can add multiple tracking ids and a pageview event will be fired for all of them.
        trackingIds: [
          "G-P0CNEGW276", // Google Analytics / GA
          // "AW-CONVERSION_ID", // Google Ads / Adwords / AW
          // "DC-FLOODIGHT_ID", // Marketing Platform advertising products (Display & Video 360, Search Ads 360, and Campaign Manager)
        ],
        // This object gets passed directly to the gtag config command
        // This config will be shared across all trackingIds
        // UNCOMMENT IF REQUIRES
        // gtagConfig: {
        //   optimize_id: "OPT_CONTAINER_ID",
        //   anonymize_ip: true,
        //   cookie_expires: 0,
        // },
        // This object is used for configuration specific to this plugin
        pluginConfig: {
          // Puts tracking script in the head instead of the body
          head: true,
          // Setting this parameter is also optional
          // respectDNT: true,
          // // Avoids sending pageview hits from custom paths
          // exclude: ["/preview/**", "/do-not-track/me/too/"],
          // // Defaults to https://www.googletagmanager.com
          // origin: "YOUR_SELF_HOSTED_ORIGIN",
          // // Delays processing pageview events on route update (in milliseconds)
          // delayOnRouteUpdate: 0,
        },
      },
    },
  ],
}
