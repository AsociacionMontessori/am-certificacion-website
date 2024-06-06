import * as React from 'react';
import '../styles/global.css';
import Layout from '../components/layout';
import Seo from '../components/seo';
import imagen from '../images/banners/home.png';
import ImgMap from '../images/banners/map.png';
import ImgMapDark from '../images/banners/dark_map.png';
import { StaticImage } from 'gatsby-plugin-image';
import Timeline from '../components/timeline/timeline';
import Nav from '../components/nav';
import NextCourse from '../components/nextCourse';
import { useState } from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';

function CustomParagraph1({ text }) {
  return (
    <p className="italic bg-red/50 text-white dark:bg-black hover:font-semibold dark:hover:text-blue rounded-full py-3 px-10 dark:text-white/80 mx-3 selection:bg-blue selection:text-white">
      {text}
    </p>
  );
}
function CustomParagraph2({ text }) {
  return (
    <p className="italic bg-red/50 text-white dark:bg-black hover:font-semibold dark:hover:text-green/70 rounded-full py-3 px-10 dark:text-white/80 mx-3 selection:bg-green/70 selection:text-white">
      {text}
    </p>
  );
}

const phrases = [
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
];

const phrases2 = [
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
  "El niño crea sus propios movimientos y, una vez creados, los perfecciona",
  "No se puede ser libre, si no se es independiente",
  "Lo que la mano hace, la mente lo recuerda",
];

