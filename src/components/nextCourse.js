import { StaticImage } from "gatsby-plugin-image"
import React from "react"

const NextCourse = ({ URLiframe, URLButton }) => {
    return (
        <>
            <div className="pb-10 lg:pb-10">
                <h2 className="py-2">
                    <span className="text-white text-2xl font-bold">Próximo Diplomado:</span>
                </h2>
                <div className="relative">
                    <iframe title="Próximo Diplomado" scrolling="no" style={{ background: "transparent", colorScheme: "normal", color: "white" }} className="w-full h-40" allowtransparency="true" src={URLiframe} />
                    <div className="pt-0">
                        <a href="https://docs.google.com/forms/d/e/1FAIpQLScmvkdg4BSCWsempnaQhJWc0ZGaYFSrgiFcnJ3hlpQqF8PU0g/viewform" target="__blank" className="group mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-blue text-white bg-opacity-10 w-full md:w-auto">
                            Inscríbete Ahora
                            <div className="inline opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                <StaticImage className='w-6 h-6' src="../images/elements/decor2.png" alt="decoration" />
                            </div>  
                        </a>
                        <a href='../diplomados' className="group mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-green bg-gradient-to-r from-green/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10 w-full md:w-auto">
                            Conoce el Diplomado
                            <div className="inline opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                <StaticImage className='w-6 h-6' src="../images/elements/decor2.png" alt="decoration" />
                            </div>                        
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}
export default NextCourse



