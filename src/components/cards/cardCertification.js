import * as React from "react"
import Clock from "../../images/gifs/clock.gif"
import E from "../../images/e.png"

const CardCertification = ({ title, subtitle, price, coin, footer, text, }) => {
    return (
        <>
            <div className="flex justify-center items-center flex-col bg-white w-56 rounded-3xl text-xs text-black">
                <div className="text-lg pt-2.5 text-base w-auto selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {title}
                </div>
                <div className="text-gray w-2/3 text-center selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {subtitle}
                </div>
                <div className="text-blue  pt-2.5 pr-16 selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {coin}
                </div>
                <div className="text-blue text-2xl pt-1 font-semibold selection:text-white selection:bg-blue selection:bg-opacity-90">
                    {price}
                </div>
                <div className="pt-7 w-2/4 text-center selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {text}<br/><span className="text-blue font-bold selection:text-black selection:bg-blue selection:bg-opacity-20">$ {price} {coin}</span>
                </div>
                <div className="pt-7 w-3/4 text-center selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {footer}
                </div>
            </div>
        </>
    )
}

export default CardCertification
