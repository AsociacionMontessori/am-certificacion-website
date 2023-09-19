import React from "react"

import Button from "./button"
import { StaticImage } from "gatsby-plugin-image"


const Scholarship = () => {
    return (
        <>
            <section id="scholarships" className="bg-white rounded-3xl z-10 selection:text-red selection:bg-red selection:bg-opacity-10">
                <div className="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0">
                    <h3>
                        <span className="text-red md:text-3xl text-xl text-semibold">
                            Conoce nuestro proyecto de becas
                        </span>
                    </h3>
                    <div className="flex text-black flex-col justify-center items-center md:flex-row">
                        <div className="mt-3">
                            <h4>
                                <span className="text-xl">
                                    Requisitos
                                </span>
                                <ul className="mt-2 ml-3">
                                    <li className="my-1">
                                        No tener ningún atraso en la entrega de actividades
                                    </li>
                                    <li className="my-1">
                                        Asistir por lo menos al 80 % de clases
                                    </li>
                                    <li className="my-1">
                                        Realizar por lo menos una práctica virtual (conferencia o proyecto)
                                    </li>
                                </ul>
                            </h4>
                            <div className="sm:flex mt-5 items-center">
                                <div className="mr-10">
                                    <a href="https://docs.google.com/forms/d/e/1FAIpQLScoDebIHpXugyfszH7VsUcVFNSiM-49mhaLkuN0AQoSxjE48g/viewform" target="__blank" >
                                        <Button text="Conocer Más" />
                                    </a>
                                </div>
                                <div className="ml-5 mt-5 sm:mt-0 w-full sm:mx-1 sm:w-2/3 text-blue selection:text-blue selection:bg-blue selection:bg-opacity-10">
                                    <h5 className="md:text-lg text-base font-semibold">
                                        Todas las solicitudes son revisadas y evaluadas por el comité académico
                                    </h5>
                                    <p className="text-xs">Sujetas a disponibilidad</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 hidden md:block">
                            <StaticImage src="../images/sclshipp.png" className="w-72 w-56 md:w-80 ml-0 md:ml-20" alt={"imagen becas"} />
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
export default Scholarship

