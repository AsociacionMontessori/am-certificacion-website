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
            title: 'Fundación',
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
        padding: '0.1em 0.1em',
        left: '-0.6em',
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
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: `none repeat scroll 0% 0% ${red}`,
        border: `5px solid ${red}`,
        boxShadow: '1px 1px 1px rgba(0, 0, 0, 0.1)',
        animation: 'revealScaleUp 0.75s 2.82s ease both 1',
    };

    return (
        <>
            <section className="block-content t-block-teal l-block-spacing pl-10 ml-10">
                <div className="l-contained">
                    <header className="heading-group">
                        <h2 className="text-black dark:text-white">{title}</h2>
                    </header>
                    <div>
                        <ul className="timeline-list" style={{ position: 'relative' }}>
                            <div>
                                <div style={{ ...beforeStyles, ...{ background: `linear-gradient(to bottom, ${blue} ,${red})`}}}></div>
                                <div style={afterStyles}></div>
                            </div>
                            {items.map((item) => (
                                <li key={item.title}>
                                    <div className="content">
                                        <h3 className="text-red">{item.title}</h3>
                                        <span className="lg:hidden">{item.year}</span>
                                        <p className="text-black dark:text-white">{item.content}</p>
                                        <div className="hidden lg:block">
                                            <span className="absolute dark:opacity-80 opacity-30 top-1 text-6xl font-bold mt-16 -ml-40 -rotate-90 text-blue">{item.year}</span>
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