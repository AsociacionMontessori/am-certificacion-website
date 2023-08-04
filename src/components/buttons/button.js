import React from 'react';
// import './time.css';

// import resolveConfig from 'tailwindcss/resolveConfig'
// import tailwindConfig from '../../../tailwind.config.js'

// const fullConfig = resolveConfig(tailwindConfig)
// const red = fullConfig.theme.colors.red.DEFAULT
// const green = fullConfig.theme.colors.green
// const blue = fullConfig.theme.colors.blue

const Button = ({ text, type }) => {
    let buttonClass = "btn btn-outline rounded-full px-6 sm:px-8 mr-4 text-white text-xs sm:text-base md:text-lg";
    let gradientClass = "";
    let hoverClass = "hover:text-white";

    switch (type) {
        case "blue":
            buttonClass += " bg-blue bg-opacity-10 hover:bg-opacity-70";
            gradientClass = "bg-gradient-to-r from-blue/50 hover:from-blue";
            break;
        case "green":
            return (
                <a href="https://kalpilli.com/MetodoMontessori/" target="__blank" className="btn btn-outline rounded-full px-10 mr-4 text-white bg-opacity-10 hover:text-white hover:bg-opacity-70 bg-gradient-to-r from-green/50 hover:from-green">
                    Conoce el Método
                </a>
            );
        case "red":
            buttonClass += " bg-red";
            hoverClass += " hover:bg-red hover:from-blue hover:bg-opacity-70";
            break;
        case "blue-green":
            buttonClass += " bg-green hover:bg-opacity-70";
            gradientClass = "bg-gradient-to-r from-blue hover:from-blue";
            hoverClass += " hover:bg-green hover:from-blue";
            break;
        default:
            return null;
    }

    return (
        <>
            <button className={`${buttonClass} ${gradientClass} ${hoverClass}`}>
                {text}
            </button>
        </>
    );
};


// const Button = ({ text, type }) => {
//     if (type === "blue") {
//         return (
//             <>
//                 <button className="btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-blue text-white bg-opacity-10">
//                     {text}
//                 </button>
//             </>
//         );
//     } else if (type === "green") {
//         return (
//             <>
//                 <a href="https://kalpilli.com/MetodoMontessori/" target="__blank" className="btn btn-outline hover:text-white hover:bg-green bg-gradient-to-r from-green/50 hover:from-gray hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10">
//                     Conoce el Método
//                 </a>
//             </>
//         );
//     } else if (type === "red") {
//         return (
//             <>
//                 <button className="btn btn-outline bg-red hover:text-white hover:bg-red hover:from-blue hover:bg-opacity-70 rounded-full px-10 mr-4 text-white">
//                     {text}
//                 </button>
//             </>
//         );
//     }
//     else if (type === "blue-green") {
//         return (
//             <>
//                 <button className="btn btn-outline bg-green from-blue bg-opacity-70 bg-gradient-to-r hover:text-white hover:bg-green hover:from-blue hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10">
//                     {text}
//                 </button>
//             </>
//         );
//     }
// };

export default Button;