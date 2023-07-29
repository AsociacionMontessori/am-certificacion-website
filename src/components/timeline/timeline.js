import React from 'react';
import './time.css';

import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config.js'

const fullConfig = resolveConfig(tailwindConfig)
const red = fullConfig.theme.colors.red.DEFAULT
const green = fullConfig.theme.colors.green
const blue = fullConfig.theme.colors.blue

const Timeline = () => {
    const title = "Conoce la Asociación Montessori"
    const items = [
        {
            title: 'Fundación de AMMAC',
            content: 'La Asociación Montessori de México A.C. (Ammac) se fundó con el objetivo de promover la pedagogía de María Montessori en México. Con más de 57 años de experiencia, somos pioneros en la implementación y difusión del método Montessori en todo el mundo. Nuestro equipo está formado por profesionales apasionados por la educación y comprometidos con el crecimiento y desarrollo integral de cada niño.',
            year: '1964'
        },
        {
            title: 'Kalpilli Montessori',
            content: 'Kalpilli Montessori abre sus puertas ... Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut quam felis, rutrum nec enim non, sodales facilisis purus. Vestibulum viverra egestas ipsum eget commodo. Nullam aliquet lorem vitae nulla dictum vestibulum sed quis tellus. Sed diam diam, facilisis tincidunt volutpat nec, auctor quis magna. Proin sed nunc iaculis ipsum scelerisque tincidunt. Cras eleifend leo tellus, fermentum finibus tortor fringilla eu.',
            year: '1964'
        },
        {
            title: 'Random dots?',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut quam felis, rutrum nec enim non, sodales facilisis purus. Vestibulum viverra egestas ipsum eget commodo. Nullam aliquet lorem vitae nulla dictum vestibulum sed quis tellus. Sed diam diam, facilisis tincidunt volutpat nec, auctor quis magna. Proin sed nunc iaculis ipsum scelerisque tincidunt. Cras eleifend leo tellus, fermentum finibus tortor fringilla eu.',
            year: '1964'
        },
        {
            title: 'Absolutely nothing.',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut quam felis, rutrum nec enim non, sodales facilisis purus. Vestibulum viverra egestas ipsum eget commodo. Nullam aliquet lorem vitae nulla dictum vestibulum sed quis tellus. Sed diam diam, facilisis tincidunt volutpat nec, auctor quis magna. Proin sed nunc iaculis ipsum scelerisque tincidunt. Cras eleifend leo tellus, fermentum finibus tortor fringilla eu.',
            year: '1964'
        },
    ];

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
            <section className="block-content t-block-teal l-block-spacing pl-10 md:ml-40">
                <div className="l-contained">
                    <header className="heading-group">
                        <h2 className="text-blue dark:text-white text-6xl">{title}</h2>
                    </header>
                    <div>
                        <ul className="timeline-list" style={{ position: 'relative' }}>
                            <div>
                                <div style={{ ...beforeStyles, ...{ background: `repeating-linear-gradient(0deg, ${red} 0%, ${red} 20%, ${blue} 25%, ${blue} 45%, ${red} 50%, ${red} 70%, ${blue} 75%, ${blue} 100%)` } }}></div>
                                <div style={afterStyles}></div>
                            </div>
                            {items.map((item) => (
                                <li key={item.title}>
                                    <div className="content pt-12 px-6">
                                        <h3 className="text-white text-6xl px-4 py-2 bg-red w-3/5 rounded-3xl bg-opacity-70">{item.title}</h3>
                                        <span className="lg:hidden">{item.year}</span>
                                        <p className="text-black dark:text-white text-3xl pt-5 ">{item.content}</p>
                                        <div className="hidden lg:block">
                                            <span className="absolute dark:opacity-60 opacity-30 top-20 text-8xl font-bold mt-20 -ml-60 -rotate-90 text-blue">{item.year}</span>
                                        </div>
                                        <div>
                                            <div className='absolute top-20 mt-60 -ml-60'>
                                                <svg width='50' height='50'>
                                                    <circle cx='25' cy='25' r='20' stroke={blue} opacity={.15} stroke-width='2' fill='transparent' />
                                                </svg>
                                            </div>
                                            <div className='absolute top-10 mt-20 -ml-60'>
                                                <svg width='100' height='110' rotate={25}>
                                                    <rect transform="rotate(-45 100 50)" x='10' y='10' width='30' height='30' stroke={blue} opacity={.15} stroke-width='2' fill='transparent' />
                                                </svg>
                                            </div>
                                            <div className='absolute top-20 mt-64 -ml-40'>
                                                <svg width='100' height='200'>
                                                    <rect transform="rotate(22 0 50)" x='10' y='10' width='30' height='30' stroke={blue} opacity={.15} stroke-width='2' fill='transparent' />
                                                </svg>
                                            </div>
                                        </div>
                                        <a className='btn mt-4'>
                                            conoce el metodo
                                        </a>
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