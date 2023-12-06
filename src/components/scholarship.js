import React from "react"
import { StaticImage } from "gatsby-plugin-image"


const Scholarship = () => {
    return (
        <>
            <section id="scholarships" className="bg-white z-10 selection:text-red selection:bg-red selection:bg-opacity-10 relative">
                <div className="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0 text-black flex flex-col sm:flex-row items-center justify-between">
                    <div>
                        <h3>
                            <span className="text-red md:text-3xl text-2xl text-semibold">
                                Conoce nuestro proyecto de becas
                            </span>
                        </h3>
                        <h4 className="mt-4">
                            <span className="text-xl">
                                Requisitos
                            </span>
                        </h4>
                        <ul className="mt-2 ml-3 font-thin">
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
                        <div className="flex flex-col md:flex-row mt-5 items-center">
                            <div className="mr-0 md:mr-10">
                                <a href="https://docs.google.com/forms/d/e/1FAIpQLScoDebIHpXugyfszH7VsUcVFNSiM-49mhaLkuN0AQoSxjE48g/viewform" target="__blank" >
                                    <button className="md:w-auto w-10/11 text-center btn-outline hover:text-white hover:bg-blue hover:from-green hover:bg-opacity-70 rounded-full px-4 py-2 text-white bg-gradient-to-r from-blue to-green text-xl font-semibold">
                                        Conocer Más
                                    </button>
                                </a>
                            </div>
                            <div className="ml-5 mt-5 sm:mt-0 w-full sm:mx-1 sm:w-2/3 text-blue selection:text-blue selection:bg-blue selection:bg-opacity-10">
                                <h5 className="md:text-lg text-base font-semibold">
                                    Todas las solicitudes son revisadas y evaluadas por el comité académico
                                </h5>
                                <p className="text-xs mt-4">Sujetas a disponibilidad</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-0 sm:ml-10 w-20 sm:w-auto">
                        <StaticImage src="../images/sclshipp.png" className="w-full sm:w-72 sm:w-56 md:w-80" alt={"imagen becas"} />
                    </div>
                </div>
            </section>
        </>
    )
}
export default Scholarship

