import React from 'react';
import Layout from '../components/layout';
import Seo from '../components/seo';
import imagen from '../images/banners/cert.png';
import CertificationPrice from '../components/certificationPrice';
import Scholarship from '../components/scholarship';
import Nav from '../components/nav';
import NextCourse from '../components/nextCourse';

const nextCourseProps = {
  URLiframe: 'https://montessorimexico.org/proxima-certificacion/',
  URLButton: '#certificacion_internacional',
};

const Certificate = () => {
  return (
    <Layout>
      <Nav textColor="text-white" />
      <main className="overflow-x-hidden selection:text-white selection:bg-green selection:bg-opacity-20">
        <section id="home" className="relative flex min-h-screen items-center">
          <div aria-hidden="true" className="absolute inset-0 z-[1] bg-gradient-to-b from-white/0 via-gray/20 to-gray"></div>
          <img src={imagen} className="fixed inset-0 h-full w-full object-cover" alt="woman in dark" width="4160" height="6240" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-40 pt-10 md:pt-20 lg:px-12 xl:px-6 2xl:px-0">
            <div className="pb-6 media-h:md:pb-32 media-h:lg:pb-6 xl:pb-6">
              <h1 data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" className="rellax text-5xl font-bold text-white sm:text-7xl md:text-8xl xl:leading-tight" >
                Certifícate como <br className="hidden sm:block" /> Guía Montessori
              </h1>
            </div>
            <div>
              <div className="mr-auto md:w-3/5 md:pt-2 lg:w-2/3">
                <p className="mb-5 text-lg font-light text-white sm:text-2xl xl:leading-normal">
                  Descubre Nuestros programas de certificación con validez internacional, conoce el método Montessori y aprende a implementarlo en tu salón de clases.
                </p>
                <NextCourse {...nextCourseProps} />
              </div>
            </div>
          </div>
        </section>
        <section id="" className="relative z-10 bg-gradient-to-r from-blue to-green pb-20">
          <CertificationPrice />
          <Scholarship />
        </section>

      </main>
    </Layout>
  )
}
export const Head = () => <Seo title="Certifícate" description="Conviertete en guía Montessori" />
export default Certificate
