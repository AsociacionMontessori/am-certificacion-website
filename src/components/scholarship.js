import React from "react"

import Button from "./button"
import { StaticImage } from "gatsby-plugin-image"


const Scholarship = () => {
    return (
        <>
            <section id="scholarships" className="bg-white rounded-3xl z-10">
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
                            </h4>
                            <ul className="mt-2 ml-3">
                                <li className="my-1">
                                    No tener ningún atraso en las entregas de actividades
                                </li>
                                <li className="my-1">
                                    Asistir al 80 % de clases
                                </li>
                                <li className="my-1">
                                    Realizar por lo menos una práctiva virtual (conferencia o proyecto)
                                </li>
                            </ul>
                            <div className="flex mt-5 items-center">
                                <div>
                                    <Button text="Conocer Más" />
                                </div>
                                <div className="mx-1 w-2/3 text-blue">
                                    <h5 className="md:text-lg text-base font-semibold">
                                        Todas las solicitudes son revisadas y evaluadas por el comité académico
                                    </h5>
                                    <p className="text-xs">Sujetas a disponibilidad</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10">
                            <StaticImage src="../images/sclshipp.png" className="w-72 w-56 md:w-80 ml-0 md:ml-20" />
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
export default Scholarship

