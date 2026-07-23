const ORGANIZATION_ID = "https://certificacionmontessori.com/#organization"

const buildCourseSchema = ({
  pageUrl,
  name,
  description,
  language,
  programId,
}) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": `${pageUrl}#course`,
  name,
  description,
  url: pageUrl,
  inLanguage: language,
  courseCode: `AMMAC-${programId.toUpperCase()}`,
  provider: { "@id": ORGANIZATION_ID },
})

module.exports = { buildCourseSchema, ORGANIZATION_ID }
