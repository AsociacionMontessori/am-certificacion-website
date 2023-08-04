import * as React from "react"


const Button = ({text}) => {
    return (
        <>
            <button className="text-center btn-outline hover:text-white hover:bg-blue hover:from-green hover:bg-opacity-70 rounded-full px-10 text-white bg-gradient-to-r from-blue to-green h-14 text-2xl font-semibold">
                {text}
            </button>
        </>
    )
}

export default Button
