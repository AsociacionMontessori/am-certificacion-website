import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import imagen from '../images/books/books1.jpg'
import imagen2 from '../images/books/books2.jpg'
import '../styles/publications.css'



const publicaciones = () => {
    const title = "Montessori: Una presentación del secreto de la infancia"
    const publishDate = "Enero 19, 2020"
    const description = "A través de nuestra serie de libros, buscamos presentar la filosofía y el método Montessori a un público más amplio. Nuestro segundo libro, 'Montessori: Una presentación del secreto de la infancia', se basa en la obra 'El niño, el secreto de la infancia' de María Montessori, publicada en 1938 y traducida a más de 15 idiomas."
    const author = "Roxana Muñoz"
    return (
        <Layout>
            <main>
                <div className="bg-gradient-to-r from-blue via-purple to-green py-20 w-full  overflow-x-hidden">
                    <section className="flex flex-col antialiased text-gray-200 pl-10 md:ml-40">
                        <div className="hidden sm:block relative w-full  pb-10">
                            <h1 className="text-6xl text-white  ">Conoce nuestras Publicaciones</h1>
                        </div>
                        <div class="mx-auto p-4 sm:px-6 h-full">
                            <article class="max-w-sm mx-auto md:max-w-none grid md:grid-cols-2 gap-4 md:gap-8 lg:gap-12 xl:gap-16">
                                <div class="relative lg:mt-28 w-1/2 block group" href="#0">
                                    {/* <div class="absolute inset-0 bg-gray-800 hidden md:block transform md:translate-y-2 md:translate-x-4 xl:translate-y-4 xl:translate-x-8 group-hover:translate-x-0 group-hover:translate-y-0 transition duration-700 ease-out pointer-events-none" aria-hidden="true"></div> */}
                                    <div className="sm:hidden ml-28 absolute w-full z-10">
                                        <h1 className="text-4xl text-white font-bold drop-shadow-4xl ">Conoce nuestras Publicaciones</h1>
                                    </div>
                                    <div>
                                        <div class="w-1/2 book">
                                            <img class="absolute inset-0 w-full  h-full object-cover transform hover:scale-105 transition duration-700 ease-out" src={imagen} alt="Blog post" />
                                        </div>
                                    </div>
                                    <div>
                                        <div class="w-1/2 book -top-20 md:-top-241 md:left-144" >
                                            <img class="absolute inset-0 w-full w-max h-full object-cover transform hover:scale-105 transition duration-700 ease-out" src={imagen2} width="540" height="303" alt="Blog post" />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-white ml-0 xl:-ml-40 -pt-28 lg:pt-10 w-full">
                                    <header>
                                        <h3 class="text-2xl lg:text-4xl font-bold leading-tight mb-2">
                                            <a class="hover:text-gray-100 transition duration-150 ease-in-out" href="#0">{title}</a>
                                        </h3>
                                        <div>
                                            <a class="font-medium hover:text-gray-100 transition duration-150 ease-in-out" href="#0">{author}</a>
                                            <span class="text-gray-700"> - </span>
                                            <span class="text-gray-500">{publishDate}</span>
                                        </div>
                                    </header>
                                    <p class="text-lg flex-grow">{description}</p>
                                    <div class="my-3 w-full">
                                        <ul class="flex flex-wrap text-xs font-medium -m-1">
                                            <li class="m-1 z-10">
                                                <a class="inline-flex text-center text-gray-100 py-3 px-6 rounded-full bg-purple-600 hover:bg-purple-700 transition duration-150 ease-in-out" href="#0">Product</a>
                                            </li>
                                            <li class="m-1 z-10">
                                                <a class="inline-flex text-center text-gray-100 py-3 px-6 rounded-full bg-blue-500 hover:bg-blue-600 transition duration-150 ease-in-out" href="#0">Engineering</a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>
                    <section className="bg-white min-h-screen">
                        <h1>Hola</h1>
                    </section>
                </div>

            </main>
        </Layout>
    )
}

export const Head = () => <Seo title="Sobre Nosotros" />

export default publicaciones
