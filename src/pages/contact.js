import * as React from "react"

import { FacebookProvider, Page } from 'react-facebook';
import { Helmet } from "react-helmet";

import Layout from "../components/layout"
import Seo from "../components/seo"
import '../styles/publications.css'
import '../styles/wordpress_publications.css'
import Nav from "../components/nav"
import Questions from "../components/questions"


const contact = () => {
    const iconsSize = "w-20 h-20"
    return (
        <>
            <Layout>
                <Nav textColor="dark:text-white text-gray" />
                <main>
                    <section className="bg-gradient-to-r from-blue via-purple to-green text-white">
                        <div className="container px-6 py-12 mx-auto">
                            <div className="">
                                <h1 className="mt-2 text-4xl font-semibold text-gray-800 md:text-8xl dark:text-white">Contáctanos</h1>

                                <p className="mt-3 ">Nuestro equipo estará encantado de atenderte. La comunicación siempre es la clave.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs md:text-lg text-left">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <span className="md:p-3 text-blue-500 rounded-full bg-blue-100/80 dark:bg-gray-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={iconsSize}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                    </span>

                                    <h2 className="mt-4 font-medium text-gray-800 dark:text-white">Email</h2>
                                    <p className="mt-2 ">Envianos un correo electronico.</p>
                                    <p className="mt-2">info@certificacionmontessori.com</p>
                                </div>
                                {/* <div className="hidden sm:block"> */}
                                <div className="flex flex-col items-center justify-center text-center">
                                    <span className="md:p-3 text-blue-500 rounded-full bg-blue-100/80 dark:bg-gray-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={iconsSize}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                    </span>

                                    <h2 className="mt-4 font-medium text-gray-800 dark:text-white">Encuéntranos en</h2>
                                    <p className="mt-2 ">Calle Av. Dos 48, San Pedro de los Pinos, Benito Juárez, 03800 Ciudad de México, CDMX</p>
                                </div>
                                {/* </div> */}

                                <div className="flex flex-col items-center justify-center text-center">
                                    <span className="md:p-3 text-blue-500 rounded-full bg-blue-100/80 dark:bg-gray-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={iconsSize}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                        </svg>
                                    </span>
                                    <h2 className="mt-4 font-medium text-gray-800 dark:text-white">Contáctanos</h2>
                                    <p className="mt-2 ">Llamadas, o mensajes de WhatsApp, Horario: 8am - 5pm.</p>
                                    {/* <a href="tel:5558121853" target="_blank" className="hover:text-red">52 + 55 58 12 18 53</a> */}
                                    <a href="tel:5558121853" target="_blank" className="hover:font-bold mt-2">Número de Teléfono: 52 + 55 58 12 18 53</a>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="bg-white h-[64rem] sm:h-[32rem]">
                        <div className="p-5 sm:mx-96">
                            <div className="grid grid-cols-1 sm:grid-cols-2 place-items-center">
                                <div className="h-80">
                                    <FacebookProvider appId="1019625052802455" language="es_LA">
                                        <Page height={450} adaptContainerWidth smallHeader href="https://www.facebook.com/asociacionmontessori/" tabs="timeline" />
                                    </FacebookProvider>
                                </div>
                                <div className="pt-40 lg:pt-20 sm:pt-0 h-70 w-3/4">
                                    <figure data-behold-id="zEmsp3sC0nZjZ0Bs8CZA"></figure>
                                    <Helmet>
                                        <script src="https://w.behold.so/widget.js" type="module"></script>
                                    </Helmet>
                                </div>
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

export const Head = () => <Seo title="Sobre Nosotros" />


export default contact
