import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

export default function Footer() {
    return (
        <footer className="bg-gray-700 text-white pb-8 flex flex-col justify-center items-center max-w-full">
            <div className=" pl-0 lg:pl-20 xl:pl-10 2xl:pl-0 py-4 px-1 flex flex-col md:flex-row justify-start items-center w-full">
                <a href="#home" className="flex mx-6 justify-center p-1.5 lg:p-4 items-center lg:w-4/12 md:w-9/12">
                    <StaticImage src="../images/lasc.png" className="w-14 h-14 m-1.5" alt={"Logo Asociación Montessori"} />
                    <div className="m-1.5 lg:text-base text-sm ">
                        <div className="font-medium">Asociación Montessori de México A.C.</div>
                        <p>Todos los derechos reservados 2023</p>
                    </div>
                </a>
                <div className="flex mx-2 justify-center p-4 items-center lg:w-4/12 md:w-9/12">
                    <StaticImage src="../images/lsems.png" className="w-14 h-14 m-1.5" alt={"Logo Sociedad de Escuelas Montessori"} />
                    <div className="m-1.5 lg:text-base text-sm ">
                        <div className="font-medium">Sociedad de Escuelas Montessori S.C.</div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-700 mt-8 text-xs">
                <div className="mx-1 md:mx-10  sm:py-0 md:py-2 lg:py-4 px-1 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-0">
                    <div className="lg:pl-16 pl-0 text-center md:text-left m-4 md:m-0">
                        <h3 className="text-lg font-semibold mb-2">Asociación</h3>
                        <a target="_blank" className="hover:underline decoration-red" href="#certificacion_internacional">
                            <p>Certificaciones</p>
                        </a>
                        <a target="_blank" className="hover:underline decoration-red" href="/">
                            <p>Sobre nosotros</p>
                        </a>
                        <a target="_blank" className="hover:underline decoration-red" href="../publicaciones">
                            <p>Publicaciones</p>
                        </a>
                        <a target="_blank" className="hover:underline decoration-red" href="../contact">
                            <p>Contacto</p>
                        </a>
                        <p>Preguntas Frecuentes</p>
                    </div>
                    <div className="text-center md:text-left m-4 md:m-0">
                        <h3 className="text-lg font-semibold mb-2">Legal</h3>
                        <p>Aviso de Privacidad</p>
                        <a className="hover:underline decoration-red" href="https://drive.google.com/file/d/1XaVbYjwltjMJjcjvCuqdhKIAFvxjecOJ/view" target="_blank" rel="noopener noreferrer">Constacia de Seguridad Estructural</a>
                        <br />
                        <a className="hover:underline decoration-red" href='https://drive.google.com/file/d/1mE54tJUcoFfaX4mJQjaD7slE_ESlPY-r/view' target='_blank' rel="noopener noreferrer">Visto Bueno de Seguridad Estructural</a>

                    </div>
                    <div className="text-center md:text-left m-4 md:m-0">
                        <h3 className="text-lg font-semibold mb-2">Escuelas Montassori</h3>
                        <a className="hover:underline decoration-red italic" href="https://www.google.com.mx/maps/place/Primaria+Montessori+Kalpilli/@19.3925921,-99.1847762,17z/data=!4m6!3m5!1s0x85d1ff7b7998ce53:0x3f544be41b8ca559!8m2!3d19.3928452!4d-99.1838964!16s%2Fg%2F11sj5sp5xh?entry=ttu"  target="_blank" rel="noopener noreferrer">Kalpilli</a> ver en mapa
                        <br />
                        <a href="tel:5558121853" target="_blank" rel="noopener noreferrer">52 + 55 58 12 18 53</a>
                        <br />
                        <a className="hover:underline decoration-red w-1/4" href="https://www.google.com.mx/maps/place/Primaria+Montessori+Kalpilli/@19.3925921,-99.1847762,17z/data=!4m6!3m5!1s0x85d1ff7b7998ce53:0x3f544be41b8ca559!8m2!3d19.3928452!4d-99.1838964!16s%2Fg%2F11sj5sp5xh?entry=ttu" target="_blank" rel="noopener noreferrer" >Calle Av. Dos 48, San Pedro de los Pinos, Benito Juárez, 03800 Ciudad de México, CDMX</a>
                    </div>
                    <div className="text-center md:text-left m-4 md:m-0 flex flex-col md:items-left items-center">
                        <h3 className="text-lg font-semibold mb-2">Redes Sociales</h3>
                        <div className="flex items-center">
                            <a href="https://www.instagram.com/asociacionmontessori/"
                                target="_blank" rel="noopener noreferrer">
                                <StaticImage src="../images/instagram.png" className="w-6 h-6 mr-8  md:mr-0 lg:mr-2" alt={"Instragram"} />
                            </a>
                            <a href="https://www.linkedin.com/in/asociaci%C3%B3n-montessori-de-m%C3%A9xico-a-c-5a868417a/?originalSubdomain=mx"
                                target="_blank" rel="noopener noreferrer">
                                <StaticImage src="../images/linkedin.png" alt={"LinkedIn"} className="w-6 h-6 mr-8   md:mr-0 lg:mr-2" />
                            </a>
                            <a href="https://www.youtube.com/@montessorimx"
                                target="_blank" rel="noopener noreferrer">
                                <StaticImage src="../images/youtube.png" alt={"YouTube"} className="w-6 h-6 mr-8   md:mr-0 lg:mr-2" />
                            </a>
                            <a href="https://www.facebook.com/asociacionmontessori"
                                target="_blank" rel="noopener noreferrer">
                                <StaticImage src="../images/facebook.png" alt={"Facebook"} className="w-6 h-6 mr-8   md:mr-0 lg:mr-2" />
                            </a>
                            <a href="https://www.tiktok.com/@montessorimx"
                                target="_blank" rel="noopener noreferrer">
                                <StaticImage src="../images/tik-tok.png" alt={"TikTok"} className="w-6 h-6 " />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}