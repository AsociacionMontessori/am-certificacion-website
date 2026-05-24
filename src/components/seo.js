import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"

const normalizePathname = pathname => {
  if (!pathname || pathname === "/") return "/"
  return `${pathname.replace(/\/+$/, "")}/`
}

const formatBreadcrumbName = segment =>
  decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase())

const buildBreadcrumbSchema = ({ pathname, canonicalUrl, title }) => {
  const normalizedPathname = normalizePathname(pathname)
  if (normalizedPathname === "/") return null

  const segments = normalizedPathname.split("/").filter(Boolean)
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: "https://certificacionmontessori.com/",
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
      item: isLast ? canonicalUrl : `https://certificacionmontessori.com${currentPath}/`,
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
  const pageUrl = canonicalUrl || `${siteUrl}${normalizedPathname}`
  const imageUrl = image || `${siteUrl}${metadata?.defaultOgImage || "/og-default.svg"}`
  const fullTitle = defaultTitle ? `${title} | ${defaultTitle}` : title
  const shouldIndex = !robots.includes("noindex")

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: metadata?.organizationName || defaultTitle,
    legalName: metadata?.legalName || metadata?.organizationName || defaultTitle,
    url: siteUrl,
    description: metadata?.description,
    email: metadata?.email,
    telephone: metadata?.telephone,
    logo: imageUrl,
    sameAs: metadata?.sameAs || [],
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
        url: metadata?.whatsappUrl,
        description: metadata?.whatsappHours,
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
    name: metadata?.siteName || defaultTitle,
    alternateName: metadata?.organizationName || defaultTitle,
    url: siteUrl,
    inLanguage: metadata?.language || "es-MX",
  }

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: metaDescription,
    url: pageUrl,
    inLanguage: metadata?.language || "es-MX",
    isPartOf: {
      "@type": "WebSite",
      url: siteUrl,
      name: metadata?.siteName || defaultTitle,
    },
  }

  const breadcrumbSchema = buildBreadcrumbSchema({
    pathname: normalizedPathname,
    canonicalUrl: pageUrl,
    title,
  })

  const schemas = shouldIndex
    ? [organizationSchema, websiteSchema, webpageSchema, breadcrumbSchema, ...schema].filter(Boolean)
    : schema.filter(Boolean)

  return (
    <>
      <html lang={metadata?.language || "es-MX"} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={robots} />
      <meta name="google-site-verification" content="qR4NlpCyKRj2wf5mCfzwaVhpjFHCaqBGwCgaSO8oans" />
      <meta name="language" content={metadata?.language || "es-MX"} />
      <meta name="author" content={metadata?.organizationName || "Asociación Montessori"} />
      <link rel="canonical" href={pageUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={metadata?.siteName || defaultTitle} />
      <meta property="og:locale" content="es_MX" />
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
