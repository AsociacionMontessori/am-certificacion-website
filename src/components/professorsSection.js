import React, { useState, useEffect } from "react";
import { StaticImage } from "gatsby-plugin-image";

/* Fragmentos con negritas — usamos JSX inline para <strong> */
const PROFESSORS = [
  {
    id: "roxana-munoz",
    name: "Roxana Muñoz",
    badge: "Acompañamiento institucional y académico",
    description: [
      <>Roxana Muñoz es una figura de gran relevancia dentro del ámbito Montessori y una de las principales guías del acompañamiento institucional y académico en este diplomado. Con <strong>más de 30 años de experiencia</strong> como Guía Montessori, aporta una formación profunda, una amplia trayectoria y un compromiso genuino con el desarrollo integral de la infancia.</>,
      <>Su trabajo se distingue por una convicción esencial: <strong>la educación con amor</strong> es clave para ayudar a cada niño a desarrollar su potencial. Además de su experiencia educativa, es <strong>presidenta de la Asociación Montessori de México A.C.</strong> y cofundadora de la <strong>Sociedad de Escuelas Montessori S.C.</strong>, fortaleciendo el diálogo entre educadores, familias e instituciones.</>,
      <>También es <strong>autora de libros y artículos</strong> sobre la Pedagogía Científica de María Montessori, y comparte su experiencia en conferencias, talleres y seminarios para docentes y familias. Su acompañamiento dentro del diplomado aporta dirección, profundidad y una mirada fiel a la filosofía Montessori.</>,
    ],
  },
  {
    id: "ivan-lopez-carmona",
    name: "Iván López Carmona",
    badge: "Formación inclusiva y práctica docente",
    description: [
      <>Iván forma parte del equipo de profesores de este diplomado. Es <strong>Licenciado en Intervención Educativa</strong> con línea inclusiva por la Universidad Pedagógica Nacional, <strong>Licenciado en Artes</strong> por el IDMA y <strong>Maestro en Ciencias de la Educación</strong> por el Instituto de Estudios Universitarios.</>,
      <>Cuenta con <strong>15 años de experiencia</strong> en el ámbito educativo y una trayectoria sólida dentro de la filosofía Montessori. Está certificado como <strong>Guía Montessori de Casa de Niños, Taller I y II, Nido y Comunidad Infantil</strong> por la Asociación Montessori de México.</>,
      <>Actualmente es <strong>catedrático presencial de la Asociación Montessori de México</strong> en la sede Acapulco, formando Guías de Casa de Niños y Taller. También <strong>coordina el departamento montessoriano en ECNH</strong> y desarrolla talleres para docentes en escuelas públicas y particulares.</>,
    ],
  },
  {
    id: "carlos-romero",
    name: "Carlos Romero",
    badge: "Gestión académica y tecnología educativa",
    description: [
      <>Carlos forma parte del equipo que acompaña la organización, el seguimiento y el desarrollo de los diplomados. Su relación con Montessori también es vivencial: <strong>toda su formación, desde Nido, fue Montessori</strong>, por lo que conoce el método desde la experiencia directa.</>,
      <>Es <strong>Licenciado en Economía y en Contaduría Pública</strong>, además de programador. Esta combinación le permite integrar administración, análisis, tecnología y organización académica al servicio de la formación Montessori. También cuenta con <strong>estudios de maestría en Música</strong>, con enfoque en piano y composición.</>,
      <>Dentro del diplomado, aporta <strong>estructura, claridad y soluciones prácticas</strong> para fortalecer la experiencia de las alumnas, uniendo Montessori, gestión educativa, pensamiento analítico y herramientas tecnológicas con un compromiso genuino con la educación.</>,
    ],
  },
];

/* Breakpoint lg de Tailwind = 1024px */
const LG_BREAKPOINT = 1024;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= LG_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
}

/* StaticImage requiere rutas literales (no variables), así que mapeamos cada
   profesor a su imagen con un componente auxiliar. Si la foto aún no existe,
   se muestra un placeholder con las iniciales. */
