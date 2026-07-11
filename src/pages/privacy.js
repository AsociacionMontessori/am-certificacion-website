import * as React from "react"
import { Trans, useTranslation } from "react-i18next"
import '../styles/global.css'
import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import { getT } from "../i18n"


const Privacy = () => {
    const { t } = useTranslation("legal")
    return (
    <Layout>

        <Nav textColor="text-white" />
        <main>
            <div className="max-w-screen-xl px-10 md:px-20 pb-8 mx-auto my-0 md:my-20">
                <div className="text-white max-w-auto mx-auto mt-20 mb-10">
                    <h2 className="text-2xl md:text-3xl xl:text-4xl font-bold ">
                        <Trans i18nKey="privacy.intro.titulo" ns="legal" components={{ rojo: <span className="text-red" /> }} />
                    </h2>
                    <p className="text-lg md:text-xl xl:text-2xl pt-3">
                        <Trans i18nKey="privacy.intro.p1" ns="legal" components={{ blanco: <span className="text-white" /> }} />
                    </p>
                </div>
                <div className="max-w-auto mx-auto mb-10 text-left dark:text-gray-300 text-white">
                    <h1 className="text-3xl text-white pt-3">{t("privacy.titulo")}</h1>
                    <p className="pt-2 text-sm font-semibold">{t("privacy.actualizacion")}</p>
                    <h2 className="text-2xl dark:text-white pt-3">{t("privacy.responsable.titulo")}</h2>
                    <p>{t("privacy.responsable.p1")}</p>
                    <h2 className="text-2xl dark:text-white pt-3">{t("privacy.fundamento.titulo")}</h2>
                    <p>{t("privacy.fundamento.p1")}</p>

                    <h2 className="text-2xl text-white pt-3">{t("privacy.recopilamos.titulo")}</h2>
                    <p>{t("privacy.recopilamos.p1")}</p>
                    <h2 className="text-2xl text-white pt-3">{t("privacy.uso.titulo")}</h2>
                    <p>{t("privacy.uso.p1")}</p>

                    <h2 className="text-2xl text-white pt-3">{t("privacy.analytics.titulo")}</h2>
                    <p>{t("privacy.analytics.p1")}</p>
                    <p className="pt-2">{t("privacy.analytics.p2")}</p>
                    <p className="pt-2">{t("privacy.analytics.exclusiones")}</p>
                    <a
                        href={t("privacy.analytics.proveedorUrl")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block pt-2 font-semibold underline decoration-red"
                    >
                        {t("privacy.analytics.proveedor")}
                    </a>

                    <h2 className="text-2xl text-white pt-3">{t("privacy.compartimos.titulo")}</h2>
                    <Trans i18nKey="privacy.compartimos.p1" ns="legal" />
                    <p className="italic text-sm">
                        {t("privacy.compartimos.nota")}
                    </p>
                    {t("privacy.compartimos.p2")}


                    <h2 className="text-2xl text-white pt-3">{t("privacy.modificaciones.titulo")}</h2>
                    <p>{t("privacy.modificaciones.p1")}</p>


                    <h2 className="text-2xl text-white pt-3">{t("privacy.arco.titulo")}</h2>
                    <p>{t("privacy.arco.p1")}</p>
                </div>
            </div>
        </main>
    </Layout>
    )
}
export const Head = ({ location }) => {
    const t = getT(location.pathname, "legal")
    return (
        <Seo
            title={t("privacy.seo.title")}
            pathname={location.pathname}
            description={t("privacy.seo.description")}
        />
    )
}

export default Privacy
