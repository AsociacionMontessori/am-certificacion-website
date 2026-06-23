import React, { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

export const FAQ_ITEMS = [
    {
        question: "¿Qué ofrece certificacionmontessori.com?",
        answer: "El sitio público de la Asociación Montessori de México A.C. reúne información institucional sobre diplomados, certificaciones, publicaciones, perfiles docentes, contacto y recursos abiertos relacionados con la formación Montessori."
    },
    {
        question: "¿Los diplomados son en línea o presenciales?",
        answer: "Los diplomados mostrados en el sitio están planteados como programas en línea. El contenido público explica que puedes estudiar desde cualquier lugar con acompañamiento de catedráticos y acceso a plataforma digital."
    },
    {
        question: "¿Qué certificación obtengo al terminar?",
        answer: "La oferta pública del sitio comunica que los programas cuentan con certificación internacional y están orientados a formarte como Guía Montessori. Los detalles específicos se concentran en la página de Diplomados."
    },
    {
        question: "¿Quiénes forman parte del equipo docente?",
        answer: "En la sección de profesores del diplomado se presentan perfiles públicos como Roxana Muñoz, Iván López Carmona y Carlos Romero, con información sobre su trayectoria, formación y rol dentro del programa."
    },
    {
        question: "¿Qué temas se estudian en los diplomados?",
        answer: "El sitio menciona materias como Filosofía Montessori, Métodos de Observación, Neuroeducación, Psicología Educativa, Musicoterapia y Psicomotricidad, además de materiales y estructura por bloques de trabajo."
    },
    {
        question: "¿Qué documentos se solicitan para el certificado?",
        answer: "En la página de diplomados se informa que para el certificado con validez internacional se solicitan comprobante de domicilio, identificación oficial, acta de nacimiento y último certificado de estudios."
    },
    {
        question: "¿Cómo puedo pedir informes o iniciar contacto?",
        answer: "Puedes escribir a admin@certificacionmontessori.com, llamar al 55 5515 2701 o contactar por WhatsApp en el 55 4888 5013. El WhatsApp se atiende de 9am a 6pm y es solo por chat."
    },
    {
        question: "¿Dónde se encuentra la Asociación Montessori de México?",
        answer: "La dirección pública mostrada en el sitio es Avenida Dos 48, San Pedro de los Pinos, Benito Juárez, 03800 Ciudad de México, CDMX."
    },
]

const Questions = () => {
    const [respuestasVisibles, setRespuestasVisibles] = useState(Array(FAQ_ITEMS.length).fill(false));

    const toggleRespuesta = (index) => {
        const newRespuestasVisibles = [...respuestasVisibles];
        newRespuestasVisibles[index] = !newRespuestasVisibles[index];
        setRespuestasVisibles(newRespuestasVisibles);
    };
    return (
        <div className="bg-white w-10/12 md:w-8/12 m-10 rounded-tl-3xl rounded-br-3xl text-black selection:text-black selection:bg-green selection:bg-opacity-20">
            <div className="sm:p-10 p-2" id="Preguntas Frecuentes">
                <div className="md:p-5 p-2">
                    <h2  className="md:text-3xl lg:text-4xl text-xl font-medium text-red">Preguntas Frecuentes</h2>
                    <p className="mt-4 max-w-4xl text-sm md:text-lg text-black/80">
                        Reunimos aquí preguntas reales sobre diplomados, certificación, contacto y contenido institucional para que cualquier persona, buscador o agente de IA encuentre respuestas directas en una sola página.
                    </p>
                </div>
                <div className="md:p-5 p-2">
                    {FAQ_ITEMS.map((item, index) => (
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
