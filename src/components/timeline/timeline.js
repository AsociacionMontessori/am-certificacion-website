import React, { useState } from 'react';
import './time.css';

import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config.js'

const fullConfig = resolveConfig(tailwindConfig)
const red = fullConfig.theme.colors.red.DEFAULT
const blue = fullConfig.theme.colors.blue

function TextoExpansible({ contenido }) {
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
            Ver más
          </button>
        )}
      </div>
    );
  }

const Timeline = () => {
    const title = "Asociación Montessori de México - AMMAC"
    const items = [
        {
            title: 'Fundación de la AMMAC',
            content: 'Fundada por la Dra. Angelina Almeida con el objetivo de introducir y promover la pedagogía y la filosofía del método de María Montessori en México, nace la Asociación Montessori de México A.C., convirtiéndose así en una de las primeras organizaciones formalmente constituida dedicada a la formación profesional de Guías Montessori, la apertura de escuelas y el estudio del método Montessori.',
            year: '1965',
            color: "blue"
        },
        {
            title: 'La AMMAC crea la primera escuela Montessori en la Ciudad de México: la Escuela Montessori Kalpilli',
            content: 'Durante el año de su fundación, la AMMAC abre las puertas de la Escuela Montessori Kalpilli, siendo ésta la primera escuela Montessori en la Ciudad de México. Ubicada  originalmente en la colonia Polanco, Montessori Kalpilli inició sus labores impartiendo una educación basada en la pedagogía científica de María Montessori, cuyo método y filosofía tiene como propósito enfocarse en el desarrollo integral del niño.',
            year: '1966',
            color: "red"
        },
        {
            title: 'Primera muestra pedagógica abierta',
            content: 'La Asociación Montessori organiza en la Escuela Montessori  Kalpilli, la primera muestra pedagógica abierta a público y prensa con el objetivo de difundir y mostrar la aplicación del método Montessori, el uso de materiales y la importancia de las presentaciones Montessori. Las muestras pedagógicas se han convertido en una tradición de la AMMAC que año con año realiza en las instalaciones de la Escuela Montessori Kalpilli. ',
            year: '1967',
            color: "blue"
        },
        {
            title: 'La AMMAC y su participación en la creación de Escuelas Montessori',
            content: 'Durante sus primeros años, la AMMAC participó en la creación y desarrollo de escuelas Montessori en el país, realizando programas de estudio, distribución de material Montessori exportado directamente de Italia y formando guías Montessori nivel profesional. ',
            year: '1970',
            color: "red"
        },
        {
            title: 'La AMMAC y el Gobierno de Tabasco',
            content: 'La AMMAC forma una alianza con el gobierno de Tabasco y de manera conjunta desarrollan un programa de capacitación pedagógica a maestros Nahuas, Chontales, Mayas, Zapotecos, Totonacas y Mixes.',
            year: '1984',
            color: "blue"
        },
        {
            title: 'Montessori Kalpilli en San Pedro de los Pinos',
            content: 'La Escuela Montessori Kalpilli encuentra su nueva sede en la colonia San Pedro de los Pinos, entre libros, aprendizaje, material Montessori, ferias, campamentos, y mucho amor, Kalpilli y la Asociación Montessori de México han hecho historia, construyendo una comunidad por y para los niños, con una Educación Humanista e Innovadora que a la fecha ha dado más de 50 generaciones. ',
            year: '1992',
            color: "red"
        },
        {
            title: 'Programa de capacitación a escuelas rurales',
            content: 'La AMMAC crea un programa de capacitación del método Montessori a maestros de escuelas rurales y los talleres de producción de materiales y mobiliario Montessori de bajo costo y con recursos renovables. A través de este programa se han realizado proyectos de apertura de escuelas Montessori en zonas rurales de Veracruz, Guerrero y Oaxaca. ',
            year: '1997',
            color: "blue"
        },
        {
            title: 'Certificaciones profesionales para Guías Montessori con validez internacional',
            content: 'La AMMAC inició su oferta de formación profesional de Guías Montessori,destacándose por ser la única reconocida oficialmente por la Universidad Nacional Autónoma de México, la Universidad Autónoma Metropolitana y la Universidad del Valle de México, cumpliendo además con las competencias y acuerdos internacionales para generar certificaciones con validez internacional. ',
            year: '2005',
            color: "red"
        },
        {
            title: 'Certificaciones profesionales para Guías Montessori en línea',
            content: 'En colaboración con Google Classroom, la AMMAC crea la primera versión de sus diplomados de certificación para Guía Montessori en línea, siendo así la primera escuela de formación que ofrecía diplomados a distancia y la primera organización educativa en México vinculada a Google Classroom.  Desde entonces, las certificaciones en línea forman parte de la oferta educativa de la AMMAC, la cual ha generado una metodología de enseñanza personalizada de formación con materiales audiovisuales e interactivos. ',
            year: '2014',
            color: "blue"
        },
        {
            title: 'La AMMAC participa en proyectos Internacionales',
            content: 'A partir de este año, la AMMAC diseña y coordina cursos y diplomados en países como Colombia, Puerto Rico, España, Costa Rica y Estados Unidos, Israel, Suiza y la India. Atendiendo a la población hispanohablante de cada una de estas regiones y contribuyendo con la traducción, a diferentes lenguas, de varias de las cátedras diseñadas por la AMMAC para presentarse en diferentes centros educativos internacionales.',
            year: '2016',
            color: "red"
        },
        {
            title: 'La AMMAC crea su sello editorial',
            content: 'Nace la serie de libros en español basados en las obras originales de María Montessori, cada uno acompañado por una revisión actualizada del método, pues atendiendo el llamado de la Dra. Montessori, la pedagogía debe ser puesta constantemente a revisión y renovación, no solo por los avances científicos, sino también -y sobre todo- por la observación permanente a los niños, quienes nos siguen guiando para encontrar caminos que nos permitan continuar sirviendo a su desarrollo. El sello editorial ha publicado ya 3 números los cuales pueden adquirirse en Amazon y directamente con la AMMAC.',
            year: '2018',
            color: "blue"
        },
        {
            title: 'Aportaciones de la AMMAC a investigaciones educativas con motivo de la contingencia epidemiológica mundial por el COVID-19',
            content: 'A raíz de la contingencia epidemiológica mundial, la AMMAC participa en una red de escuelas de diferentes partes del mundo para de manera conjunta realizar una investigación en torno a los procesos de aprendizaje en momentos de la crisis sanitaria, los recursos de adaptabilidad de las escuelas, el desarrollo de estrategias pedagógicas para el trabajo con niños a distancia y el registro y análisis de indicadores de afectación en el desarrollo educativo de los niños por las transformaciones a los modelos educativos y sus secuelas. En la Asociación Montessori de México nos enorgullece ser una asociación que construye y genera conocimiento, que día con día se posiciona en el mundo, mostrando que, desde México, desde la realidad latinoamericana contemporánea, hay mucho que aportar al desarrollo educativo internacional, que somos una asociación que se ha comprometido como agente activo en la educación humanista, a la vanguardia y de evolución constante. Y todo ello, no sería posible si no gracias a todos los que forman parte de esta gran comunidad, una comunidad global maravillosa que crece y se fortalece cada vez más.',
            year: '2020',
            color: "red"
        },

    ];


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
            <section className="block-content t-block-teal l-block-spacing pl-10 md:ml-40">
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