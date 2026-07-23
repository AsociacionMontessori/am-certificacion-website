import * as React from "react"
import { Link } from "gatsby"
import { CheckIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"
import { useTranslation } from "react-i18next"
import Layout from "../components/layout"
import Nav from "../components/nav"
import Seo from "../components/seo"
import ProfessorsSection from "../components/professorsSection"
import ProgramDirectory from "../components/programs/ProgramDirectory"
import ProgramOfferPanel from "../components/programs/ProgramOfferPanel"
import { getT, useLocalization } from "../i18n"
import { LANGUAGES } from "../i18n/config"
import { getProgramaById } from "../data/programasOferta"
import { buildWhatsAppUrl } from "../data/contactoWhatsApp"
import { buildCourseSchema } from "../utils/programSchemas"

const { trackEvent } = require("../utils/analytics")

const ProgramLandingPage = ({ pageContext }) => {
  const programId = pageContext.programId
  const program = getProgramaById(programId)

  if (!program) {
    throw new Error(`Unknown program landing page: ${programId}`)
  }

  const { t } = useTranslation(["programs", "diplomados"])
  const { language, localizedPath } = useLocalization()
  const trackedViewRef = React.useRef("")
  const duration = t(`diplomados:programas.${programId}.duration`, {
    defaultValue: program.duration,
  })
  const whatsappUrl = buildWhatsAppUrl(
    t("common.whatsappMessage", {
      program: t(`${programId}.shortTitle`),
    })
  )

  React.useEffect(() => {
    const trackingKey = `${language}:${programId}:${window.location.pathname}`
    if (trackedViewRef.current === trackingKey) return
    trackedViewRef.current = trackingKey
    trackEvent("view_program", {
      language,
      program_id: programId,
      landing_path: window.location.pathname,
      cta_position: "program_page",
    })
  }, [language, programId])

  const focus = t(`${programId}.focus`, { returnObjects: true })
  const foundation = t("common.foundation", { returnObjects: true })

  return (
    <Layout>
      <article data-program-id={programId}>
        <header
          className="relative isolate overflow-hidden bg-gray text-white"
          style={{
            backgroundImage: "url('/backgrounds/diplomados.webp')",
            backgroundPosition: "center 38%",
            backgroundSize: "cover",
          }}
        >
          <div
            className="absolute inset-0 -z-10 bg-gray/85"
            aria-hidden="true"
          />
          <Nav textColor="text-white" />
          <div className="mx-auto grid max-w-6xl gap-9 px-5 pb-14 pt-4 sm:px-6 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12">
            <div className="min-w-0 pt-2">
              <Link
                to={localizedPath("/diplomados/")}
                className="text-sm font-semibold text-white underline decoration-yellow decoration-2 underline-offset-4"
              >
                {t("common.back")}
              </Link>
              <p className="mt-8 text-sm font-bold uppercase text-yellow">
                {t(`${programId}.eyebrow`)}
              </p>
              <h1 className="mt-3 max-w-3xl font-sans text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                {t(`${programId}.title`)}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/90 sm:text-xl">
                {t(`${programId}.intro`)}
              </p>
            </div>
            <ProgramOfferPanel program={program} programId={programId} />
          </div>
        </header>

        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:gap-x-16">
            <div>
              <p className="text-sm font-bold uppercase text-red">AMMAC</p>
              <h2 className="mt-2 text-2xl font-bold text-gray sm:text-3xl">
                {t("common.audienceTitle")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray/85 sm:text-lg">
                {t(`${programId}.audience`)}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray sm:text-3xl">
                {t("common.focusTitle")}
              </h2>
              <ul className="mt-5 list-none space-y-4 p-0 text-gray/85">
                {focus.map(item => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-green/20 text-gray">
                      <CheckIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-gray/10 bg-[#f5f7f4] py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:gap-x-16">
            <div>
              <h2 className="text-2xl font-bold text-gray sm:text-3xl">
                {t("common.foundationTitle")}
              </h2>
              <ul className="mt-5 list-none space-y-3 p-0 text-gray/85">
                {foundation.map(item => (
                  <li
                    key={item}
                    className="border-l-4 border-blue pl-4 leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray sm:text-3xl">
                {t("common.requirementsTitle")}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-gray/85">
                {t("common.requirements")}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray py-12 text-white sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-x-16">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                {t("common.credentialTitle")}
              </h2>
              <p className="mt-5 leading-relaxed text-white/85">
                {t(
                  program.tipo === "guia"
                    ? "common.guideCredential"
                    : "common.diplomaCredential"
                )}
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  trackEvent("click_whatsapp", {
                    language,
                    program_id: programId,
                    landing_path:
                      typeof window === "undefined"
                        ? ""
                        : window.location.pathname,
                    cta_position: "program_questions",
                    lead_channel: "whatsapp",
                  })
                }
                className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-md bg-green px-5 py-3 font-bold text-gray transition-colors hover:bg-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChatBubbleLeftRightIcon
                  className="h-5 w-5"
                  aria-hidden="true"
                />
                {t("common.whatsapp")}
              </a>
            </div>
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                {t("common.faqTitle")}
              </h2>
              <div className="mt-5 divide-y divide-white/20 border-y border-white/20">
                <details className="py-4">
                  <summary className="cursor-pointer font-semibold">
                    {t("common.faqOnlineQuestion")}
                  </summary>
                  <p className="mt-3 leading-relaxed text-white/80">
                    {t("common.faqOnlineAnswer")}
                  </p>
                </details>
                <details className="py-4">
                  <summary className="cursor-pointer font-semibold">
                    {t("common.faqDurationQuestion")}
                  </summary>
                  <p className="mt-3 leading-relaxed text-white/80">
                    {t("common.faqDurationAnswer", { duration })}
                  </p>
                </details>
                <details className="py-4">
                  <summary className="cursor-pointer font-semibold">
                    {t("common.faqCostQuestion")}
                  </summary>
                  <p className="mt-3 leading-relaxed text-white/80">
                    {t("common.faqCostAnswer")}
                  </p>
                </details>
              </div>
            </div>
          </div>
        </section>

        <ProfessorsSection />
        <ProgramDirectory excludeProgramId={programId} />
      </article>
    </Layout>
  )
}

export const Head = ({ location, pageContext }) => {
  const t = getT(location.pathname, "programs")
  const language = LANGUAGES[pageContext.language]?.htmlLang || "es-MX"
  const pageUrl = `https://certificacionmontessori.com${location.pathname}`
  const schema = buildCourseSchema({
    pageUrl,
    name: t(`${pageContext.programId}.title`),
    description: t(`${pageContext.programId}.seoDescription`),
    language,
    programId: pageContext.programId,
  })

  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/backgrounds/diplomados.webp"
        fetchPriority="high"
      />
      <Seo
        title={t(`${pageContext.programId}.seoTitle`)}
        description={t(`${pageContext.programId}.seoDescription`)}
        pathname={location.pathname}
        schema={[schema]}
      />
    </>
  )
}

export default ProgramLandingPage
