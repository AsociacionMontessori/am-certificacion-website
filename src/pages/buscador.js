import '../styles/global.css'
import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import InputSearch from '../components/buttons/InputSearch'
import React, { useEffect, useState } from 'react';
import { csv } from 'd3-fetch';
import { StaticImage } from 'gatsby-plugin-image';


const Buscador = () => {
    const [activeData, setActiveData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState([]);

    const estados = [
        {
            id: 1,
            estado: "Toluca",
            nombreEstado: "Toluca"
        },
        { id: 2, estado: "Azc", nombreEstado: "Azcapotzalco" },
        { id: 3, estado: "MH", nombreEstado: "Miguel Hidalgo" },
        { id: 4, estado: "VC", nombreEstado: "Venustiano Carranza" }
    ];

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const changeActive = async (param) => {
        setLoading(true);
        // wait for 1/2 second
        await wait(500); // Espera 500 milisegundos (medio segundo)



        try {
            if (param === "Toluca") {
                console.log('Fetching data...');
                const ruta = '/Toluca.csv';
                const result = await csv(ruta); // La ruta es relativa a la raíz del sitio
                console.log('ruta', ruta);
                console.log('Data fetched:', result);
                setData(result);
                setActiveData(result)
            } else if (param === "Azc") {
                console.log('Fetching data...');
                const ruta = '/Azcapotzalco.csv';
                const result = await csv(ruta); // La ruta es relativa a la raíz del sitio
                console.log('ruta', ruta);
                console.log('Data fetched:', result);
                setData(result);
                setActiveData(result)
            } else if (param === "MH") {
                console.log('Fetching data...');
                const ruta = '/Miguel Hidalgo.csv';
                const result = await csv(ruta); // La ruta es relativa a la raíz del sitio
                console.log('ruta', ruta);
                console.log('Data fetched:', result);
                setData(result);
                setActiveData(result)
            } else if (param === "VC") {
                console.log('Fetching data...');
                const ruta = '/Venustiano Carranza.csv';
                const result = await csv(ruta); // La ruta es relativa a la raíz del sitio
                console.log('ruta', ruta);
                console.log('Data fetched:', result);
                setData(result);
                setActiveData(result)
            }
        } catch (error) {

        } finally {
            setLoading(false);
        }

    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching data...');
                const ruta = '/Toluca.csv';
                const result = await csv(ruta); // La ruta es relativa a la raíz del sitio
                console.log('ruta', ruta);
                console.log('Data fetched:', result);
                setData(result);
                setActiveData(result)
            } catch (error) {
                console.error('Error fetching the CSV file:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <Layout>

            <Nav textColor="text-white" />
            <main>
                <div className="max-w-screen-xl px-10 md:px-20 pb-8 mx-auto my-0 md:my-20">
                    <div className="text-white max-w-auto mx-auto mt-20 mb-10">
                        <h2 className="text-2xl md:text-4xl xl:text-5xl font-bold ">
                            Buscador de Escuelas Montessori
                        </h2>
                        <p className="text-lg md:text-xl pt-3">
                            Encuentra la escuela Montessori más cercana a ti.
                        </p>
                        <div className='py-4'>
                            <div className='relative group justify-left self-start'>
                                {/* <input
                                    className="text-left mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-blue hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10 w-1/3 placeholder-teal-100"
                                    placeholder='Buscar Escuela Montessori' /> */}

                                <InputSearch
                                
                                    
                                    searchDataAutomcomplete={[
                                        ...estados.map((estado) => ({
                                            key: estado.id,
                                            value: estado.nombreEstado,
                                        }))
                                    ]}

                                />
                                {/* <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                    <StaticImage className='w-6 h-6' src="../images/elements/decor2.png" alt="decoration" placeholder='none' />
                                </div> */}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            <button onClick={() => changeActive("Toluca")} className="group mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-blue hover:bg-opacity-70 rounded-full px-10 mr-4 bg-green text-white bg-opacity-10 w-full md:w-auto">
                                Toluca
                                <div className="inline opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                    <StaticImage className='w-6 h-6' src="../images/elements/decor2.png" alt="decoration" />
                                </div>
                            </button>
                            <button onClick={() => changeActive("Azc")} className="group mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-blue hover:bg-opacity-70 rounded-full px-10 bg-green text-white bg-opacity-10 w-full md:w-auto">
                                Azcapotzalco
                                <div className="inline opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                    <StaticImage className='w-6 h-6' src="../images/elements/decor2.png" alt="decoration" />
                                </div>
                            </button>
                            <button onClick={() => changeActive("MH")} className="group mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-blue hover:bg-opacity-70 rounded-full px-10 bg-green text-white bg-opacity-10 w-full md:w-auto">
                                Miguel Hidalgo
                                <div className="inline opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                    <StaticImage className='w-6 h-6' src="../images/elements/decor2.png" alt="decoration" />
                                </div>
                            </button>
                            <button onClick={() => changeActive("VC")} className="group mt-3 sm:mt-0 btn btn-outline hover:text-white hover:bg-blue bg-gradient-to-r from-blue/50 hover:from-blue hover:bg-opacity-70 rounded-full px-10 bg-green text-white bg-opacity-10 w-full md:w-auto">
                                Venustiano Carranza
                                <div className="inline opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                    <StaticImage className='w-6 h-6' src="../images/elements/decor2.png" alt="decoration" />
                                </div>
                            </button>
                        </div>


                    </div>


                    <div class="flex flex-wrap gap-4 justify-center pt-20">
                        {
                            !loading && (
                                <a href="https://kalpilli.com" target="_blank" aria-label="Kalpilli Montessori"
                                    class="bg-white bg-opacity-20 flex flex-col gap-2 h-60 text-white rounded-xl shadow-md p-6 max-w-[340px] bg-gray-200 backdrop-filter backdrop-blur-lg border-2 border-white">
                                    <div class="font-semibold text-lg">Kalpilli Montessori</div>
                                    <div class="font-semibold text-md tracking-tight">Avenida Dos, N.º 48, Col. San Pedro de los Pinos, en la alcaldía Benito Juárez, en la Ciudad de México</div>
                                    <div class="pt-10 font-normal">CERTIFICACIÓN AMMAC</div>
                                </a>
                            )
                        }
                        {activeData.map((item, index) => (
                            <div key={index}
                                class="flex flex-col gap-2 h-60 text-white rounded-xl shadow-md p-6 max-w-[340px] bg-gray-200 bg-opacity-30 backdrop-filter backdrop-blur-lg ">
                                <div class="font-semibold text-lg">{item.name}</div>
                                <div class="text-md font-light">{item.address}</div>
                                {
                                    item.phone != "campo no disponible" && <div class="font-normal">Teléfono: {item.phone}</div>
                                }
                            </div>

                        ))}
                    </div>

                </div>
            </main>
        </Layout>
    )


}

export const Head = () => <Seo title="Aviso de Privacidad" description="Asociación Montessori." />

export default Buscador