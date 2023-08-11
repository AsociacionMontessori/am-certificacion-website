import * as React from "react"
import logoAs from "../images/lasc.png"
import fcbk from "../images/facebook.png"
import insta from "../images/instagram.png"
import ytb from "../images/youtube.png"
import lnin from "../images/linkedin.png"
import logoSem from "../images/lsems.png"
import tiktok from "../images/tik-tok.png"





const navigation = [
    { name: 'Oferta Académica', href: '../OfertaAcademica', current: false },
    { name: 'Programas Kalpilli', href: '../ProgramasKalpilli', current: false },
    { name: 'Método Montessori', href: '../MetodoMontessori', current: false },
    { name: 'Instalaciones', href: '#', current: false },
    { name: 'Inicia Sesión', href: '#', current: false },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Footer() {
    return (
        <footer className="bg-gray-700 text-white pb-8 flex flex-col justify-center items-center max-w-full">
            <div className=" pl-0 lg:pl-20 xl:pl-10 2xl:pl-0 py-4 px-1 flex flex-col md:flex-row justify-start items-center w-full">
                <a href="#home" className="flex mx-6 justify-center p-1.5 lg:p-4 items-center lg:w-4/12 md:w-9/12">
                    <img
                        className="w-14 h-14 m-1.5"
                        src={logoAs}
                        alt="Logo Asociación Montessori"
                    />
                    <div className="m-1.5 lg:text-base text-sm ">
                        <div className="font-medium">Asociación Montessori de México A.C.</div>
                        <p>Todos los derechos reservados 2023</p>
                    </div>
                </a>
                <div className="flex mx-2 justify-center p-4 items-center lg:w-4/12 md:w-9/12">
                    <img
                        className="w-14 h-14 m-1.5"
                        src={logoSem}
                        alt="Logo Sociedad de Escuelas Montessori"
                    />
                    <div className="m-1.5 lg:text-base text-sm ">
                        <div className="font-medium">Sociedad de Escuelas Montessori S.C.</div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-700 mt-8 text-xs">
                <div className="mx-1 md:mx-10  sm:py-0 md:py-2 lg:py-4 px-1 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-0">
                    <div className="lg:pl-16 pl-0 text-center md:text-left m-4 md:m-0">
                        <h3 className="text-lg font-semibold mb-2">Asociación</h3>
                        <p>Certificaciones</p>
                        <p>Sobre nosotros</p>
                        <p>Publicaciones</p>
                        <p>Contacto</p>
                        <p>Preguntas Frecuentes</p>
                    </div>
                    <div className="text-center md:text-left m-4 md:m-0">
                        <h3 className="text-lg font-semibold mb-2">Legal</h3>
                        <p>Aviso de Privacidad</p>
                        <a href="https://drive.google.com/file/d/1XaVbYjwltjMJjcjvCuqdhKIAFvxjecOJ/view" target="_blank">Constacia de Seguridad Estructural</a>
                        <br />
                        <a href='https://drive.google.com/file/d/1mE54tJUcoFfaX4mJQjaD7slE_ESlPY-r/view' target='_blank'>Visto Bueno de Seguridad Estructural</a>

                    </div>
                    <div className="text-center md:text-left m-4 md:m-0">
                        <h3 className="text-lg font-semibold mb-2">Escuelas Montassori</h3>
                        <a href="https://www.google.com.mx/maps/place/Primaria+Montessori+Kalpilli/@19.3925921,-99.1847762,17z/data=!4m6!3m5!1s0x85d1ff7b7998ce53:0x3f544be41b8ca559!8m2!3d19.3928452!4d-99.1838964!16s%2Fg%2F11sj5sp5xh?entry=ttu" className="italic" target="_blank">Kalpilli</a> ver en mapa
                        <br />
                        <a href="tel:5558121853" target="_blank">52 + 55 58 12 18 53</a>
                        <br />
                        <a href="https://www.google.com.mx/maps/place/Primaria+Montessori+Kalpilli/@19.3925921,-99.1847762,17z/data=!4m6!3m5!1s0x85d1ff7b7998ce53:0x3f544be41b8ca559!8m2!3d19.3928452!4d-99.1838964!16s%2Fg%2F11sj5sp5xh?entry=ttu" target="_blank" className="w-1/4">Calle Av. Dos 48, San Pedro de los Pinos, Benito Juárez, 03800 Ciudad de México, CDMX</a>
                    </div>
                    <div className="text-center md:text-left m-4 md:m-0 flex flex-col md:items-left items-center">
                        <h3 className="text-lg font-semibold mb-2">Redes Sociales</h3>
                        <div className="flex items-center">
                            <a href="https://www.instagram.com/asociacionmontessori/"
                                target="_blank">
                                <img
                                    src={insta}
                                    alt="Instagram"
                                    className="w-6 h-6 mr-8  md:mr-0 lg:mr-2"
                                    href="https://www.instagram.com/asociacionmontessori/"
                                    target="_blank"
                                />
                            </a>
                            <a href="https://www.linkedin.com/in/asociaci%C3%B3n-montessori-de-m%C3%A9xico-a-c-5a868417a/?originalSubdomain=mx"
                                target="_blank">
                                <img
                                    src={lnin}
                                    alt="LinkedIn"
                                    className="w-6 h-6 mr-8   md:mr-0 lg:mr-2"
                                />
                            </a>
                            <a href="https://www.youtube.com/@montessorimx"
                                target="_blank">
                                <img
                                    src={ytb}
                                    alt="YouTube"
                                    className="w-6 h-6 mr-8   md:mr-0 lg:mr-2"
                                />
                            </a>
                            <a href="https://www.facebook.com/asociacionmontessori"
                                target="_blank">
                                <img
                                    src={fcbk}
                                    alt="Facebook"
                                    className="w-6 h-6 mr-8   md:mr-0 lg:mr-2"
                                /></a>
                            <a href="https://www.tiktok.com/@montessorimx"
                                target="_blank">
                                <img
                                    src={tiktok}
                                    alt="TikTok"
                                    className="w-6 h-6 "
                                /></a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}