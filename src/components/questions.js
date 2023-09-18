import React, { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'


const Questions = () => {
    const preguntasRespuestas = [
        {
            pregunta: "¿Hay un periodo de inscripciones?",
            respuesta: "En la Escuela Montessori Kalpilli tenemos inscripciones abiertas todo el año para cualquiera de nuestros niveles educativos."
        },
        {
            pregunta: "¿Los alumnos de Montessori Kalpilli salen bien preparados para otro tipo de escuelas?",
            respuesta: "Sí, los alumnos de Montessori Kalpilli son preparados para la vida académica, social y emocionalmente. Cuentan con un buen desarrollo en los exámenes estandarizados y logran adaptarse muy bien ya que el método y la filosofía Montessori forma su grado de responsabilidad y análisis, mostrando entusiasmo por el aprendizaje y la adaptación a nuevas situaciones."
        },
        {
            pregunta: "¿Por qué Montessori tiene ambientes multigrado?",
            respuesta: "En el sistema Montessori la enseñanza es personalizada y activa, de manera que cada alumno cuenta con un plan claramente definido para el trabajo individual, al tiempo que tal y como sucede en el entorno social real fuera de la escuela, conviven con una comunidad plural en donde algunos de sus compañeros pueden ser mayores o menores en edad. Los ambientes multigrados favorecen el trabajo en equipo y colectivo, ya que los más pequeños observan las actividades de los mayores, les piden ayuda si es necesario y aprenden y se motivan con ellos; mientras que los mayores desarrollan mayor responsabilidad y observación, ven en los pequeños sus progresos, comparten de sus conocimientos y les prestan su ayuda al hacer actividades comunes."
        },
        {
            pregunta: "¿El sistema Montessori es solo para alumnos con condiciones distintas de aprendizaje?",
            respuesta: "El método y la filosofía Montessori está diseñado para ayudar a todos los niños a alcanzar su máximo potencial a su propio ritmo. Los ambientes cuentan con alumnos que tienen diferentes habilidades, formando así una comunidad real en la que todos tienen oportunidad de aprender y aportar entre la diversidad."
        },
        {
            pregunta: "Si los niños son libres de elegir su propio trabajo, ¿Cómo asegurarse de que reciban una educación completa?",
            respuesta: "En el sistema Montessori los alumnos aprenden a distinguir límites y normas, entendiendo así que solo tienen la libertad que pueden manejar con responsabilidad. Por otro lado, si bien en el ambiente los alumnos son libres de seleccionar materiales o actividades diversas, el guía brinda acompañamiento y, aprovechando el interés y necesidad del alumno, realiza ejercicios de transversalidad académica, asegurándose así de que cada niño progrese en todas las materias."
        },
    ];

    const [respuestasVisibles, setRespuestasVisibles] = useState(Array(preguntasRespuestas.length).fill(false));

    const toggleRespuesta = (index) => {
        const newRespuestasVisibles = [...respuestasVisibles];
        newRespuestasVisibles[index] = !newRespuestasVisibles[index];
        setRespuestasVisibles(newRespuestasVisibles);
    };
    return (
        <div className="bg-white w-10/12 md:w-8/12 m-10 rounded-tl-3xl rounded-br-3xl text-black selection:text-black selection:bg-green selection:bg-opacity-20">
            <div className="sm:p-10 p-2">
                <div className="md:p-5 p-2">
                    <h2 className="md:text-4xl lg:text-6xl text-xl font-medium text-red">Preguntas Frecuentes</h2>
                </div>
                <div className="md:p-5 p-2">
                    {preguntasRespuestas.map((item, index) => (
                        <div key={index}>
                            <div className="flex items-center justify-between cursor-pointer sm:mt-10 mt-2" onClick={() => toggleRespuesta(index)}>
                                <h3 className="md:text-2xl lg:text-3xl text-base md:m-2 m-1 md:font-medium font-normal flex-grow">{item.pregunta}</h3>
                                {respuestasVisibles[index] ?
                                    <ChevronUpIcon className="h-6 w-6 flex-shrink-0 min-w-[24px]" />
                                    :
                                    <ChevronDownIcon className="h-6 w-6 flex-shrink-0 min-w-[24px]" />}
                            </div>
                            {respuestasVisibles[index] && (
                                <p className="lg:text-2xl md:text-base text-xs m-1 my-2 md:m-4 font-light">{item.respuesta}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Questions
