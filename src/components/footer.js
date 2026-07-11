import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../i18n"
import { buildWhatsAppUrl } from "../data/contactoWhatsApp"
import TrackedActionLink from "./TrackedActionLink"
import { openAnalyticsConsent } from "../utils/analyticsConsent"

export default function Footer() {
    const { t } = useTranslation("footer")
    const { t: tc } = useTranslation("common")
    const { language, localizedPath } = useLocalization()
    const whatsappInformesUrl = buildWhatsAppUrl(t("whatsapp.mensajeInformes"))
    return (
        <footer className="bg-gray-700 text-white pb-8 flex flex-col justify-center items-center max-w-full">
            <div className=" pl-0 lg:pl-20 xl:pl-10 2xl:pl-0 py-4 px-1 flex flex-col md:flex-row justify-start items-center w-full">
                <a href="#home" className="flex mx-6 justify-center p-1.5 lg:p-4 items-center lg:w-4/12 md:w-9/12">
                    <StaticImage src="../images/lasc.png" className="w-14 h-14 m-1.5" alt={t("ammac.logoAlt")} />
                    <div className="m-1.5 lg:text-base text-sm ">
                        <div className="font-medium">{t("ammac.nombre")}</div>
                        <p>{t("ammac.derechos")}</p>
                    </div>
                </a>
                <div className="flex mx-2 justify-center p-4 items-center lg:w-4/12 md:w-9/12">
                    <StaticImage src="../images/lsems.png" className="w-14 h-14 m-1.5" alt={t("sems.logoAlt")} />
                    <div className="m-1.5 lg:text-base text-sm ">
                        <div className="font-medium">{t("sems.nombre")}</div>
                    </div>
                </div>
            </div>

            <p className="text-xs text-white/70 text-center max-w-3xl px-4 mb-2">
                {t("leyenda")}
            </p>

            <div className="bg-gray-700 mt-8 text-xs">
                <div className="mx-1 md:mx-10  sm:py-0 md:py-2 lg:py-4 px-1 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-0">
                    <div className="lg:pl-16 pl-0 text-center md:text-left m-4 md:m-0">
                        <h3 className="text-lg font-semibold mb-2">{t("asociacion.titulo")}</h3>
                        <a target="_blank" className="hover:underline decoration-red" href={`${localizedPath("/diplomados/")}#certificacion_internacional`}>
                            <p>{t("asociacion.diplomados")}</p>
                        </a>
                        <a target="_blank" className="hover:underline decoration-red" href={`${localizedPath("/")}#sobrenosotros`}>
                            <p>{t("asociacion.sobreNosotros")}</p>
                        </a>
                        <a target="_blank" className="hover:underline decoration-red" href={localizedPath("/publicaciones/")}>
                            <p>{t("asociacion.publicaciones")}</p>
                        </a>
                        <a target="_blank" className="hover:underline decoration-red" href={localizedPath("/contact/")}>
                            <p>{t("asociacion.contacto")}</p>
                        </a>
                        <a target="_blank" className="hover:underline decoration-red" href={localizedPath("/ia/")}>
                            <p>{t("asociacion.indiceIa")}</p>
                        </a>
                        <a target="_blank" className="hover:underline decoration-red" href={`${localizedPath("/contact/")}#Preguntas Frecuentes`}>
                            <p>{t("asociacion.preguntasFrecuentes")}</p>
                        </a>
                    </div>
                    <div className="text-center md:text-left m-4 md:m-0">
                        <h3 className="text-lg font-semibold mb-2">{t("legal.titulo")}</h3>
                        <a className="hover:underline decoration-red" href={localizedPath("/privacy/")} target="_blank" rel="noopener noreferrer">{t("legal.avisoPrivacidad")}</a>
                        <br />
                        <a className="hover:underline decoration-red" href={localizedPath("/reembolsos/")} target="_blank" rel="noopener noreferrer">{t("legal.politicaReembolsos")}</a>
                        <br />
                        <a className="hover:underline decoration-red" href="https://drive.google.com/file/d/1XaVbYjwltjMJjcjvCuqdhKIAFvxjecOJ/view" target="_blank" rel="noopener noreferrer">{t("legal.constanciaSeguridad")}</a>
                        <br />
                        <a className="hover:underline decoration-red" href='https://drive.google.com/file/d/1mE54tJUcoFfaX4mJQjaD7slE_ESlPY-r/view' target='_blank' rel="noopener noreferrer">{t("legal.vistoBuenoSeguridad")}</a>
                        <br />
                        <button
                            type="button"
                            onClick={() => openAnalyticsConsent()}
                            className="mt-2 underline decoration-red focus:outline-none focus:ring-2 focus:ring-red"
                        >
                            {tc("analyticsConsent.settings")}
                        </button>
                    </div>
                    <div className="text-center md:text-left m-4 md:m-0">
                        <h3 className="text-lg font-semibold mb-2">{t("escuelas.titulo")}</h3>
                        <a className="hover:underline decoration-red italic" href="https://www.google.com.mx/maps/place/Primaria+Montessori+Kalpilli/@19.3925921,-99.1847762,17z/data=!4m6!3m5!1s0x85d1ff7b7998ce53:0x3f544be41b8ca559!8m2!3d19.3928452!4d-99.1838964!16s%2Fg%2F11sj5sp5xh?entry=ttu"  target="_blank" rel="noopener noreferrer">{t("escuelas.kalpilli")}</a> {t("escuelas.verEnMapa")}
                        <br />
                        <a href="mailto:admin@certificacionmontessori.com" target="_blank" rel="noopener noreferrer">{t("escuelas.email")}</a>
                        <br />
                        <a href="tel:5555152701" target="_blank" rel="noopener noreferrer">{t("escuelas.telefono")}</a>
                        <br />
                        <TrackedActionLink
                            href={whatsappInformesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            eventName="click_whatsapp"
                            eventParams={{
                                language,
                                landing_path: typeof window === "undefined" ? "" : window.location.pathname,
                                cta_position: "footer",
                                lead_channel: "whatsapp",
                            }}
                        >
                            {t("escuelas.whatsapp")}
                        </TrackedActionLink>
                        <br />
                        <span className="text-white/70">{t("escuelas.atencionChat")}</span>
                        <br />
                        <a className="hover:underline decoration-red w-1/4" href="https://www.google.com.mx/maps/place/Primaria+Montessori+Kalpilli/@19.3925921,-99.1847762,17z/data=!4m6!3m5!1s0x85d1ff7b7998ce53:0x3f544be41b8ca559!8m2!3d19.3928452!4d-99.1838964!16s%2Fg%2F11sj5sp5xh?entry=ttu" target="_blank" rel="noopener noreferrer" >{t("escuelas.direccion")}</a>
                    </div>
                    <div className="text-center md:text-left m-4 md:m-0 flex flex-col md:items-left items-center">
                        <h3 className="text-lg font-semibold mb-2">{t("redes.titulo")}</h3>
                        <div className="flex items-center">
                            <a href="https://www.instagram.com/asociacionmontessori/"
                                target="_blank" rel="noopener noreferrer">
                                <StaticImage src="../images/instagram.png" className="w-6 h-6 mr-8  md:mr-0 lg:mr-2" alt={t("redes.instagramAlt")} />
                            </a>
                            <a href="https://www.linkedin.com/in/asociaci%C3%B3n-montessori-de-m%C3%A9xico-a-c-5a868417a/?originalSubdomain=mx"
                                target="_blank" rel="noopener noreferrer">
                                <StaticImage src="../images/linkedin.png" alt={t("redes.linkedinAlt")} className="w-6 h-6 mr-8   md:mr-0 lg:mr-2" />
                            </a>
                            <a href="https://www.youtube.com/@montessorimx"
                                target="_blank" rel="noopener noreferrer">
                                <StaticImage src="../images/youtube.png" alt={t("redes.youtubeAlt")} className="w-6 h-6 mr-8   md:mr-0 lg:mr-2" />
                            </a>
                            <a href="https://www.facebook.com/asociacionmontessori"
                                target="_blank" rel="noopener noreferrer">
                                <StaticImage src="../images/facebook.png" alt={t("redes.facebookAlt")} className="w-6 h-6 mr-8   md:mr-0 lg:mr-2" />
                            </a>
                            <a href="https://www.tiktok.com/@montessorimx"
                                target="_blank" rel="noopener noreferrer">
                                <StaticImage src="../images/tik-tok.png" alt={t("redes.tiktokAlt")} className="w-6 h-6 " />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
