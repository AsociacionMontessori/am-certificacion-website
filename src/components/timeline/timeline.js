import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './time.css';

import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config.js'

const fullConfig = resolveConfig(tailwindConfig)
const red = fullConfig.theme.colors.red.DEFAULT
const blue = fullConfig.theme.colors.blue

function TextoExpansible({ contenido }) {
    const { t } = useTranslation('home');
    const [expanded, setExpanded] = useState(false);
  
    const toggleTexto = () => {
      setExpanded(!expanded);
    };
  
    return (
      <div>
        <p className={`text-black dark:text-white text-sm sm:text-xl md:text-2xl ${expanded ? '' : 'line-clamp-4 md:line-clamp-3'}`}>
          {contenido}
        </p>
        {!expanded && (
          <button
            onClick={toggleTexto}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            {t('timeline.verMas')}
          </button>
        )}
      </div>
    );
  }

const Timeline = () => {
    const { t } = useTranslation('home');
    const title = t('timeline.titulo')
    // Los textos viven en home.json bajo `timeline.items.<clave>`.
    const itemKeys = [
        { key: 'fundacion', year: '1965', color: "blue" },
        { key: 'kalpilli', year: '1966', color: "red" },
        { key: 'muestraPedagogica', year: '1967', color: "blue" },
        { key: 'creacionEscuelas', year: '1970', color: "red" },
        { key: 'tabasco', year: '1984', color: "blue" },
        { key: 'sanPedroDeLosPinos', year: '1992', color: "red" },
        { key: 'escuelasRurales', year: '1997', color: "blue" },
        { key: 'certificacionesInternacionales', year: '2005', color: "red" },
        { key: 'certificacionesEnLinea', year: '2014', color: "blue" },
        { key: 'proyectosInternacionales', year: '2016', color: "red" },
        { key: 'selloEditorial', year: '2018', color: "blue" },
        { key: 'covid', year: '2020', color: "red" },
        { key: 'estandaresAmi', year: '2023', color: "blue" },
        { key: 'sesentaAnios', year: '2025', color: "red" },
        { key: 'rvoe', year: '2026', color: "blue" },
    ];
    const items = itemKeys.map(({ key, year, color }) => ({
        title: t(`timeline.items.${key}.titulo`),
        content: t(`timeline.items.${key}.contenido`),
        year,
        color,
    }));


    const getColor = (color) => {
        switch (color) {
            case "red":
                return red;
            case "blue":
                return blue;
            default:
                return red;
        }
    }

    const beforeStyles = {
        content: '""',
        padding: '0em .7em 0em 0em',
        left: '-0.2em',
        top: '2em',
        height: '100%',
        position: 'absolute',
        bottom: 0,
        top: 0,
        transformOrigin: '0 0',
        animation: 'scaleVertical 3s 1s ease both 1',
    };

    const afterStyles = {
        content: '""',
        clear: 'both',
        position: 'absolute',
        bottom: '0px',
        left: '-1.05em',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: `none repeat scroll 0% 0% ${red}`,
        border: `5px solid ${red}`,
        boxShadow: '1px 1px 1px rgba(0, 0, 0, 0.1)',
        animation: 'revealScaleUp 0.75s 2.82s ease both 1',
    };

    return (
        <>
            <section id='sobrenosotros' className="block-content t-block-teal l-block-spacing pl-10 md:ml-40">
                <div className="l-contained">
                    <header className="heading-group pl-10 sm:pl-0">
                        <h2 className="text-blue dark:text-white text-3xl sm:text-5xl lg:text-6xl font-bold">{title}</h2>
                    </header>
                    <div>
                        <ul className="timeline-list" style={{ position: 'relative' }}>
                            <div>
                                <div style={{ ...beforeStyles, ...{ background: `repeating-linear-gradient(0deg, ${red} 0%, ${red} 8.33%, ${red} 8.33%, ${red} 13%, ${blue} 15%, ${blue} 20%, ${red} 22%, ${red} 30%, ${blue} 33.33%, ${blue} 39%, ${red} 41.67%, ${red} 48%, ${blue} 50%, ${blue} 55%, ${red} 58.33%, ${red} 62%, ${blue} 66.67%, ${blue} 68%, ${red} 72%, ${red} 73%, ${blue} 78.33%, ${blue} 81%, ${red} 85.67%, ${red} 91.67%,${blue} 93%, ${blue} 100%)` } }}></div>
                                <div style={afterStyles}></div>
                            </div>
                            {items.map((item) => (
                                <li className='mb-10' key={item.title}>
                                    <div className="content pt-12 md:px-2 md:px-6">
                                        <span className="lg:hidden text-4xl absolute dark:opacity-60 opacity-30 top-0 font-bold text-blue">{item.year}</span>
                                        <h3 className="font-semibold text-black dark:text-white text-sm sm:text-3xl md:text-4xl dark:px-2 sm:px-2 px-4 py-2 mt-4  bg-blue w-full md:w-auto rounded-3xl bg-opacity-10 dark:bg-opacity-0">
                                            {item.title}
                                        </h3>
                                        <TextoExpansible  contenido={item.content} />
                                        <div className="hidden lg:block">
                                            <span className={`absolute dark:opacity-60 opacity-30 dark:opacity-70 top-20 text-8xl font-bold mt-20 -ml-60 -rotate-90 text-${item.color}`}>{item.year}</span>
                                        </div>
                                        <div>
                                            <div className='absolute top-20 mt-60 -ml-60'>
                                                <svg width='50' height='50'>
                                                    <circle cx='25' cy='25' r='20' stroke={getColor(item.color)} opacity={.30} strokeWidth='2' fill='transparent' />
                                                </svg>
                                            </div>
                                            <div className='absolute top-10 mt-20 -ml-60'>
                                                <svg width='100' height='110' rotate={25}>
                                                    <rect transform="rotate(-45 100 50)" x='10' y='10' width='30' height='30' stroke={getColor(item.color)} opacity={.15} strokeWidth='2' fill='transparent' />
                                                </svg>
                                            </div>
                                            <div className='absolute top-20 mt-64 -ml-40'>
                                                <svg width='100' height='200'>
                                                    <rect transform="rotate(22 0 50)" x='10' y='10' width='30' height='30' stroke={getColor(item.color)} opacity={.15} strokeWidth='2' fill='transparent' />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                    </div>


                </div>

            </section>
        </>
    );
};

export default Timeline;