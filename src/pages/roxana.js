import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import img1 from '../images/rox.jpg'
import Nav from "../components/nav"

const roxana = () => {

    const mainText = "Roxana Muñoz es una figura de incalculable relevancia en el ámbito educativo, particularmente en el enfoque Montessori. Con más de 30 años de experiencia como Guía Montessori, Roxana no solo lleva consigo una gran cantidad de conocimientos teóricos y prácticos, sino también una genuina pasión por la educación de los niños. Ella es una ferviente creyente en que la educación con amor es la clave para desbloquear el potencial inherente en cada niño."

    return (
        <Layout>
            <Nav textColor="dark:text-white text-black" />
            <main className="py-40 bg-gradient-to-r from-blue via-purple to-green pt-10 w-full  overflow-x-hidden">
                <section className="bg-gradient-to-r from-blue via-purple to-green">
                    <div className="container px-6 pb-12 mx-auto">
                        <h1 className="tpx-6 mt-2 text-2xl font-bold md:text-4xl dark:text-white text-center">
                            Dirección de la Asociación Montessori de México
                        </h1>
                        <div className="pt-10 max-w-8xl flex items-center h-auto flex-wrap mx-auto my-48 lg:my-0">
                            <div id="profile" className="w-full lg:w-3/5 rounded-lg lg:rounded-l-lg lg:rounded-r-none shadow-2xl bg-white opacity-70 mx-6 lg:mx-0">
                                <div className="p-4 md:p-12 text-center lg:text-left">
                                    <div
                                        className="block lg:hidden rounded-full shadow-xl mx-auto -mt-16 h-48 w-48 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${img1})` }}
                                    >

                                    </div>
                                    <h1 className="text-3xl font-bold pt-8 lg:pt-0 text-blue">Roxana Muñoz</h1>
                                    <div className="mx-auto lg:mx-0 w-full pt-3 border-b-2 border-green-500 opacity-25"></div>
                                    <p className="pt-2 text-red text-xs lg:text-sm flex items-center justify-center lg:justify-start"><svg className="h-4 fill-current text-green-700 pr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm7.75-8a8.01 8.01 0 0 0 0-4h-3.82a28.81 28.81 0 0 1 0 4h3.82zm-.82 2h-3.22a14.44 14.44 0 0 1-.95 3.51A8.03 8.03 0 0 0 16.93 14zm-8.85-2h3.84a24.61 24.61 0 0 0 0-4H8.08a24.61 24.61 0 0 0 0 4zm.25 2c.41 2.4 1.13 4 1.67 4s1.26-1.6 1.67-4H8.33zm-6.08-2h3.82a28.81 28.81 0 0 1 0-4H2.25a8.01 8.01 0 0 0 0 4zm.82 2a8.03 8.03 0 0 0 4.17 3.51c-.42-.96-.74-2.16-.95-3.51H3.07zm13.86-8a8.03 8.03 0 0 0-4.17-3.51c.42.96.74 2.16.95 3.51h3.22zm-8.6 0h3.34c-.41-2.4-1.13-4-1.67-4S8.74 3.6 8.33 6zM3.07 6h3.22c.2-1.35.53-2.55.95-3.51A8.03 8.03 0 0 0 3.07 6z" /></svg>
                                        Ciudad de México
                                    </p>
                                    <p className="pt-4 text-md text-black" >
                                        {mainText}

                                    </p>

                                </div>

                            </div>

                            <div className="w-full lg:w-2/5">
                                <img src={img1} className="h-[32rem] rounded-none lg:rounded-lg shadow-2xl hidden lg:block" />
                            </div>

                        </div>
                    </div>
                </section>
                <section>
                    <div className="container px-6 pb-12 mx-auto">

                        {/* create 4 cols with tailwind */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs md:text-lg text-left">
                            <div className="flex flex-col pb-3">
                                <h1 className="tpx-6 mt-2 font-bold text-white">
                                    Liderazgo en la Comunidad Montessori
                                </h1>
                                <p className="text-white text-sm">
                                    Roxana ocupa un lugar de prominencia en la comunidad Montessori no solo en México, sino en todo el mundo. Como presidenta de la Asociación Montessori de México A.C. y cofundadora de la Sociedad de Escuelas Montessori S.C., su influencia es palpable en varios niveles. Su liderazgo ha abierto puertas para un diálogo más profundo y significativo entre educadores, padres y entidades gubernamentales acerca de cómo la educación debe ser abordada.
                                </p>
                            </div>
                            <div className="flex flex-col pb-3">
                                <h1 className="tpx-6 mt-2 font-bold text-white">
                                    Contribuciones Académicas
                                </h1>
                                <p className="text-white text-sm">
                                    La autoridad de Roxana Muñoz en el tema Montessori no termina en el salón de clases o en los congresos de educación. Es autora de diversos libros y artículos que se centran en la "Pedagogía Científica de María Montessori". Su escritura refleja un profundo entendimiento de las complejidades y las sutilezas de este método educativo y ofrece un análisis meticuloso sobre cómo implementar la pedagogía Montessori de manera efectiva.
                                </p>
                            </div>
                            <div className="flex flex-col pb-3">
                                <h1 className="tpx-6 mt-2 font-bold text-white">
                                    Capacitadora y Oradora
                                </h1>
                                <p className="text-white text-sm">
                                    Además de su escritura, Roxana también es conocida por ser una oradora y capacitadora prolífica. Su habilidad para comunicar ideas complejas de manera comprensible hace que sea una figura muy solicitada para conferencias, talleres y seminarios. Estas plataformas le permiten compartir su riqueza de conocimientos y experiencia con una audiencia más amplia, incluidos padres, educadores y cualquier persona interesada en el ámbito educativo.
                                </p>

                            </div>
                            <div className="flex flex-col pb-3">
                                <h1 className="tpx-6 mt-2 font-bold text-white">
                                    Compromiso con la Excelencia Educativa
                                </h1>
                                <p className="text-white text-sm">
                                    Lo que hace especialmente notable a Roxana es su incansable compromiso con el bienestar de los niños. Ella considera que cada niño es un individuo con un potencial ilimitado que simplemente necesita la orientación y el entorno adecuados para florecer. Su dedicación a ayudar a los niños a alcanzar su máximo potencial va más allá del mero discurso y se refleja en su enfoque práctico y en las acciones concretas que realiza en su capacidad como educadora y líder en el campo.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    )
}

export const Head = () => <Seo title="Roxana Muñoz" description="Dirección de la Asociación Montessori de México" />
export default roxana
