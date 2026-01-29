import React, { useState, useEffect } from "react";
import Nav from "../components/nav";
import { StaticImage } from "gatsby-plugin-image";
import Layout from "../components/layout";
import CertificationPrice from "../components/certificationPrice";
import Scholarship from "../components/scholarship";
import { DIPLOMADOS_EN_LINEA, getNextItem } from "../components/nextCourse";

const FORM_INSCRIPCION = "https://forms.gle/pQKbTjGKCMYtnjuY6";

export default function Landing() {
  const [proximoInicio, setProximoInicio] = useState(null);

  useEffect(() => {
    const next = getNextItem(DIPLOMADOS_EN_LINEA);
    setProximoInicio(next ? next.label : null);
  }, []);

  const gradientTextStyle = {
    backgroundImage: 'linear-gradient(to right, from-blue, via-blue, to-green)',
    WebkitBackgroundClip: 'text', // para navegadores basados en WebKit
    backgroundClip: 'text',
    color: 'transparent',
  };

  return (
    <>
      <Layout>
        <main className="bottom-0 right-0 bg-gradient-to-r from-blue via-purple to-green -z-20">
          <Nav textColor="text-white" />
          <main className="overflow-hidden selection:text-white selection:bg-green selection:bg-opacity-20">
            <section id="home" className="relative flex pb-24 md:pb-32">
              {/* <div aria-hidden="true" className="absolute inset-0 z-[1] bg-gradient-to-b from-white/0 via-gray/20 to-gray"></div> */}
              {/* <img src={imagen} className="fixed inset-0 h-full w-full object-cover" alt="woman in dark" width="4160" height="6240" /> */}
              <div className="fixed inset-0 w-full object-cover"
                style={{
                  backgroundSize: "cover",
                  backgroundImage: "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1267&q=80')"
                }}>
                <span id="blackOverlay" className="w-full h-full absolute opacity-75 bg-black"></span>
              </div>
              <div className="container pt-20 relative mx-auto">
                <div className="flex flex-wrap">
                  <div className="w-full lg:w-6/12 lg:w-10/12 px-4 ml-auto mr-auto lg:text-center">
                    <div>
                      <p className="text-sm sm:text-base uppercase tracking-widest text-green-300/90 mb-2">
                        Certificación internacional • 100% en línea • A tu ritmo
                      </p>
                      <h1 data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" className="rellax text-4xl sm:text-5xl font-bold text-white sm:text-7xl md:text-8xl xl:leading-tight font-semibold">
                        Diplomados: <span className="block">Guía Montessori</span>
                      </h1>
                      <p className="mt-6 sm:mt-10 text-md sm:text-lg md:text-xl text-gray-300 max-w-2xl">
                        Programas diseñados para un conocimiento práctico y profundo en educación y método Montessori. Termina como Guía Montessori con certificado de validez internacional.
                      </p>
                      <a
                        href="#certificacion_internacional"
                        className="inline-flex items-center gap-2 mt-6 sm:mt-8 px-6 py-3 rounded-full bg-white text-blue font-semibold hover:bg-green hover:text-white transition-all duration-300 shadow-lg"
                      >
                        Ver programas y precios
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      </a>
                      <div className="relative lg:mt-16 lg:p-10 mt-6 p-2 sm:p-4 border border-white/60 bg-black/40 backdrop-blur-sm lg:border-white/80 lg:hover:border-green transition duration-300 ease-in-out rounded-3xl">
                        <div className="absolute bottom-0 right-0 lg:-top-[40vh] lg:-left-60 w-20 lg:w-1/2 lg:opacity-50">
                          <StaticImage src="../images/elements/decor1.png" placeholder="none" alt="decoración" className="w-20 lg:w-full pointer-events-none select-none" />
                        </div>
                        <p className="text-xs sm:text-sm md:text-xl text-gray-200">
                          Al finalizar tus programas estarás listo para trabajar como Guía Montessori en cualquier escuela del mundo y marcar una diferencia real en la vida de tus alumnos.
                          Estudia desde cualquier lugar con nuestra plataforma en línea.
                        </p>
                        <p className="text-xs sm:text-sm text-white/90 mt-3">
                          Tu acceso incluye: <strong className="text-white">Google Workspace</strong> (Drive 1 TB, correo institucional y servicios de Google), además de estudio con apoyo de <strong className="text-white">IA de Google</strong> (Notebook LM, Gemini).
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs text-white/80">
                          <span className="px-2 py-1 rounded bg-white/10">CONOCER</span>
                          <span className="px-2 py-1 rounded bg-white/10">RVOE en trámite</span>
                          <span className="px-2 py-1 rounded bg-white/10">Google for Education</span>
                          <span className="px-2 py-1 rounded bg-white/10">Gemini IA</span>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-4 mt-5 px-2 w-full">
                          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full max-w-2xl mx-auto">
                            <div className="h-16 w-56 flex items-center justify-center flex-shrink-0">
                              <StaticImage src="../images/elements/google2.png" placeholder="none" alt="Google Classroom" className="h-full w-auto max-w-full object-contain object-center pointer-events-none select-none" />
                            </div>
                            <div className="h-20 w-64 flex items-center justify-center flex-shrink-0">
                              <StaticImage src="../images/elements/google1.png" placeholder="none" alt="Google for Education" className="h-full w-auto max-w-full object-contain object-center pointer-events-none select-none" />
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-6 sm:gap-8">
                            <div className="h-7 w-20 flex items-center justify-center">
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg"
                                alt="Gemini IA"
                                className="h-full w-auto max-w-full object-contain object-center opacity-95"
                              />
                            </div>
                            <div className="h-7 w-24 flex items-center justify-center">
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/5/57/NotebookLM_logo.svg"
                                alt="Notebook LM"
                                className="h-full w-auto max-w-full object-contain object-center opacity-95 invert"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
          <div className="relative bg-gradient-to-r from-blue via-purple to-green pb-32 flex content-center items-center justify-center">
            <div
              className="top-auto bottom-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden"
              style={{ height: "70px" }}
            >
              <svg
                className="absolute bottom-0 overflow-hidden"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                version="1.1"
                viewBox="0 0 2560 100"
                x="0"
                y="0"
              >
                <polygon
                  className="text-gray-300 fill-current"
                  points="2560 0 2560 100 0 100"
                ></polygon>
              </svg>
            </div>
          </div>

          <section className="relative bg-gradient-to-r from-blue via-purple to-green pb-20 -mt-24 z-20">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center ">



                {/* <div className="w-full md:w-5/12 px-4 mr-auto ml-auto">
                  <div className="text-gray-600 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-red">
                    <svg viewBox="0 0 24 24" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg"><defs>
                    </defs><path style={{ fill: "none", stroke: "white", strokeMiterLimit: 10, strokeWidth: "1.91px" }} d="M17.73,9.61A8.1,8.1,0,0,1,4.4,15.81a8.11,8.11,0,1,1,13.33-6.2Z" /><path style={{ fill: "none", stroke: "white", strokeMiterLimit: 10, strokeWidth: "1.91px" }} d="M10.09,9.61a.5.5,0,0,1-.17.37.47.47,0,0,1-.31.11.47.47,0,0,1-.47-.48.48.48,0,0,1,.95,0Z" /><path style={{ fill: "none", stroke: "white", strokeMiterLimit: 10, strokeWidth: "1.91px" }} d="M15.12,15.54a3.82,3.82,0,0,1,1.65,3.14V22.5H2.45V18.68a3.8,3.8,0,0,1,1.66-3.14" /><polyline style={{ fill: "none", stroke: "white", strokeMiterLimit: 10, strokeWidth: "1.91px" }} points="21.55 9.14 21.55 19.64 16.77 19.64" /><circle style={{ fill: "none", stroke: "white", strokeMiterLimit: 10, strokeWidth: "1.91px" }} cx="21.55" cy="9.14" r="0.95" /></svg>
                  </div>
                  <h3 className="text-3xl mb-2 font-semibold leading-normal text-white">
                    Estructura del Programa
                  </h3>
                  <p className="text-md md:text-xl  font-light leading-relaxed mt-4 mb-4 text-white">
                    Nuestros Diplomados son de tipo seminario, se basan en la participación activa de los alumnos y comunicación con tu catedrático.
                  </p>
                </div> */}

                {/* <div className="w-full md:w-4/12 px-4 mr-auto ml-auto">
                  <div className="relative flex flex-col min-w-0 break-words dark:bg-black bg-white w-full mb-6 shadow-lg rounded-lg bg-red">
                    <img
                      alt="..."
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1051&q=80"
                      className="w-full align-middle rounded-t-lg"
                    />
                    <blockquote className="relative p-8 pt-4 mb-4">
                      <svg
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 583 95"
                        className="absolute left-0 w-full block"
                        style={{
                          height: "95px",
                          top: "-94px"
                        }}
                      >
                        <polygon
                          points="-30,95 583,95 583,65"
                          className="text-red fill-current opacity-80"
                        ></polygon>
                      </svg>
                      <h4 className="text-xl -mx-10 dark:py-5 px-10 font-bold text-red dark:text-white dark:bg-red">
                        Sobre las clases
                      </h4>
                      <p className="text-sm font-light mt-2 text-black dark:text-white">
                        Las clases se dividen en 2 bloques, cada materia en aproximadamente 9 sesiones (una por semana) donde se te entregará toda la información y algunas actividades, tendrás siempre la guía de tu catedrático que estará al pendiente en cualquier duda, debate o análisis crítico que tengas.
                      </p>
                    </blockquote>
                  </div>
                </div> */}
                <div className="w-full px-4 mr-auto ml-auto mt-32">
                  <p className="text-green-300/90 text-sm uppercase tracking-wider mb-2">Contenido del programa</p>
                  <h3 className="text-3xl sm:text-4xl lg:text-6xl mb-2 font-semibold leading-tight text-white">
                    Todo lo que necesitas para ser Guía Montessori
                  </h3>
                  <p className="text-md md:text-xl font-light leading-relaxed mt-4 mb-4 text-white/90 max-w-4xl">
                    Cada materia se trabaja en bloques de unas 9 sesiones (una por semana), con material, actividades y acompañamiento de tu catedrático para resolver dudas y profundizar.
                  </p>
                  <div className="inline-block px-4 py-2 rounded-full bg-white/15 text-white font-semibold text-sm md:text-base mt-2">
                    1. Tronco común
                  </div>
                </div>

              </div>
              <div className="flex flex-wrap lg:pt-12 pt-6">
                <div className="w-1/2 md:w-4/12 px-2">
                  <div className=" relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-xl rounded-lg">
                    <div className="hover:bg-red hover:bg-opacity-10 px-2 md:px-4 lg:px-6 py-5 flex-auto">
                      <h6 className="text-sm md:text-xl font-semibold text-red">FILOSOFÍA MONTESSORI</h6>
                      <p className="text-xs md:text-sm lg:text-base mt-2 mb-4 text-black">
                        Conocerás la historia y principios detrás de la metodología Montessori.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-1/2 md:w-4/12 px-2 ">
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-xl rounded-lg">
                    <div className="hover:bg-blue hover:bg-opacity-10 px-2 md:px-4 lg:px-6 py-5 flex-auto">
                      <h6 className="text-sm md:text-xl font-semibold text-blue">MÉTODOS DE OBSERVACIÓN</h6>
                      <p className="text-xs md:text-sm lg:text-base mt-2 mb-4 text-black">
                        Desarrolla la capacidad de observar y entender las necesidades únicas de cada uno de tus alumnos.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="-mt-5 md:mt-0 w-1/2 md:w-4/12 px-2 ">
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-xl rounded-lg">
                    <div className="hover:bg-orange hover:bg-opacity-10 px-2 md:px-4 lg:px-6 py-5 flex-auto">
                      <h6 className="text-sm md:text-xl font-semibold text-orange">NEURO - EDUCACIÓN</h6>
                      <p className="text-xs md:text-sm lg:text-base mt-2 mb-4 text-black">
                        Descubre cómo se desarrolla el cerebro humano en las primeras etapas de la vida
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-1/2 md:w-4/12 px-2 ">
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-xl rounded-lg">
                    <div className="hover:bg-green hover:bg-opacity-10 px-2 md:px-4 lg:px-6 py-5 flex-auto">
                      <h6 className="text-sm md:text-xl font-semibold text-green">PSICOLOGÍA EDUCATIVA</h6>
                      <p className="text-xs md:text-sm lg:text-base mt-2 mb-4 text-black">
                        Descubre de qué manera integra el alumno su entorno y cómo garantizar un aprendizaje significativo.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="-mt-10 md:mt-0 w-1/2 md:w-4/12 px-2 ">
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-xl rounded-lg">
                    <div className="hover:bg-red hover:bg-opacity-10 px-2 md:px-4 lg:px-6 py-5 flex-auto">
                      <h6 className="text-sm md:text-xl font-semibold text-red">MUSICOTERAPIA</h6>
                      <p className="text-xs md:text-sm lg:text-base mt-2 mb-4 text-black">
                        Conoce la importancia de la música en el aprendizaje con las campanas Montessori.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-1/2 md:w-4/12 px-2 ">
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-xl rounded-lg">
                    <div className="hover:bg-blue hover:bg-opacity-10 px-2 md:px-4 lg:px-6 py-5 flex-auto">
                      <h6 className="text-sm md:text-xl font-semibold text-blue">PSICO-MOTRICIDAD</h6>
                      <p className="text-xs md:text-sm lg:text-base mt-2 mb-4 text-black">
                        Explora cómo el movimiento es fundamental en el desarrollo y aprendizaje.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="-mt-5 lg:mt-0 md:w-2/3 w-1/2 px-2 ">
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-xl rounded-lg">
                    <div className="hover:bg-orange hover:bg-opacity-10 px-2 md:px-4 lg:px-6 py-5 flex-auto">
                      <h6 className="text-sm md:text-xl font-semibold text-orange">EDUCACIÓN INCLUSIVA</h6>
                      <p className="text-xs md:text-sm lg:text-base mt-2 mb-4 text-black">
                        Conoce cómo se prepara el conocimiento, el ambiente y la pedagogía para todo tipo de aprendizajes y necesidades de los niños.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-1/2 md:w-1/3 px-2 ">
                  <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-xl rounded-lg">
                    <div className="hover:bg-green hover:bg-opacity-10 px-2 md:px-4 lg:px-6 py-5 flex-auto">
                      <h6 className="text-sm md:text-xl font-semibold text-green">INTELIGENCIA CREATIVA</h6>
                      <p className="text-xs md:text-sm lg:text-base mt-2 mb-4 text-black">
                        Fomenta la creatividad y el pensamiento innovador en todos tus estudiantes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center ">
                <div className="w-full px-4 mr-auto ml-auto mt-12">
                  <h3 className="text-3xl lg:text-5xl mb-2 font-semibold leading-tight text-white">
                    El método Montessori en la práctica
                  </h3>
                  <p className="text-md md:text-xl font-light leading-relaxed mt-4 mb-4 text-white/90">
                    Aprenderás el material científico de María Montessori y cómo presentarlo según cada etapa de desarrollo.
                  </p>
                  <div className="inline-block px-4 py-2 rounded-full bg-white/15 text-white font-semibold text-sm md:text-base">
                    2. Materiales y presentaciones
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative bg-gradient-to-r from-blue via-purple to-green pb-20 pt-5">
            <div
              className="bottom-auto top-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20"
              style={{ height: "80px" }}
            >
              <svg
                className="absolute bottom-0 overflow-hidden"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                version="1.1"
                viewBox="0 0 2560 100"
                x="0"
                y="0"
              >
                <defs>
                  <linearGradient id="myGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" className="text-blue" style={{ stopColor: "currentColor" }} />
                    <stop offset="100%" className="text-green" style={{ stopColor: "currentColor" }} />
                  </linearGradient>
                </defs>

                <polygon
                  style={{
                    fill: 'url(#myGradient)', // Referencia al gradiente definido en <defs>
                  }}
                  points="2560 0 2560 100 0 100"
                />
              </svg>
            </div>

            <div className="container mx-auto px-4">
              <div className="items-center flex flex-wrap">
                <div className="w-full md:w-4/12 ml-auto mr-auto px-4">
                  <img
                    alt="..."
                    className="max-w-full rounded-lg shadow-lg"
                    src="https://i0.wp.com/montessorifromtheheart.com/wp-content/uploads/2022/05/Lang-math-Bundle-Beads.jpg?resize=1024%2C683&ssl=1"
                  />
                </div>
                <div className="w-full md:w-5/12 ml-auto mr-auto px-4">
                  <div className="md:pr-12">
                    <div className="hidden md:block text-red p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-blue">
                      {/* svg of class online */}

                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                      </svg>


                    </div>
                    <p className="text-green-300/90 text-sm uppercase tracking-wider mb-2">Modalidad</p>
                    <h3 className="pt-4 text-3xl font-semibold text-white">
                      Clases accesibles y flexibles
                    </h3>
                    <p className="mt-4 text-lg leading-relaxed text-white/90">
                      Estudia a tu ritmo con contenido nuevo cada semana y acompañamiento constante:
                    </p>
                    <ul className="list-none mt-6 space-y-4 text-white">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        <div>
                          <strong className="text-white block">Publicación semanal</strong>
                          <span className="text-white/90">Cada sábado a las 8:00 se publica una clase nueva.</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </span>
                        <div>
                          <strong className="text-white block">Actividades a tu ritmo</strong>
                          <span className="text-white/90">Entrega cuando quieras mientras la materia esté activa (aprox. dos meses por materia).</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        </span>
                        <div>
                          <strong className="text-white block">Acceso 24/7</strong>
                          <span className="text-white/90">Revisa las clases cuando y donde quieras.</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </span>
                        <div>
                          <strong className="text-white block">Guía personalizada</strong>
                          <span className="text-white/90">Solicita videollamada con tu profesor cuando lo necesites.</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </span>
                        <div>
                          <strong className="text-white block">Masterclass en vivo</strong>
                          <span className="text-white/90">Cada 15 días, sábados 10:00 — en vivo o en grabación.</span>
                        </div>
                      </li>
                    </ul>
                    <a href="#certificacion_internacional" className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 rounded-full bg-white/20 text-white font-medium hover:bg-white hover:text-blue transition-all duration-300 text-sm">
                      Ver programas y precios
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="" className="relative bg-gradient-to-r from-blue to-green pb-20 pt-6">
            <div className="container mx-auto px-4 text-center mb-8">
              <p className="text-green-300/90 text-sm uppercase tracking-wider mb-2">Programas y precios</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
                Elige tu programa y da el siguiente paso
              </h2>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                Certificación internacional, modalidad en línea y acompañamiento de guías certificadas.
              </p>
            </div>
            <CertificationPrice />
          </section>

          <section className="relative block bg-blue">
            <div
              className="bottom-auto top-[1px] left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20"
              style={{ height: "80px" }}
            >
              <svg
                className="absolute bottom-0 overflow-hidden"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                version="1.1"
                viewBox="0 0 2560 100"
                x="0"
                y="0"
              >
                <polygon
                  className="text-blue fill-current"
                  points="2560 0 2560 100 0 100"
                ></polygon>
              </svg>
            </div>

            <div className="container mx-auto px-4 lg:pt-24 lg:pb-32">
              <div className="flex flex-wrap text-center justify-center text-white">
                <div className="w-full lg:w-6/12 px-4">
                  <p className="text-green-300/90 text-sm uppercase tracking-wider mb-2">Inscripción</p>
                  <h2 className="text-4xl font-semibold text-white">
                    3 pasos para empezar
                  </h2>
                  {proximoInicio && (
                    <p className="text-lg font-medium text-white mt-4">
                      Próximo inicio: <span className="text-green-300">{proximoInicio}</span>
                    </p>
                  )}
                  <p className="text-md leading-relaxed mt-3 mb-4 text-white/80">
                    Completa el formulario de inscripción y luego solo necesitas:
                  </p>
                  <a
                    href={FORM_INSCRIPCION}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-full bg-white text-blue font-semibold hover:bg-green hover:text-white transition-all duration-300"
                  >
                    Inscribirme — Formulario de inscripción
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap mt-12 justify-center">
                <div className="w-full lg:w-3/12 px-4 text-center">
                  <div className="text-red p-3 w-12 h-12 shadow-lg rounded-full bg-white inline-flex items-center justify-center">
                    1
                  </div>
                  <h6 className="text-xl mt-5 font-semibold text-white">
                    Inscripción
                  </h6>
                  <p className="mt-2 mb-4 text-white/90 text-sm">
                    📄 Hoja de inscripción y formas de pago en el mismo formulario:
                    <a className="text-green-300 hover:underline block mt-1" href={FORM_INSCRIPCION} target="_blank" rel="noopener noreferrer">Abrir formulario de inscripción</a>
                  </p>
                </div>
                <div className="w-full lg:w-3/12 px-4 text-center">
                  <div className="text-red p-3 w-12 h-12 shadow-lg rounded-full bg-white inline-flex items-center justify-center">
                    2
                  </div>
                  <h5 className="text-xl mt-5 font-semibold text-white">
                    👨‍🎓 Documentos Personales
                  </h5>
                  <p className="mt-2 text-sm mb-4 text-white/90">
                    Para tu certificado con validez internacional:
                    <span className="pt-3 block text-white">📍 Comprobante de domicilio</span>
                    <span className="block text-white">🪪 Identificación oficial</span>
                    <span className="block text-white">👶 Acta de nacimiento</span>
                    <span className="block text-white">👨‍🎓 Último certificado de estudios</span>
                    <span className="text-xs block mt-3 text-white/70">
                      No hay requisito de nivel educativo para cursar; algunas escuelas exigen licenciatura para estar frente a grupo — depende de cada institución.
                    </span>
                  </p>
                </div>
                <div className="w-full lg:w-3/12 px-4 text-center">
                  <div className="text-red p-3 w-12 h-12 shadow-lg rounded-full bg-white inline-flex items-center justify-center">
                    3
                  </div>
                  <h5 className="text-xl mt-5 font-semibold text-white">
                    📜 Reglamento firmado
                  </h5>
                  <p className="mt-2 mb-4 text-white/90 text-sm">
                    Nos comprometemos a una educación de <span className="text-white font-medium">calidad</span> en un ambiente de <span className="text-white font-medium">respeto</span>. Conoce y firma nuestro reglamento para iniciar tu diplomado.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section id="" className="relative bg-white p-10 ">
            <Scholarship />
          </section>
        </main>

      </Layout>
    </>
  );
}