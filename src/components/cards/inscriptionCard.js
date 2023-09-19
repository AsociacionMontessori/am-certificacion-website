import * as React from "react"
import Button from '../button'


const CardInscription = ({ title, subtitle, price, coin, time, text, }) => {
    return (
        <>
            <div className="flex justify-start items-center flex-col bg-white w-auto lg:w-72 xl:w-80 max-h-full h-full rounded-3xl text-lg text-black">
                <div className="text-3xl mt-12 selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {title}
                </div>
                <div className="text-gray text-base selection:text-black selection:bg-blue selection:bg-opacity-20">
                    {subtitle}
                </div>
                <div className="text-blue selection:text-blue text-4xl font-semibold mt-12 selection:bg-blue selection:bg-opacity-20">
                    {coin} {price}
                </div>
                <div className="mt-10 text-center">
                    <p className="selection:text-black selection:bg-blue selection:bg-opacity-20">
                        {text}
                        <br />
                        <span className="text-blue selection:text-blue selection:bg-blue selection:bg-opacity-20 font-semibold"> {price}</span> {coin}
                    </p>
                </div>
                <div className="flex mt-10 w-full justify-center mt-24">
                    <a href="https://docs.google.com/forms/d/e/1FAIpQLScmvkdg4BSCWsempnaQhJWc0ZGaYFSrgiFcnJ3hlpQqF8PU0g/viewform" target="__blank">
                        <Button text="Inscríbete" color="bg-gradient-to-r from-blue to-green" />
                    </a>
                </div>
            </div>
        </>
    )
}

export default CardInscription
