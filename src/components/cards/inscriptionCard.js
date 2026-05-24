import * as React from "react"
import { useState } from "react"
import InscriptionCheckoutForm from "../checkout/InscriptionCheckoutForm"
import CheckoutModal from "../checkout/CheckoutModal"

const CardInscription = ({ title, subtitle, price, coin, time, text }) => {
    const [showCheckout, setShowCheckout] = useState(false)

    return (
        <>
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

                <div className="flex flex-col w-full justify-center items-center mt-6 mb-10 px-4 gap-3">
                    <button
                        type="button"
                        onClick={() => setShowCheckout(true)}
                        className="min-h-[48px] w-full max-w-xs inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue to-green"
                    >
                        Pagar inscripción en línea
                    </button>
                    <a
                        href="https://forms.gle/8mNepRAmhS82awAr7"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[48px] w-full max-w-xs inline-flex items-center justify-center px-6 py-3 rounded-full font-medium text-blue border border-blue/30 text-sm"
                    >
                        Formulario Google (respaldo)
                    </a>
                </div>
            </div>

            <CheckoutModal
                open={showCheckout}
                onClose={() => setShowCheckout(false)}
                title="Inscripción en línea"
            >
                <InscriptionCheckoutForm
                    coin={coin}
                    price={price}
                    onCancel={() => setShowCheckout(false)}
                />
            </CheckoutModal>
        </>
    )
}

export default CardInscription
