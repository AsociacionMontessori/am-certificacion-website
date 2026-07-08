import React, { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useTranslation } from "react-i18next"
import { getI18nInstance } from "../i18n"

export const FAQ_SLUGS = [
    "queOfrece",
    "modalidad",
    "certificacion",
    "equipoDocente",
    "temas",
    "estructuraPedagogica",
    "estandaresAmi",
    "documentos",
    "informes",
    "ubicacion",
]

/** Preguntas/respuestas desde el namespace "faq": las mismas claves alimentan
    el texto visible y el schema JSON-LD FAQPage. */
export const getFaqItems = (t) =>
    FAQ_SLUGS.map((slug) => ({
        question: t(`items.${slug}.pregunta`),
        answer: t(`items.${slug}.respuesta`),
    }))

/* Compatibilidad: contact.js construye su schema FAQPage a nivel de módulo a
   partir de FAQ_ITEMS; los textos salen de las mismas claves del namespace "faq". */
export const FAQ_ITEMS = getFaqItems(getI18nInstance("es").getFixedT("es", "faq"))

const Questions = () => {
    const { t } = useTranslation("faq")
    const faqItems = getFaqItems(t)
    const [respuestasVisibles, setRespuestasVisibles] = useState(Array(FAQ_SLUGS.length).fill(false));

    const toggleRespuesta = (index) => {
        const newRespuestasVisibles = [...respuestasVisibles];
        newRespuestasVisibles[index] = !newRespuestasVisibles[index];
        setRespuestasVisibles(newRespuestasVisibles);
    };
    return (
        <div className="bg-white w-10/12 md:w-8/12 m-10 rounded-tl-3xl rounded-br-3xl text-black selection:text-black selection:bg-green selection:bg-opacity-20">
            <div className="sm:p-10 p-2" id="Preguntas Frecuentes">
                <div className="md:p-5 p-2">
                    <h2  className="md:text-3xl lg:text-4xl text-xl font-medium text-red">{t("titulo")}</h2>
                    <p className="mt-4 max-w-4xl text-sm md:text-lg text-black/80">
                        {t("intro")}
                    </p>
                </div>
                <div className="md:p-5 p-2">
                    {faqItems.map((item, index) => (
                        <div key={index}>
                            <div className="flex items-center justify-between cursor-pointer sm:mt-10 mt-2" onClick={() => toggleRespuesta(index)}>
                                <h3 className="md:text-2xl lg:text-3xl text-base md:m-2 m-1 md:font-medium font-normal flex-grow">{item.question}</h3>
                                {respuestasVisibles[index] ?
                                    <ChevronUpIcon className="h-6 w-6 flex-shrink-0 min-w-[24px]" />
                                    :
                                    <ChevronDownIcon className="h-6 w-6 flex-shrink-0 min-w-[24px]" />}
                            </div>
                            {respuestasVisibles[index] && (
                                <p className="lg:text-2xl md:text-base text-xs m-1 my-2 md:m-4 font-light">{item.answer}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Questions
