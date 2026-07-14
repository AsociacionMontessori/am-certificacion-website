import * as React from "react"
import { Trans, useTranslation } from "react-i18next"
import '../styles/global.css'
import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import { getT } from "../i18n"

const Reembolsos = () => {
    const { t } = useTranslation("legal")
    return (
    <Layout>
        <Nav textColor="text-white" />
        <main>
            <div className="max-w-screen-xl px-10 md:px-20 pb-8 mx-auto my-0 md:my-20">
                <div className="text-white max-w-auto mx-auto mt-20 mb-10">
                    <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold ">
                        <Trans i18nKey="reembolsos.intro.titulo" ns="legal" components={{ rojo: <span className="text-red" /> }} />
                    </h1>
                    <p className="text-lg md:text-xl xl:text-2xl pt-3">
                        {t("reembolsos.intro.p1")}
                    </p>
                </div>

                <div className="max-w-auto mx-auto mb-10 text-left text-white">

                    <h2 className="text-2xl text-white pt-6">{t("reembolsos.s1.titulo")}</h2>
                    <p className="pt-2">
                        <Trans i18nKey="reembolsos.s1.p1" ns="legal" />
                    </p>

                    <h2 className="text-2xl text-white pt-6">{t("reembolsos.s2.titulo")}</h2>
                    <p className="pt-2">
                        {t("reembolsos.s2.p1")}
                    </p>

                    <h2 className="text-2xl text-white pt-6">{t("reembolsos.s3.titulo")}</h2>
                    <p className="pt-2">
                        <Trans i18nKey="reembolsos.s3.p1" ns="legal" />
                    </p>
                    <p className="pt-2">
                        <Trans i18nKey="reembolsos.s3.p2" ns="legal" />
                    </p>

                    <h2 className="text-2xl text-white pt-6">{t("reembolsos.s4.titulo")}</h2>
                    <p className="pt-2">
                        <Trans i18nKey="reembolsos.s4.p1" ns="legal" />
                    </p>

                    <h2 className="text-2xl text-white pt-6">{t("reembolsos.s5.titulo")}</h2>
                    <p className="pt-2">
                        <Trans
                            i18nKey="reembolsos.s5.p1"
                            ns="legal"
                            components={{
                                linkCorreo: <a className="underline decoration-red" href="mailto:admin@certificacionmontessori.com" />,
                            }}
                        />
                    </p>
                    <ul className="list-disc list-inside pt-2 pl-4">
                        {t("reembolsos.s5.lista", { returnObjects: true }).map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                    <p className="pt-2">
                        <Trans
                            i18nKey="reembolsos.s5.p2"
                            ns="legal"
                            components={{
                                linkWhatsapp: <a className="underline decoration-red" href="https://api.whatsapp.com/send?phone=5215548885013" target="_blank" rel="noopener noreferrer" />,
                                linkTelefono: <a className="underline decoration-red" href="tel:5555152701" />,
                            }}
                        />
                    </p>

                    <h2 className="text-2xl text-white pt-6">{t("reembolsos.s6.titulo")}</h2>
                    <p className="pt-2">
                        <Trans i18nKey="reembolsos.s6.p1" ns="legal" />
                    </p>

                    <h2 className="text-2xl text-white pt-6">{t("reembolsos.s7.titulo")}</h2>
                    <p className="pt-2">
                        <Trans i18nKey="reembolsos.s7.p1" ns="legal" />
                    </p>

                    <h2 className="text-2xl text-white pt-6">{t("reembolsos.s8.titulo")}</h2>
                    <p className="pt-2">
                        {t("reembolsos.s8.p1")}
                    </p>

                    <p className="text-sm italic pt-6 opacity-80">
                        {t("reembolsos.actualizacion")}
                    </p>
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
            title={t("reembolsos.seo.title")}
            description={t("reembolsos.seo.description")}
            pathname={location.pathname}
        />
    )
}

export default Reembolsos