function ProfessorPhoto({ id, name }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  const photoClasses =
    "w-full h-full object-cover object-center rounded-t-2xl transition-transform duration-500 ease-out group-hover:scale-105";

  switch (id) {
    case "roxana-munoz":
      return (
        <StaticImage
          src="../images/professors/roxana-munoz.webp"
          alt={name}
          placeholder="blurred"
          className={photoClasses}
          imgClassName="rounded-t-2xl"
        />
      );
    case "ivan-lopez-carmona":
      return (
        <StaticImage
          src="../images/professors/ivan-lopez-carmona.webp"
          alt={name}
          placeholder="blurred"
          className={photoClasses}
          imgClassName="rounded-t-2xl"
        />
      );
    case "carlos-romero":
      return (
        <StaticImage
          src="../images/professors/carlos-romero.webp"
          alt={name}
          placeholder="blurred"
          className={photoClasses}
          imgClassName="rounded-t-2xl"
        />
      );
    default:
      return (
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-br from-blue/30 to-green/30 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-105">
          <span className="text-4xl font-bold text-white/80">{initials}</span>
        </div>
      );
  }
}

/* Tarjeta individual con desplegable */
function ProfessorCard({ professor, expanded, onToggle }) {
  return (
    <article className="group h-full rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-white/70 overflow-hidden flex flex-col">
      {/* Foto con zoom al hover */}
      <div className="w-full aspect-[4/3] overflow-hidden">
        <ProfessorPhoto id={professor.id} name={professor.name} />
      </div>

      {/* Info */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <p className="inline-flex self-start rounded-full bg-blue/10 text-blue text-xs font-semibold px-3 py-1">
          {professor.badge}
        </p>
        <h3 className="text-xl sm:text-2xl font-semibold text-blue mt-3">
          {professor.name}
        </h3>

        {/* Primer párrafo siempre visible */}
        <div className="mt-4">
          <p className="text-sm sm:text-base text-black/85 leading-relaxed">
            {professor.description[0]}
          </p>
        </div>

        {/* Resto desplegable */}
        {professor.description.length > 1 && (
          <>
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: expanded ? "600px" : "0px",
                opacity: expanded ? 1 : 0,
              }}
            >
              <div className="mt-3 space-y-3">
                {professor.description.slice(1).map((paragraph, i) => (
                  <p
                    key={`${professor.id}-${i + 1}`}
                    className="text-sm sm:text-base text-black/85 leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <button
              onClick={onToggle}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:text-blue/70 transition-colors self-start cursor-pointer"
            >
              {expanded ? "Leer menos" : "Leer más"}
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function ProfessorsSection() {
  const isDesktop = useIsDesktop();

  /* En desktop: un solo estado global; en móvil: estado por tarjeta */
  const [globalExpanded, setGlobalExpanded] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState({});

  const isExpanded = (id) =>
    isDesktop ? globalExpanded : !!mobileExpanded[id];

  const handleToggle = (id) => {
    if (isDesktop) {
      setGlobalExpanded((prev) => !prev);
    } else {
      setMobileExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  return (
    <section
      id="profesores"
      className="relative overflow-hidden bg-gradient-to-r from-blue via-purple to-green py-16 sm:py-20"
    >
      <div className="container mx-auto w-full max-w-full px-4">
        <div className="max-w-4xl">
          <p className="text-green-300/90 text-sm uppercase tracking-wider mb-2">
            Equipo docente
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Conoce a quienes te acompañarán en tu certificación
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/90">
            En este diplomado estarás acompañada por personas con experiencia,
            formación y compromiso con la filosofía Montessori. Queremos que
            conozcas un poco más a quienes estarán contigo a lo largo de este
            proceso.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {PROFESSORS.map((professor) => (
            <ProfessorCard
              key={professor.id}
              professor={professor}
              expanded={isExpanded(professor.id)}
              onToggle={() => handleToggle(professor.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
