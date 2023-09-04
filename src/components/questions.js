import React, { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'


const Questions = () => {
    const preguntasRespuestas = [
        {
            pregunta: "¿Cómo identificar una escuela montessori",
            respuesta: "La popularidad de la educación Montessori ha llevado a un aumento de escuelas que se autodenominan 'Montessori'. En esta sección, te proporcionamos herramientas para identificar si una escuela realmente sigue la filosofía y método Montessori."
        },
        {
            pregunta: "¿Cómo identificar una escuela montessori",
            respuesta: "La popularidad de la educación Montessori ha llevado a un aumento de escuelas que se autodenominan 'Montessori'. En esta sección, te proporcionamos herramientas para identificar si una escuela realmente sigue la filosofía y método Montessori."
        },
        {
            pregunta: "¿Cómo identificar una escuela montessori",
            respuesta: "La popularidad de la educación Montessori ha llevado a un aumento de escuelas que se autodenominan 'Montessori'. En esta sección, te proporcionamos herramientas para identificar si una escuela realmente sigue la filosofía y método Montessori."
        },
        {
            pregunta: "¿Cómo identificar una escuela montessori",
            respuesta: "La popularidad de la educación Montessori ha llevado a un aumento de escuelas que se autodenominan 'Montessori'. En esta sección, te proporcionamos herramientas para identificar si una escuela realmente sigue la filosofía y método Montessori."
        },
        {
            pregunta: "¿Cómo identificar una escuela montessori",
            respuesta: "La popularidad de la educación Montessori ha llevado a un aumento de escuelas que se autodenominan 'Montessori'. En esta sección, te proporcionamos herramientas para identificar si una escuela realmente sigue la filosofía y método Montessori."
        },
    ];

    const [respuestasVisibles, setRespuestasVisibles] = useState(Array(preguntasRespuestas.length).fill(false));

    const toggleRespuesta = (index) => {
        const newRespuestasVisibles = [...respuestasVisibles];
        newRespuestasVisibles[index] = !newRespuestasVisibles[index];
        setRespuestasVisibles(newRespuestasVisibles);
    };
    return (
        <div className="bg-white w-8/12 m-10 rounded-tl-3xl rounded-br-3xl text-black">
            <div className="sm:p-10 p-2">
                <div className="p-5">
                    <h2 className="sm:text-6xl text-3xl">Preguntas Frecuentes</h2>
                </div>
                <div className="p-5">
                    {preguntasRespuestas.map((item, index) => (
                        <div key={index}>
                            <div className="flex items-center justify-between cursor-pointer sm:mt-10 mt-2" onClick={() => toggleRespuesta(index)}>
                                <h3 className="sm:text-lg md:text-3xl text-lg m-2 font-medium">{item.pregunta}</h3>
                                {respuestasVisibles[index] ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
                            </div>
                            {respuestasVisibles[index] && (
                                <p className="sm:text-lg text-base my-4 mx-4">{item.respuesta}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Questions
