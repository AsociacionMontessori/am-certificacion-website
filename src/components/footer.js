import * as React from "react"
import logoAs from "../images/lasc.png"
import fcbk from "../images/facebook.png"
import insta from "../images/instagram.png"
import ytb from "../images/youtube.png"
import lnin from "../images/linkedin.png"
import logoSem from "../images/lsems.png"




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
        <footer className="flex bg-gray-700 text-white justify-center">
            <div className="flex flex-col justify-start sm:text-xs md:text-base lg:text-lg pr-0">
                <div className="flex flex-col md:flex-row md:items-start items-center justify-center w-full">
                    <div className="flex flex-col md:flex-row justify-start items-center w-full">
                        <a href="../" className="flex mx-2 justify-center p-4 items-center lg:w-4/12 md:w-9/12">
                            <img
                                className="w-14 h-14 m-1.5"
                                src={logoAs}
                                alt="Logo Asociación Montessori"
                            />
                            <div className="m-1.5 ">
                                <div>Asociación Montessori de México A.C.</div>
                                <p>Todos los derechos reservados 2023</p>
                            </div>
                        </a>
                        <div className="flex mx-2 justify-center p-4 items-center lg:w-4/12 md:w-9/12">
                            <img
                                className="w-14 h-14 m-1.5"
                                src={logoSem}
                                alt="Logo Sociedad de Escuelas Montessori"
                            />
                            <div className="m-1.5 ">
                                <div>Sociedad de Escuelas Montessori S.C.</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-start items-center justify-center w-full">
                    <div className="flex flex-col justify-center mx-12 my-4">
                        <div className="flex justify-start pb-4">
                            <p className="font-bold">
                                Asociación
                            </p>
                        </div>
                        <div className=" flex justify-center py-3">
                            <ul>
                                <li>
                                    <a href="#">Certificaciones</a>
                                </li>
                                <li>
                                    <a href="#">Sobre Nosotros</a>
                                </li>
                                <li>
                                    <a href="#">Publicaciones</a>
                                </li>
                                <li>
                                    <a href="#">Contacto</a>
                                </li>
                                <li>
                                    <a href="#">Preguntas Frecuentes</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center mx-12 my-4">
                        <div className="flex justify-start pb-4">
                            <p className="font-bold">
                                Legal
                            </p>
                        </div>
                        <div className="flex justify-center py-3">
                            <ul>
                                <li>
                                    <a href="#">Aviso de Privacidad</a>
                                </li>
                                <li>
                                    <a href="#">Documentos</a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center mx-12 my-4">
                        <div className="flex justify-start pb-4">
                            <p className="font-bold">
                                Escuelas Montessori
                            </p>
                        </div>
                        <div className="flex justify-center py-3">
                            <ul>
                                <li>
                                    <a href="#" className="italic">Kalpilli</a> ver en mapa
                                </li>
                                <li>
                                    <a href="#">+ 55 xxxxxxx</a>
                                </li>
                                <li>
                                    <a href="#">Kalpilli Addres 45, CDMX</a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center mx-12 my-4">
                        <div className="flex justify-center pb-4">
                            <p className="font-bold">
                                Síguenos en Nuestras Redes Sociales
                            </p>
                        </div>
                        <div className="flex grid-cols-4 justify-center py-3 items-center">
                            <a href="https://www.facebook.com/asociacionmontessori" target="_blank">

                                <img
                                    className=" lg:mx-8 mx-2 w-8 h-8"
                                    src={fcbk}
                                    alt="Enlace e Icono Facebook"
                                />
                            </a>

                            <a href="https://www.instagram.com/asociacionmontessori/" target="_blank">

                                <img
                                    className=" lg:mx-8 mx-2 w-10 h-10"
                                    src={insta}
                                    alt="Enlace e Icono Instagram"
                                />
                            </a>

                            <a href="https://www.linkedin.com/in/asociaci%C3%B3n-montessori-de-m%C3%A9xico-a-c-5a868417a/" target="_blank">
                                <img
                                    className=" lg:mx-8 mx-2 w-8 h-8"
                                    src={lnin}
                                    alt="Enlace e Icono Linkedin"
                                />
                            </a>
                            <a href="https://www.youtube.com/@montessorimx" target="_blank">

                                <img
                                    className=" lg:mx-8 mx-2 w-8 h-8"
                                    src={ytb}
                                    alt="Enlace e Icono Youtube"
                                />
                            </a>
                        </div>
                    </div>


                </div>
            </div>
        </footer>
    )
}