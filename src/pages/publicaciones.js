import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import imagen from '../images/books/books1.jpg'
import imagen2 from '../images/books/books2.jpg'
import '../styles/publications.css'
import '../styles/wordpress_publications.css'
import Nav from "../components/nav"


const publicaciones = () => {
    const title = "Montessori: "
    const subtitle = "Una presentación del secreto de la infancia"
    const publishDate = "Enero 19, 2020"
    const description = "A través de nuestra serie de libros, buscamos presentar la filosofía y el método Montessori a un público más amplio. Nuestro segundo libro, 'Montessori: Una presentación del secreto de la infancia', se basa en la obra 'El niño, el secreto de la infancia' de María Montessori, publicada en 1938 y traducida a más de 15 idiomas."
    const author = "Roxana Muñoz"
    return (
        <Layout>
            <Nav textColor="text-white" />
            <main>
                <div className="bg-gradient-to-r from-blue via-purple to-green pt-5 md:pt-20 w-full  overflow-x-hidden">
                    <section className="flex flex-col antialiased text-gray-200 pl-10 sm:pl-5 xl:ml-40 md:ml-10">
                        <div className="hidden sm:block relative w-full  pb-10 selection:text-white selection:bg-green selection:bg-opacity-20">
                            {/* <h1 style={{ fontFamily: "Alice", letterSpacing: ".4rem" }} className="text-[2rem] md:text-[10rem] text-white body-font">
                                Publicaciones
                            </h1> */}
                            <h2 style={{ fontFamily: "Italianno", top: "2vh", left: "10vw" }} className="text-[2rem] md:text-[6rem] text-white">
                                Nuestras Publicaciones
                            </h2>
                            {/* <h1 className="text-6xl text-white  ">Conoce nuestras Publicaciones</h1> */}
                        </div>
                        <div className="mx-auto p-4 sm:px-6 h-full">
                            <article className="max-w-sm mx-auto md:max-w-none grid md:grid-cols-2 gap-4 md:gap-8 lg:gap-12 xl:gap-16">
                                <div className="relative lg:mt-28 w-1/2 block group" href="#0">
                                    <div className="sm:hidden ml-20 sm:ml-28 absolute w-full z-10">
                                        <h1 className="text-3xl sm:text-4xl text-white font-bold drop-shadow-4xl ">Conoce nuestras Publicaciones</h1>
                                    </div>
                                    <div>
                                        <div className="w-1/2 book">
                                            <img className="absolute inset-0 w-full  h-full object-cover transform hover:scale-105 transition duration-700 ease-out" src={imagen} alt="Blog post" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="w-1/2 book -top-20 md:-top-241 md:left-144" >
                                            <img className="absolute inset-0 w-full w-max h-full object-cover transform hover:scale-105 transition duration-700 ease-out" src={imagen2} width="540" height="303" alt="Blog post" />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-white ml-0 xl:-ml-40 -pt-28 lg:pt-10 w-full">
                                    <header className="selection:text-white selection:bg-green selection:bg-opacity-20">
                                        <div className="text-2xl lg:text-4xl font-bold leading-tight mb-2">
                                            <h2 className="hover:text-gray-100 transition duration-150 ease-in-out">{title}</h2>
                                        </div>
                                        <div>
                                            <a className="font-medium hover:text-gray-100 transition duration-150 ease-in-out" href="../roxana">{author}</a>
                                            <span className="text-gray-700"> - </span>
                                            <span className="text-gray-500">{publishDate}</span>
                                        </div>
                                    </header>
                                    <p className="text-lg flex-grow selection:text-white selection:bg-green selection:bg-opacity-20">{description}</p>
                                    <div className="mt-5 mb-3 w-full">
                                        <ul className="flex flex-wrap text-xs font-medium -m-1">
                                            <li className="m-1 z-10">
                                                <a target="__blank" className="inline-flex text-center text-gray-100 py-3 px-6 rounded-full bg-red hover:bg-opacity-90 transition duration-150 ease-in-out" href="https://api.whatsapp.com/send?phone=5215548885013?text=Hola, Me gustaría información sobre la certificación Montessori.">
                                                    Comprar Ahora
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ml-1 w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                                    </svg>
                                                </a>
                                            </li>
                                            <li className="m-1 z-10 selection:text-white selection:bg-green selection:bg-opacity-20">
                                                <a title="Ver serie de libro en Amazon" className="inline-flex text-center text-gray-100 py-3 px-6 rounded-full bg-blue-500 hover:bg-blue-600 transition duration-150 ease-in-out" href="https://www.amazon.com.mx/dp/B09VX943R1">
                                                    Ver en Amazon
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4" viewBox="0 0 512 512">
                                                        <path d="M48.48,378.73a300.52,300.52,0,0,0,152.89,95.92,262.57,262.57,0,0,0,159.3-17.25,225.52,225.52,0,0,0,66.79-47,6.36,6.36,0,0,0-2-8.53,11.76,11.76,0,0,0-8-.05,401.92,401.92,0,0,1-116.55,39.34,358.13,358.13,0,0,1-127.29-8.83,446.73,446.73,0,0,1-119.1-60.49,5,5,0,0,0-6.06,6.9Z" fill="white"></path><path d="M387.15,388.44a168.11,168.11,0,0,1,48.94-2.23l.67.13a10,10,0,0,1,7.37,12.05A204.71,204.71,0,0,1,429,444.47a2.55,2.55,0,0,0,1.66,3.18,2.51,2.51,0,0,0,2.23-.37A83.31,83.31,0,0,0,464,382.86a12.44,12.44,0,0,0-10.22-13.22A95.75,95.75,0,0,0,384.91,384a2.55,2.55,0,0,0-.57,3.55A2.52,2.52,0,0,0,387.15,388.44Z" fill="white"></path><path d="M304.24,324.92a164,164,0,0,1-28.92,25.3A135.16,135.16,0,0,1,208.63,369a99.49,99.49,0,0,1-57.49-19.85,97.25,97.25,0,0,1-27.36-100.28,112.35,112.35,0,0,1,65.3-69.06,367.67,367.67,0,0,1,104.7-15.55V127A37.82,37.82,0,0,0,261,94.72a59.9,59.9,0,0,0-31.17,4.08,48.89,48.89,0,0,0-27.13,34.67,12,12,0,0,1-12.58,6.72l-50.9-4.5a11.38,11.38,0,0,1-8.38-10.16,103.66,103.66,0,0,1,36.61-63.45A143.86,143.86,0,0,1,257.85,32a146.24,146.24,0,0,1,84.27,27.67,86.82,86.82,0,0,1,30.7,70.22V258.8a84.46,84.46,0,0,0,8,31.28l15.87,23.23a13,13,0,0,1,0,11.23L349.7,364.25a12.5,12.5,0,0,1-12.68-.44A244.84,244.84,0,0,1,304.24,324.92Zm-10.6-116.83a257.68,257.68,0,0,0-44,2.89A63,63,0,0,0,208,242.54a63,63,0,0,0,3.07,54,40.6,40.6,0,0,0,47.11,12.19,78.61,78.61,0,0,0,35.46-55.58V208.09" fill="white">
                                                        </path>
                                                    </svg>
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>
                    <section className="bg-white md:px-20 py-10 h-[80rem] sm:h-[28rem]">
                        <iframe src="https://montessorimexico.org/proxima-certificacion/massterclasses/" title="Nuestro Blog" className="px-10 sm:px-0" width="100%" height="100%"></iframe>
                    </section>
                </div>
            </main>
        </Layout>
    )
}

export const Head = () => <Seo title="Publicaciones" description="Libros, eventos y artículos sobre el Método Montessori" />
export default publicaciones
