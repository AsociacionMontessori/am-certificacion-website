import React from "react";
import { useTranslation, Trans } from "react-i18next";

/* Marco de objetivos de aprendizaje AMMAC.
   Fuente de verdad del contenido (dominios + niveles de Bloom):
   Diplomados/Nuevo 2026/Guias_Catedratico/data/marco_competencias.py
   Aquí solo se presenta de cara al público el marco pedagógico.
   Los textos viven en src/i18n/locales/<idioma>/home.json bajo `marco.*`. */

/* 7 dominios de competencia AMMAC — espejo de los dominios internacionales
   de la formación Montessori (MACTE / AMI). */
const DOMINIOS = [
  { code: "D1", key: "fundamentos" },
  { code: "D2", key: "desarrollo" },
  { code: "D3", key: "ambiente" },
  { code: "D4", key: "observacion" },
  { code: "D5", key: "adulto" },
  { code: "D6", key: "curriculo" },
  { code: "D7", key: "comunidad" },
];

/* 6 niveles cognitivos de la Taxonomía de Bloom (revisada). */
const BLOOM = [
  "recordar",
  "comprender",
  "aplicar",
  "analizar",
  "evaluar",
  "crear",
];

/* Clases literales por acento (Tailwind necesita nombres completos). */
const ACCENTS = {
  blue: {
    bar: "bg-blue",
    chip: "bg-blue/10 text-blue",
    ring: "border-blue/20 dark:border-blue/40",
  },
  red: {
    bar: "bg-red",
    chip: "bg-red/10 text-red",
    ring: "border-red/20 dark:border-red/40",
  },
};

function DominioCard({ dominio, accent }) {
  const a = ACCENTS[accent];
  return (
    <article
      className={`group relative h-full overflow-hidden rounded-2xl bg-white/95 dark:bg-black/40 backdrop-blur-sm shadow-xl border ${a.ring} flex flex-col`}
    >
      <span className={`absolute inset-x-0 top-0 h-1.5 ${a.bar}`} aria-hidden="true" />
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <span
          className={`inline-flex self-start items-center justify-center rounded-full ${a.chip} text-sm font-bold px-3 py-1`}
        >
          {dominio.code}
        </span>
        <h3 className="text-lg sm:text-xl font-semibold text-blue dark:text-white mt-3">
          {dominio.title}
        </h3>
        <p className="mt-3 text-sm sm:text-base text-black/85 dark:text-white/80 leading-relaxed">
          {dominio.desc}
        </p>
      </div>
    </article>
  );
}

export default function MarcoPedagogico() {
  const { t } = useTranslation("home");

  const dominios = DOMINIOS.map((d) => ({
    ...d,
    title: t(`marco.dominios.${d.key}.nombre`),
    desc: t(`marco.dominios.${d.key}.descripcion`),
  }));

  const bloom = BLOOM.map((key) => ({
    nivel: t(`marco.bloom.${key}.nombre`),
    desc: t(`marco.bloom.${key}.descripcion`),
  }));

  return (
    <section
      id="marco-pedagogico"
      className="relative overflow-hidden bg-white dark:bg-gray py-16 sm:py-24"
    >
      <div className="container mx-auto w-full max-w-7xl px-6 lg:px-12">
        {/* Encabezado */}
        <div className="max-w-4xl">
          <p className="text-blue dark:text-green text-sm uppercase tracking-wider mb-2 font-semibold">
            {t("marco.eyebrow")}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-red dark:text-white">
            {t("marco.titulo")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-black/85 dark:text-white/90">
            <Trans
              i18nKey="marco.intro"
              ns="home"
              components={{ destacado: <strong className="text-blue dark:text-green" /> }}
            />
          </p>
        </div>

        {/* 7 dominios */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {dominios.map((dominio, i) => (
            <DominioCard
              key={dominio.code}
              dominio={dominio}
              accent={i % 2 === 0 ? "blue" : "red"}
            />
          ))}
        </div>

        {/* 6 niveles de Bloom */}
        <div className="mt-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-blue dark:text-white">
            {t("marco.bloomTitulo")}
          </h3>
          <p className="mt-2 text-base sm:text-lg text-black/70 dark:text-white/70">
            {t("marco.bloomDescripcion")}
          </p>
          <ol className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {bloom.map((b, i) => (
              <li
                key={b.nivel}
                className="relative rounded-2xl border border-blue/15 dark:border-white/15 bg-blue/5 dark:bg-white/5 p-4 flex flex-col"
              >
                <span className="text-2xl font-bold text-red dark:text-green">
                  {i + 1}
                </span>
                <span className="mt-1 text-base font-semibold text-blue dark:text-white">
                  {b.nivel}
                </span>
                <span className="mt-1 text-xs sm:text-sm text-black/70 dark:text-white/70 leading-snug">
                  {b.desc}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Codificación Dominio·Nivel */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-blue via-purple to-green p-[2px]">
          <div className="rounded-[calc(1.5rem-2px)] bg-white dark:bg-gray px-6 py-8 sm:px-10 sm:py-10">
            <p className="text-base sm:text-lg lg:text-xl text-black/90 dark:text-white/90 leading-relaxed">
              <Trans
                i18nKey="marco.codificacion"
                ns="home"
                components={{
                  fuerte: <strong className="whitespace-nowrap text-red dark:text-green" />,
                  codigo: <span className="whitespace-nowrap font-mono font-semibold text-blue dark:text-white" />,
                }}
              />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
