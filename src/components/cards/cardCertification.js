import * as React from "react"
import Clock from "../../images/gifs/clock.gif"
import E from "../../images/e.png"

const CardCertification = ({ title, subtitle, price, coin, footer, text, time, }) => {
    return (
        <>
            <div className="flex justify-center items-center flex-col bg-white w-56 rounded-3xl text-xs text-black">
                <div className="text-lg pt-2.5 text-base w-auto selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {title}
                </div>
                <div className="text-gray w-2/3 text-center selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {subtitle}
                </div>
                <div className="text-blue pt-2.5 pr-16 selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {coin}
                </div>
                <div className="text-blue text-2xl pt-1 font-semibold selection:text-white selection:bg-blue selection:bg-opacity-90">
                    {price}
                </div>
                {text && (
                    <div className="pt-7 selection:text-black selection:bg-blue selection:bg-opacity-20">
                        {text}
                    </div>
                )}
                {time && (
                    <div className="flex mt-4 w-full justify-center">
                        <div className="ml-10">
                            <img src={Clock} className="w-5 h-5" alt="Duración" />
                        </div>
                        <div className="flex-grow flex justify-center items-center mr-12 selection:text-black selection:bg-blue selection:bg-opacity-20">
                            {time}
                        </div>
                    </div>
                )}
                <div className="flex mt-4 w-full justify-center mb-5">
                    <div className="ml-10">
                        <img src={E} className="w-4 h-5" alt="Pago" />
                    </div>
                    <div className="flex-grow flex justify-center items-center mr-12">
                        <p className="selection:text-black selection:bg-blue selection:bg-opacity-20">
                            <span className="text-blue selection:text-black selection:bg-blue selection:bg-opacity-20">
                                {price}
                            </span> {coin} <span className="text-gray text-xs">pago único</span>
                        </p>
                    </div>
                </div>
                {footer && (
                    <div className="pb-4 w-3/4 text-center text-gray text-xs selection:text-black selection:bg-blue selection:bg-opacity-20">
                        {footer}
                    </div>
                )}
            </div>
        </>
    )
}

export default CardCertification
