import React, { useState, useEffect } from "react"


import Card from './cards/card'
import CardInscription from './cards/inscriptionCard'
import CardCertification from './cards/cardCertification'
import axios from 'axios'

const CertificationPrice = () => {
    const [state, setState] = useState({
        ip: "",
        countryName: "",
        city: "",
      })
    
      const getLocalizedPrice = (state, priceData) => {
        const { countryName } = state;
        const coin = countryName === 'Mexico' ? 'MXN' : 'USD';
        const priceToShow = countryName === 'Mexico' ? priceData.priceMx : priceData.priceUsd;
        return { coin, priceToShow };
      };
    
      const getGeoInfo = () => {
        axios
          .get("https://ipapi.co/json/")
          .then((response) => {
            let data = response.data
            setState({
              ...state,
              ip: data.ip,
              countryName: data.country_name,
              city: data.city,
            })
          })
          .catch((error) => {
            console.log(error);
          })
      }
    
      useEffect(() => {
        getGeoInfo();
      }, [])
    
      const certificado = [
        { title: 'Certificado', subtitle: 'único pago', priceMx: '2,500', priceUsd: '200', text: 'Único pago de ', footer: "+  gasto de envío fuera de México" }
      ]
    
      const prices = [
        { title: 'Nido', subtitle: 'y comunidad infantil', priceMx: '3,800', priceUsd: '210', text: 'Nido y Comunidad infantil', duration: '16 meses' },
        { title: 'Casa de Niños', subtitle: 'certifícate como guía montessori', priceMx: '4,000', priceUsd: '230', text: 'Casa de niños', duration: '17 meses' },
        { title: 'Taller', subtitle: 'único pago', priceMx: '4,500', priceUsd: '250', text: 'Taller I y II', duration: '20 meses' },
      ]
    
      const inscripcion = [
        { title: 'Inscripción', subtitle: 'único pago', priceMx: '5,000', priceUsd: '299', text: 'Único pago de' },
      ]
    return (
        <>
            <section id="certificacion_internacional" class=" bg-gradient-to-r from-blue to-green">
                <h2 className="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0">
                    <span className="text-white text-2xl md:text-6xl font-bold">Certificación Montessori</span>
                </h2>
                <div className="bg-white rounded-3xl">
                    <div className="flex mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0 ">
                        <div className="md:2/4 w-3/4 absolute md:relative md:block flex sm:flex-col ">
                            <h3>
                                <span className="text-red md:text-2xl text-xl">
                                    Certificación internacional
                                </span>
                            </h3>
                            <h2 className="mt-5">
                                <span className="font-medium text-black md:text-6xl text-3xl">
                                    Guía Montessori
                                </span>
                            </h2>
                            <div className="w-auto pt-10 pr-24 text-lg text-black">
                                <p>
                                    Ofrecemos programas de certificación con reconocimiento internacional, diseñados para proporcionar una sólida base en el método y la filosofía Montessori.
                                    <br />
                                    <br />
                                    Ya sea que busques una introducción a Montessori o desees profundizar tu conocimiento y práctica, tenemos el programa adecuado para ti.
                                    <br />
                                    <br />
                                    <br />
                                    <span className="text-gray text-sm">Aplican términos y condiciones *</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center bg-white pb-10 flex flex-end rounded-3xl absolute left-1/2 translate-x-52 lg:translate-x-52 xl:translate-x-80 transform 2xl:translate-x-96 md:translate-y-[-5rem] lg:translate-y-[-4rem] md:h-[36rem] lg:h-[32rem] ">

                            {inscripcion.map((price) => {
                                const { title, subtitle, text } = price;
                                const { coin, priceToShow } = getLocalizedPrice(state, price);
                                return (
                                    <CardInscription
                                        title={title}
                                        subtitle={subtitle}
                                        coin={coin}
                                        price={priceToShow}
                                        text={text} />
                                )
                            })}
                        </div>
                    </div>
                </div>


                <section id="prices" className="mt-24 mb-10">

                    <div className="flex space-x-32 justify-center">

                        {certificado.map((price) => {
                            const { title, subtitle, text, duration, footer } = price;
                            const { coin, priceToShow } = getLocalizedPrice(state, price);
                            return (
                                <CardCertification title={title}
                                    subtitle={subtitle}
                                    coin={coin}
                                    price={priceToShow}
                                    text={text}
                                    time={duration}
                                    footer={footer} />
                            )
                        })}

                        {prices.map((price) => {
                            const { title, subtitle, text, duration } = price;
                            const { coin, priceToShow } = getLocalizedPrice(state, price);
                            return (
                                <Card
                                    title={title}
                                    subtitle={subtitle}
                                    coin={coin}
                                    price={priceToShow}
                                    text={text}
                                    time={duration}
                                />
                            )
                        })}
                    </div>

                    <div>

                    </div>
                    <p className="mx-auto max-w-7xl px-6 pb-10 pt-10 lg:px-12 xl:px-6 2xl:px-0 text-white text-sm">
                        Precios sujetos a disponibilidad. Aplican Términos y Condiciones.
                    </p>
                </section>
            </section>
        </>
    )
}

export default CertificationPrice




