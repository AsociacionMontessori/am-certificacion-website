import * as React from "react"
import { Link } from "gatsby"
import { ArrowRightIcon } from "@heroicons/react/24/outline"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"

const { PROGRAM_LANDING_ROUTES } = require("../../data/programLandingRoutes")

const ProgramDirectory = ({ excludeProgramId = "" }) => {
  const { t } = useTranslation("programs")
  const { localizedPath } = useLocalization()
  const routes = PROGRAM_LANDING_ROUTES.filter(
    route => route.id !== excludeProgramId
  )

  return (
    <section className="bg-white py-12 sm:py-16">
      <nav
        aria-labelledby="other-programs-heading"
        className="mx-auto max-w-6xl px-5 sm:px-6"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-red">AMMAC</p>
          <h2
            id="other-programs-heading"
            className="mt-2 text-2xl font-bold text-gray sm:text-3xl"
          >
            {t("common.otherPrograms")}
          </h2>
        </div>
        <ul className="mt-7 grid list-none gap-px overflow-hidden rounded-md border border-gray/15 bg-gray/15 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {routes.map(route => (
            <li key={route.id} className="bg-white">
              <Link
                to={localizedPath(`/diplomados/${route.slug}/`)}
                className="group flex min-h-[72px] items-center justify-between gap-4 px-5 py-4 font-semibold text-gray transition-colors hover:bg-blue/5 hover:text-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue"
              >
                <span>{t(`${route.id}.shortTitle`)}</span>
                <ArrowRightIcon
                  className="h-5 w-5 flex-none text-blue transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}

export default ProgramDirectory
