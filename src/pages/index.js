import * as React from 'react';
import { useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import '../styles/global.css';
import { redirectStripeCheckoutReturn } from '../utils/stripeCheckoutReturn';
import { getT } from '../i18n';
import Layout from '../components/layout';
import Seo from '../components/seo';
import ImgMap from '../images/banners/map.png';
import ImgMapDark from '../images/banners/dark_map.png';
import { StaticImage } from 'gatsby-plugin-image';
import Timeline from '../components/timeline/timeline';
import MarcoPedagogico from '../components/marcoPedagogico';
import Nav from '../components/nav';
import HomeMarketingHero from '../components/home/HomeMarketingHero';

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

const IndexPage = ({ location }) => {
  const { t } = useTranslation('home');

  useEffect(() => {
    redirectStripeCheckoutReturn(location)
  }, [location?.search])

  // 3 frases únicas en el JSON; se reconstruye la repetición del marquee
  // (mismo texto visible que antes: 15 y 14 elementos respectivamente).
  const marqueeFrases = t('marquee.frases', { returnObjects: true });
  const phrases = Array.from({ length: 5 }, () => marqueeFrases).flat();
  const frasesRotadas = [...marqueeFrases.slice(1), marqueeFrases[0]];
  const phrases2 = Array.from({ length: 5 }, () => frasesRotadas)
    .flat()
    .slice(0, 14);

  return (
    <Layout>
      <Nav textColor="text-white" />
      <main>
        <HomeMarketingHero />
        <section id="work" className="relative py-5 z-10 bg-white dark:bg-gray lg:pt-0">
          <div className="mx-auto max-w-7xl px-6 lg:px-12 xl:px-6 2xl:px-0 pt-10">
            <div data-rellax-speed="-3" data-rellax-xs-speed="0" data-rellax-mobile-speed="0" className="rellax flex flex-wrap items-center gap-6 selection:text-white selection:bg-red selection:bg-opacity-20">
              <h2 className="pt-5 text-red font-bold dark:text-white sm:text-4xl md:text-5xl xl:text-6xl">{t('educacion.titulo')}</h2>
              <p className="text-base text-black dark:text-white md:text-2xl">
                <Trans
                  i18nKey="educacion.p1"
                  ns="home"
                  components={{ destacado: <span className="text-blue underline dark:text-white underline-offset-4 dark:selection:bg-red selection:bg-blue dark:decoration-red" /> }}
                />
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
                  <img src={ImgMapDark} className="w-full h-3/12 dark:hidden" alt={t('mapa.alt')} />
                  <img src={ImgMap} className="w-full h-3/12 hidden dark:block" alt={t('mapa.altOscuro')} />
                  <div className="flex justify-center absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                    <h2 className="text-white text-center">
                      <span className="font-extrabold text-center text-sm sm:text-base md:text-2xl xl:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-slate-200/60 to-50% to-slate-200">{t('certificacionInternacional.encabezado')}</span><br />
                      <span className="font-bold text-center text-2xl sm:text-3xl md:text-4xl xl:text-6xl drop-shadow-2xl">{t('certificacionInternacional.titulo')}</span>
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
                      {t('certificacionInternacional.reconocimiento')}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <Timeline />
        </section>
        <MarcoPedagogico />
      </main>
    </Layout>
  )
}

export const Head = ({ location }) => {
  const t = getT(location.pathname, 'home')
  return (
    <Seo
      title={t('seo.title')}
      pathname={location.pathname}
      description={t('seo.description')}
    />
  )
}
export default IndexPage
