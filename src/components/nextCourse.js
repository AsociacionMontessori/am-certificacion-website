import React from "react"

const NextCourse = ({URLiframe, URLButton}) => {
    return (
        <>
            <div className="pb-10 lg:pb-0">
                <h2 className="py-2 lg:py-10">
                    <span className="text-white text-2xl font-bold">Próximos Cursos:</span>
                </h2>
                <div className="relative">
                    <iframe title="Próximos Cursos" scrolling="no" style={{ background: "transparent", colorScheme: "normal", color: "white" }} className="w-full h-24" allowtransparency="true" src={URLiframe} />
                    <div className="pt-0">
                        <a href="https://docs.google.com/forms/d/e/1FAIpQLScmvkdg4BSCWsempnaQhJWc0ZGaYFSrgiFcnJ3hlpQqF8PU0g/viewform" target="__blank" className="mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-blue text-white bg-opacity-10 w-full md:w-auto">
                            Inscríbete Ahora
                        </a>
                        <a href={URLButton} className="mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-green bg-gradient-to-r from-green/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10 w-full md:w-auto">
                            Conocer las certificaciones
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="hidden sm:block bi bi-caret-down" viewBox="0 0 16 16"> <path d="M3.204 5h9.592L8 10.481 3.204 5zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z" /> </svg>
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}
export default NextCourse



