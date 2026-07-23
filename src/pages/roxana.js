import * as React from "react"
import { Trans, useTranslation } from "react-i18next"

import Layout from "../components/layout"
import Seo from "../components/seo"
import img1 from '../images/rox.jpg'
import Nav from "../components/nav"
import RoxanaBooksSection from "../components/RoxanaBooksSection"
import { StaticImage } from "gatsby-plugin-image"
import { getT } from "../i18n"


const Roxana = () => {
    const { t } = useTranslation("roxana")

    const introParagraphs = [
        { id: "roxana-formacion", i18nKey: "intro.formacion" },
        { id: "roxana-trayectoria", i18nKey: "intro.trayectoria" },
    ]

    const columnKeys = ["liderazgo", "academicas", "capacitadora", "compromiso"]

    return (
        <Layout>
            <Nav textColor="dark:text-white text-black" />
            <main className="py-10 lg:py-40 bg-gradient-to-r from-blue via-purple to-green pt-5 w-full  overflow-x-hidden">
                <section className="bg-gradient-to-r from-blue via-purple to-green">
                    <div className="container px-6 lg:pb-12 pb-6 mx-auto">
                        <h1 className="tpx-6 mt-2 text-2xl font-bold md:text-4xl dark:text-white text-center">
                            {t("header.title")}
                        </h1>
                        <div className="pt-10 max-w-8xl flex items-center h-auto flex-wrap mx-auto my-16 lg:my-5">
                            <div id="profile" className="w-full lg:w-3/5 rounded-lg lg:rounded-l-lg lg:rounded-r-none shadow-2xl bg-white opacity-70 mx-6 lg:mx-0">
                                <div className="p-4 md:p-12 text-center lg:text-left">
                                    <div
                                        className="block lg:hidden rounded-full shadow-xl mx-auto -mt-16 h-48 w-48 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${img1})` }}
                                    >

                                    </div>
                                    <h2 className="text-3xl font-bold pt-8 lg:pt-0 text-blue">{t("perfil.nombre")}</h2>
                                    <div className="mx-auto lg:mx-0 w-full pt-3 border-b-2 border-green-500 opacity-25"></div>
                                    <p className="pt-2 text-red text-xs lg:text-sm flex items-center justify-center lg:justify-start"><svg className="h-4 fill-current text-green-700 pr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm7.75-8a8.01 8.01 0 0 0 0-4h-3.82a28.81 28.81 0 0 1 0 4h3.82zm-.82 2h-3.22a14.44 14.44 0 0 1-.95 3.51A8.03 8.03 0 0 0 16.93 14zm-8.85-2h3.84a24.61 24.61 0 0 0 0-4H8.08a24.61 24.61 0 0 0 0 4zm.25 2c.41 2.4 1.13 4 1.67 4s1.26-1.6 1.67-4H8.33zm-6.08-2h3.82a28.81 28.81 0 0 1 0-4H2.25a8.01 8.01 0 0 0 0 4zm.82 2a8.03 8.03 0 0 0 4.17 3.51c-.42-.96-.74-2.16-.95-3.51H3.07zm13.86-8a8.03 8.03 0 0 0-4.17-3.51c.42.96.74 2.16.95 3.51h3.22zm-8.6 0h3.34c-.41-2.4-1.13-4-1.67-4S8.74 3.6 8.33 6zM3.07 6h3.22c.2-1.35.53-2.55.95-3.51A8.03 8.03 0 0 0 3.07 6z" /></svg>
                                        {t("perfil.ubicacion")}
                                    </p>
                                    <div className="pt-4 space-y-4 text-md text-black">
                                        {introParagraphs.map((paragraph) => (
                                            <p key={paragraph.id}>
                                                <Trans i18nKey={paragraph.i18nKey} ns="roxana" />
                                            </p>
                                        ))}
                                    </div>

                                </div>

                            </div>

                            <div className="w-full lg:w-2/6">
                                <div className="hidden lg:block">
                                    <StaticImage src="../images/rox.jpg" className="rounded-none lg:rounded-lg shadow-2xl" placeholder="bl" alt="Roxana Muñoz" />
                                </div>
                                {/* <img src={img1} alt="Roxana Muñoz"  /> */}
                            </div>

                        </div>
                    </div>
                </section>
                <section>
                    <div className="container px-6 pb-12 mx-auto">
                        {/* create 4 cols with tailwind */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs md:text-lg text-left">
                            {columnKeys.map((key) => (
                                <div key={key} className="flex flex-col pb-3">
                                    <h2 className="tpx-6 mt-2 font-bold text-white">
                                        {t(`columnas.${key}.titulo`)}
                                    </h2>
                                    <p className="text-white text-sm">
                                        <Trans i18nKey={`columnas.${key}.parrafo`} ns="roxana" />
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <RoxanaBooksSection />
            </main>
        </Layout>
    )
}

const buildRoxanaSchema = t => [
    {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": "https://certificacionmontessori.com/roxana/#person",
        name: t("schema.nombre"),
        jobTitle: t("schema.puesto"),
        description: t("schema.descripcion"),
        worksFor: { "@id": "https://certificacionmontessori.com/#organization" },
        homeLocation: {
            "@type": "Place",
            name: t("schema.ubicacion"),
        },
        url: "https://certificacionmontessori.com/roxana/",
    },
]

export const Head = ({ location }) => {
    const t = getT(location.pathname, "roxana")
    return (
        <Seo
            title={t("seo.title")}
            pathname={location.pathname}
            description={t("seo.description")}
            schema={buildRoxanaSchema(t)}
        />
    )
}
export default Roxana
