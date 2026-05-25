import React from 'react';
import Layout from '../components/layout';
import Seo from '../components/seo';
import CertificationPrice from '../components/certificationPrice';
import Nav from '../components/nav';

const certificateSchema = [
  {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name: "Certificación internacional como Guía Montessori",
    description: "Programas de certificación y diplomados para formarte como Guía Montessori con validez internacional.",
    educationalProgramMode: "online",
    occupationalCategory: "Guía Montessori",
    provider: {
      "@type": "EducationalOrganization",
      name: "Asociación Montessori de México A.C.",
      url: "https://certificacionmontessori.com/",
    },
    url: "https://certificacionmontessori.com/certificate/",
  },
]

const Certificate = () => (
  <Layout>
    <Nav textColor="text-white" transparent />
    <main className="overflow-x-hidden selection:text-white selection:bg-green selection:bg-opacity-20">
      <section className="relative z-10 bg-gradient-to-r from-blue to-green pb-20 pt-20 sm:pt-24">
        <CertificationPrice />
      </section>
    </main>
  </Layout>
)

export const Head = () => (
  <Seo
    title="Certifícate"
    pathname="/certificate/"
    description="Conviértete en Guía Montessori con certificación internacional y conoce la oferta formativa pública de la Asociación Montessori de México A.C."
    schema={certificateSchema}
  />
)

export default Certificate
