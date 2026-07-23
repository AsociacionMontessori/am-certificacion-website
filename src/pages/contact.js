import React from "react";
import { useTranslation } from "react-i18next";

import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import Questions, { getFaqItems } from "../components/questions"
import { getT, useLocalization } from "../i18n"
import TrackedActionLink from "../components/TrackedActionLink"

import '../styles/publications.css'
import '../styles/wordpress_publications.css'

const iconsSize = "w-20 h-20"

const Contact = () => {
    const { t } = useTranslation("contact")
    return (
        <>
            <Layout>
                <main>
                    <section
                        className="relative overflow-hidden bg-cover bg-center text-white"
                        style={{ backgroundImage: "url('/backgrounds/contacto.webp')" }}
                    >
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-blue/90 via-purple/85 to-green/90" />
                        <Nav textColor="text-white" />
                        <div className="container relative z-10 px-6 py-12 mx-auto">
                            <div className="selection:text-white selection:bg-green selection:bg-opacity-20">
                                <h1 className="mt-2 text-4xl font-semibold text-gray-800 md:text-8xl dark:text-white">{t("hero.title")}</h1>
                                <p className="mt-3 ">{t("hero.description")}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-xs md:text-lg text-left">
                                {contactMethods.map((method, index) => (
                                    <ContactMethod
                                        key={index}
                                        icon={method.icon}
                                        link={method.link}
                                        title={t(`methods.${method.key}.title`)}
                                        description={t(`methods.${method.key}.description`)}
                                        methodKey={method.key}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                    <section className="bg-white">
                        <div className="container px-6 py-12 mx-auto text-center">
                            <h2 className="text-2xl font-semibold text-gray">{t("social.title")}</h2>
                            <p className="max-w-2xl mx-auto mt-3 text-gray/80">{t("social.description")}</p>
                            <div className="flex flex-wrap justify-center gap-3 mt-6">
                                {socialProfiles.map(profile => (
                                    <a
                                        key={profile.key}
                                        href={profile.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-5 py-3 font-medium text-blue border border-blue rounded-sm hover:bg-blue/10 focus:outline-none focus:ring-2 focus:ring-blue"
                                    >
                                        {t(`social.${profile.key}`)}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </section>
                    <section className="flex justify-center bg-gradient-to-r from-blue via-purple to-green">
                        <Questions />
                    </section>
                </main>
            </Layout>
        </>
    )
}

const ContactMethod = ({ icon, title, link, description, methodKey }) => {
    const { language } = useLocalization()
    const isWhatsApp = methodKey === "whatsapp"
    const className = "flex flex-col items-center justify-center text-center selection:text-white selection:bg-green selection:bg-opacity-20"
    const contents = (
        <div className={className}>
            <span className={`md:p-3 text-blue-500 rounded-full bg-blue-100/80 dark:bg-gray-800 ${iconsSize}`}>
                {icon}
            </span>
            <h2 className="mt-4 text-sm sm:font-medium md:text-lg text-gray-800 dark:text-white">{title}</h2>
            <p className="mt-2">{description}</p>
        </div>
    )

    if (!isWhatsApp) {
        return <a href={link} target="_blank" rel="noopener noreferrer" className={className}>{contents}</a>
    }

    return (
        <TrackedActionLink
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            eventName="click_whatsapp"
            eventParams={{
                language,
                landing_path: typeof window === "undefined" ? "" : window.location.pathname,
                cta_position: "contact_whatsapp",
                lead_channel: "whatsapp",
            }}
            className={className}
        >
            {contents}
        </TrackedActionLink>
    )
}


const contactMethods = [
    {
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={iconsSize}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
        ),
        key: "email",
        link: "mailto:admin@certificacionmontessori.com"
    },
    {
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={iconsSize}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
        ),
        key: "ubicacion",
        link: "https://maps.app.goo.gl/9EqAmfUryR5RB65W8"
    },
    {
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={iconsSize}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
        ),
        key: "telefono",
        link: "tel:5555152701"
    },
    {
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={iconsSize}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 10.5h9m-9 3h5.25M6.75 3.75h10.5A2.25 2.25 0 0119.5 6v12a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18V6a2.25 2.25 0 012.25-2.25z" />
            </svg>
        ),
        key: "whatsapp",
        link: "https://api.whatsapp.com/send?phone=5215548885013&text=Hola,%20Me%20gustar%C3%ADa%20informaci%C3%B3n%20sobre%20la%20certificaci%C3%B3n%20Montessori."
    },
];

const socialProfiles = [
    {
        key: "facebook",
        href: "https://www.facebook.com/asociacionmontessori/",
    },
    {
        key: "instagram",
        href: "https://www.instagram.com/asociacionmontessori/",
    },
]



const buildFaqSchema = tFaq => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: getFaqItems(tFaq).map(item => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
        },
    })),
})

const buildContactSchema = (t, tFaq) => [
    {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: t("schema.contactPage.name"),
        description: t("schema.contactPage.description"),
        url: "https://certificacionmontessori.com/contact/",
    },
    {
        "@context": "https://schema.org",
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "admin@certificacionmontessori.com",
        telephone: "+52 55 5515 2701",
        availableLanguage: ["es"],
    },
    {
        "@context": "https://schema.org",
        "@type": "ContactPoint",
        contactType: "WhatsApp support",
        telephone: "+52 1 55 4888 5013",
        url: "https://api.whatsapp.com/send?phone=5215548885013&text=Hola,%20Me%20gustar%C3%ADa%20informaci%C3%B3n%20sobre%20la%20certificaci%C3%B3n%20Montessori.",
        description: t("schema.whatsapp.description"),
        availableLanguage: ["es"],
    },
    buildFaqSchema(tFaq),
]

export const Head = ({ location }) => {
    const t = getT(location.pathname, "contact")
    const tFaq = getT(location.pathname, "faq")
    return (
        <Seo
            title={t("seo.title")}
            pathname={location.pathname}
            description={t("seo.description")}
            schema={buildContactSchema(t, tFaq)}
        />
    )
}


export default Contact
