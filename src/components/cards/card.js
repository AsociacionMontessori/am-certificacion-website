import * as React from "react"
import Clock from "../../images/gifs/clock.gif"
import E from "../../images/e.png"

const CardPrice = ({ title, subtitle, price, coin, time, text, }) => {
    return (
        <>
            <div className="flex justify-center items-center flex-col bg-white w-56 rounded-3xl text-xs text-black">
                <div className="text-lg pt-2.5 text-base w-auto">
                    {title}
                </div>
                <div className="text-gray">
                    {subtitle}
                </div>
                <div className="text-blue  pt-2.5 pr-16">
                    {coin}
                </div>
                <div className="text-blue text-2xl pt-1 font-semibold">
                    {price}
                </div>
                <div className="pt-7">
                    {text}
                </div>
                <div className="flex mt-4 w-full justify-center">
                    <div className="ml-10">
                        <img src={Clock} className="w-5 h-5" alt="Clock" />
                    </div>
                    <div className="flex-grow flex justify-center items-center mr-12">
                        {time}
                    </div>
                </div>
                <div className="flex mt-4 w-full justify-center mb-5">
                    <div className="ml-10">
                    <img src={E} className="w-4 h-5" alt="Clock" />
                    </div>
                    <div className="flex-grow flex justify-center items-center mr-12">
                        <p>
                            <span className="text-blue">
                            {price}
                            </span> {coin} x mes
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CardPrice
