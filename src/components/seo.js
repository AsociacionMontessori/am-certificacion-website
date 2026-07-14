import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"
import {
  LANGUAGES,
  LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  INDEX_TRANSLATIONS,
  parsePath,
  localizePath,
  isLocalizedPath,
} from "../i18n/config"
import { getT } from "../i18n"
import { buildWhatsAppUrl } from "../data/contactoWhatsApp"

const normalizePathname = pathname => {
  if (!pathname || pathname === "/") return "/"
  return `${pathname.replace(/\/+$/, "")}/`
}

const formatBreadcrumbName = segment =>
  decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase())

// El breadcrumb se construye sobre la ruta canónica en español (sin el prefijo
// de idioma) y luego se localiza cada URL: así /en/diplomados/ produce
// «Home › Diploma Courses» y no «Home › En › Diplomados».
const buildBreadcrumbSchema = ({ siteUrl, language, originalPath, canonicalUrl, title, homeName }) => {
  if (originalPath === "/") return null

  const segments = originalPath.split("/").filter(Boolean)
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: homeName || "Inicio",
      item: `${siteUrl}${localizePath(language, "/")}`,
    },
  ]

  let currentPath = ""
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    items.push({
      "@type": "ListItem",
      position: index + 2,
      name: isLast && title ? title : formatBreadcrumbName(segment),
      item: isLast ? canonicalUrl : `${siteUrl}${localizePath(language, `${currentPath}/`)}`,
    })
  })

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  }
}

function Seo({
  description,
  title,
  pathname = "/",
  canonicalUrl,
  image,
  type = "website",
  robots = "index,follow",
  schema = [],
  children,
}) {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            siteName
            description
            author
            siteUrl
            defaultOgImage
            language
            organizationName
            legalName
            email
            telephone
            whatsappUrl
            whatsappNumber
            whatsappHours
            address
            streetAddress
            addressLocality
            addressRegion
            postalCode
            addressCountry
            sameAs
            foundingDate
            slogan
            areaServedCountries
          }
        }
      }
    `
  )

  const metadata = site.siteMetadata
  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = metadata?.title
  const siteUrl = metadata?.siteUrl?.replace(/\/$/, "") || "https://certificacionmontessori.com"
  const normalizedPathname = normalizePathname(pathname)

  // Idioma y ruta canónica en español derivados del pathname (/en/…, /pt-br/…)
  const { language, originalPath } = parsePath(normalizedPathname)
  const lang = LANGUAGES[language] || LANGUAGES[DEFAULT_LANGUAGE]
  const hasTranslations = isLocalizedPath(originalPath)
  // Las versiones EN/PT-BR quedan en noindex hasta que la traducción humana esté lista
  const effectiveRobots =
    language !== DEFAULT_LANGUAGE && !INDEX_TRANSLATIONS ? "noindex,follow" : robots

  const pageUrl = canonicalUrl || `${siteUrl}${normalizedPathname}`
  const imageUrl = image || `${siteUrl}${metadata?.defaultOgImage || "/og-default.svg"}`
  const titleHasBrand =
    defaultTitle && title.toLocaleLowerCase().includes(defaultTitle.toLocaleLowerCase())
  const fullTitle = defaultTitle && !titleHasBrand ? `${title} | ${defaultTitle}` : title
  const shouldIndex = !effectiveRobots.includes("noindex")

  // Textos del JSON-LD en el idioma de la página (el Head se renderiza fuera
  // del provider de i18next, así que se resuelve el idioma desde el pathname).
  const tc = getT(normalizedPathname, "common")
  const countries = tc("schema.paises", { returnObjects: true })
  const whatsappUrl = buildWhatsAppUrl(tc("schema.whatsappMensaje"))
  const areaServed = (Array.isArray(countries) ? countries : []).map(country => ({
    "@type": "Country",
    name: country,
  }))

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: metadata?.organizationName || defaultTitle,
    legalName: metadata?.legalName || metadata?.organizationName || defaultTitle,
    url: siteUrl,
    description: tc("schema.description"),
    slogan: tc("schema.slogan"),
    foundingDate: metadata?.foundingDate,
    email: metadata?.email,
    telephone: metadata?.telephone,
    logo: imageUrl,
    sameAs: metadata?.sameAs || [],
    areaServed,
    knowsLanguage: ["es", "en", "pt-BR"],
    knowsAbout: tc("schema.knowsAbout", { returnObjects: true }),
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      name: tc("schema.credencial.nombre"),
      credentialCategory: "certification",
      description: tc("schema.credencial.descripcion"),
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: metadata?.email,
        telephone: metadata?.telephone,
        availableLanguage: ["es"],
      },
      {
        "@type": "ContactPoint",
        contactType: "WhatsApp support",
        telephone: metadata?.whatsappNumber,
        url: whatsappUrl,
        description: tc("schema.whatsappHorario"),
        availableLanguage: ["es"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: metadata?.streetAddress,
      addressLocality: metadata?.addressLocality,
      addressRegion: metadata?.addressRegion,
      postalCode: metadata?.postalCode,
      addressCountry: metadata?.addressCountry,
    },
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: tc("schema.siteName"),
    alternateName: metadata?.organizationName || defaultTitle,
    url: siteUrl,
    inLanguage: lang.htmlLang,
  }

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: metaDescription,
    url: pageUrl,
    inLanguage: lang.htmlLang,
    isPartOf: {
      "@type": "WebSite",
      url: siteUrl,
      name: tc("schema.siteName"),
    },
  }

  const breadcrumbSchema = buildBreadcrumbSchema({
    siteUrl,
    language,
    originalPath,
    canonicalUrl: pageUrl,
    title,
    homeName: tc("breadcrumb.inicio"),
  })

  const schemas = shouldIndex
    ? [organizationSchema, websiteSchema, webpageSchema, breadcrumbSchema, ...schema].filter(Boolean)
    : schema.filter(Boolean)

  return (
    <>
      <html lang={lang.htmlLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={effectiveRobots} />
      <meta name="google-site-verification" content="qR4NlpCyKRj2wf5mCfzwaVhpjFHCaqBGwCgaSO8oans" />
      <meta name="language" content={lang.htmlLang} />
      <meta name="author" content={metadata?.organizationName || "Asociación Montessori"} />
      <link rel="canonical" href={pageUrl} />
      {hasTranslations &&
        LANGUAGE_CODES.map(code => (
          <link
            key={`alt-${code}`}
            rel="alternate"
            hrefLang={LANGUAGES[code].hreflang}
            href={`${siteUrl}${localizePath(code, originalPath)}`}
          />
        ))}
      {hasTranslations && (
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${siteUrl}${localizePath(DEFAULT_LANGUAGE, originalPath)}`}
        />
      )}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={metadata?.siteName || defaultTitle} />
      <meta property="og:locale" content={lang.ogLocale} />
      {hasTranslations &&
        LANGUAGE_CODES.filter(code => code !== language).map(code => (
          <meta
            key={`og-alt-${code}`}
            property="og:locale:alternate"
            content={LANGUAGES[code].ogLocale}
          />
        ))}
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={metadata?.organizationName || defaultTitle} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={metadata?.author || ``} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
      {schemas.map((item, index) => (
        <script key={`schema-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
      {children}
    </>
  )
}

export default Seo