const IndexPage = () => {
  const [rectPosY, setRectPosY] = useState(0);
  const [rectPosX, setRectPosX] = useState(0);
  const areaRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setRectPosY(rectPosY - e.pageY / 40);
      setRectPosX(rectPosX - e.pageX / 40);
    };

    areaRef.current.addEventListener('mousemove', handleMouseMove);

    return () => {
      areaRef.current.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <Layout>
      <Nav textColor="text-white" />
      <main>
        <section id="home" className="relative flex items-center area" ref={areaRef}>
          <div aria-hidden="true" className="absolute inset-0 z-[1] bg-gradient-to-b from-white/0 via-white/10 to-white/60  dark:bg-gradient-to-b dark:from-white/0 dark:via-gray/20 dark:to-gray" />
          <div className='absolute inset-0 z-[1] opacity-80' style={{ top: rectPosY, left: rectPosX }}>
            <div className='w-full'>
            <StaticImage src='../images/elements/decorwall.png' placeholder="none" ></StaticImage>
            </div>
          </div>
          <img src={imagen} className="fixed inset-0 h-full w-full object-cover" alt="woman in dark" width="4160" height="6240" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-10 md:pb-20 lg:pb-40  md:pt-12 lg:pt-20 lg:px-12 xl:px-6 2xl:px-0 selection:text-white selection:bg-green selection:bg-opacity-20">
            <div className="pb-6 media-h:md:pb-20 media-h:lg:pb-4 xl:pb-2">
              <h1 data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" className="rellax text-3xl font-bold text-white sm:text-7xl md:text-8xl xl:leading-tight" >
                Asociación Montessori <br />de México A.C.
              </h1>
            </div>
            <div>
              <div className="mr-auto md:w-3/5 md:pt-2 lg:w-2/3">
                <p className="mb-2 sm:mb-2 xl:mb-5 text-sm md:text-lg font-light text-white sm:text-2xl xl:leading-normal">
                  Únete a nosotros en este emocionante viaje de aprendizaje y exploración.
                  <div className='hidden md:inline pl-1'>
                    Descubre la filosofía y práctica de este gran método, con nuestras clases gratuitas, contenido y certificaciones con validez internacional.
                  </div>
                </p>
                <NextCourse URLiframe={"https://montessorimexico.org/proxima-certificacion/"} URLButton={"/certificate/#certificacion_internacional"} />
              </div>
            </div>
          </div>
        </section>
        <section id="work" className="relative py-5 z-10 bg-white dark:bg-gray lg:pt-0">
          <div className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-6 2xl:px-0 pt-10">
            <div data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" className="rellax flex flex-wrap items-center gap-6 selection:text-white selection:bg-red selection:bg-opacity-20">
              <h2 className="pt-5 text-red font-bold dark:text-white sm:text-4xl md:text-5xl xl:text-6xl">EDUCACIÓN SIGNIFICATIVA</h2>
              <p className="text-base text-black dark:text-white md:text-2xl">
                En la educación significativa,<span className="text-blue underline dark:text-white underline-offset-4 dark:selection:bg-red selection:bg-blue dark:decoration-red"> se busca que los estudiantes se involucren de manera activa en su propio proceso de aprendizaje,</span> relacionando los nuevos conceptos con su conocimiento previo y con su entorno. El objetivo es que los estudiantes no solo adquieran información de manera pasiva, sino que la comprendan, le encuentren sentido y la integren en su propia estructura cognitiva.
              </p>
            </div>
          </div>
          <div className="overflow-hidden mt-5">
            <section className="my-5 block h-12 overflow-hidden relative w-max marquee-left xxl:hidden">
              <div className="flex float-left w-50">
                {phrases.map((phrase, index) => (
                  <CustomParagraph1 key={index} text={phrase} />
                ))}
              </div>
            </section>
            <section className="my-5 block h-12 overflow-hidden relative w-max marquee-left xxl:hidden mb-20">
              <div className="flex float-left w-50">
                {phrases2.map((phrase, index) => (
                  <CustomParagraph2 key={index} text={phrase} />
                ))}
              </div>
            </section>
            <section className="bg-gradient-to-r from-blue via-purple to-green py-20 md:py-10">
              <div className="flex justify-center">
                <div className="flex justify-center relative w-full selection:text-white selection:bg-green selection:bg-opacity-20">
                  <img src={ImgMapDark} className="w-full h-3/12 dark:hidden" alt="map" />
                  <img src={ImgMap} className="w-full h-3/12 hidden dark:block" alt="map in dark" />
                  <div className="flex justify-center absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                    <h2 className="text-white text-center">
                      <span className="font-extrabold text-center text-sm sm:text-base md:text-2xl xl:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-slate-200/60 to-50% to-slate-200">Todas nuestros diplomados cuentan con: </span><br />
                      <span className="font-bold text-center text-2xl sm:text-3xl md:text-4xl xl:text-6xl drop-shadow-2xl">Certificación Internacional</span>
                    </h2>
                  </div>
                  <div className="pt-20 md:pt-0 flex space-x-2 md:space-x-14 lg:space-x-24 absolute top-2/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-max">
                    <StaticImage src="../images/countries/mex.png" alt="Mexican flag" className="h-10 w-10 md:w-16 md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-0s" />
                    <StaticImage src="../images/countries/eua.png" alt="United States flag" className="h-10 w-10 md:w-16 md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-3s" />
                    <StaticImage src="../images/countries/col.png" alt="Colombian flag" className="h-10 w-10 md:w-16 md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-6s" />
                    <StaticImage src="../images/countries/arg.png" alt="Argentinian flag" className="h-10 w-10 md:w-[4.25rem] md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-9s" />
                    <StaticImage src="../images/countries/can.png" alt="Canadian flag" className="h-10 w-10 md:w-[4.95rem] md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-12s" />
                    <StaticImage src="../images/countries/ale.png" alt="German flag" className="h-10 w-10 md:w-16 md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-15s" />
                    <StaticImage src="../images/countries/eng.png" alt="English flag" className="h-10 w-10 md:w-16 md:h-16 transform hover:scale-110 transition-transform bounce-animation delay-18s" />
                  </div>
                  <div className="absolute mb-20 md:mt-0 mt-20 top-3/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                    <p className="font-bold text-center lg:text-2xl text-xs md:text-sm lg:p-0 p-2 text-white uppercase font-light">
                      Las certificaciones Montessori cuentan con un gran reconocimiento en todo el mundo
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <Timeline />
        </section>
      </main>
    </Layout>
  );
}

export const Head = () => <Seo title="Inicio" description="Conoce la Asociación Montessori De México A.C." />
export default IndexPage
