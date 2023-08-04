import * as React from "react"
import Clock from "../../images/gifs/clock.gif"
import E from "../../images/e.png"
import Button from '../button'


const CardInscription = ({ title, subtitle, price, coin, time, text, }) => {
    return (
        <>
            <div className="flex justify-start items-center flex-col bg-white w-72 lg:w-72 xl:w-80 max-h-full h-full rounded-3xl text-lg text-black">
                <div className="text-3xl mt-12">
                    {title}
                </div>
                <div className="text-gray text-base">
                    {subtitle}
                </div>
                <div className="text-blue text-4xl font-semibold mt-12">
                    {coin} {price}
                </div>
                <div className="mt-10 text-center">
                    <p>
                        {text}
                        <br />
                        <span className="text-blue font-semibold"> {price}</span> {coin}
                    </p>
                </div>
                <div className="flex mt-10 w-full justify-center mt-24">
                    <Button text="Inscríbete" color="bg-gradient-to-r from-blue to-green" />
                </div>
            </div>
        </>
    )
}

export default CardInscription
