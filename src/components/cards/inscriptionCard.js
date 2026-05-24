import * as React from "react"
import { Link } from "gatsby"

const CardInscription = ({ title, subtitle, price, coin, time, text }) => {
    return (
        <div className="flex justify-start items-center flex-col bg-white w-full max-w-sm lg:w-72 xl:w-80 rounded-3xl text-lg text-black shadow-sm">
                <div className="text-3xl mt-10 sm:mt-12 px-4 text-center selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {title}
                </div>
                <div className="text-gray text-base px-4 text-center selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {subtitle}
                </div>
                <div className="text-blue selection:text-blue text-4xl font-semibold mt-8 sm:mt-12 selection:bg-blue selection:bg-opacity-20">
                    {coin} {price}
                </div>
                <div className="mt-6 sm:mt-10 text-center px-4 pb-2">
                    <p className="selection:text-black selection:bg-blue selection:bg-opacity-20">
                        {text}
                        <br />
                        <span className="text-blue selection:text-blue selection:bg-blue selection:bg-opacity-20 font-semibold">
                            {" "}
                            {price}
                        </span>{" "}
                        {coin}
                    </p>
                </div>

                <div className="w-full px-4 mt-4 mb-2">
                    <p className="text-xs text-gray text-center leading-relaxed">
                        Dos pasos tras el pago: cuenta en el portal y expediente administrativo,
                    todo vinculado automáticamente (sin comprobante de pago).
                    </p>
                </div>

                <div className="flex flex-col w-full justify-center items-stretch mt-4 mb-10 px-4 gap-3">
                    <Link
                        to="/inscripcion/pagar"
                        className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green text-center"
                    >
                        Pagar inscripción en línea
                    </Link>
                    <Link
                        to="/inscripcion/transferencia"
                        className="min-h-[48px] w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-blue border-2 border-blue text-center"
                    >
                        Pagar por transferencia
                    </Link>
                    <p className="text-xs text-gray text-center leading-relaxed px-2">
                        Tras confirmar el pago: crear tu cuenta y completar el expediente en el sitio.
                    </p>
                </div>
        </div>
    )
}

export default CardInscription
