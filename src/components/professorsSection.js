import React, { useState, useEffect } from "react";
import { StaticImage } from "gatsby-plugin-image";
import { useTranslation, Trans } from "react-i18next";

/* Nombres propios: no se extraen a i18n. Badges y párrafos (con <fuerte> para
   negritas) viven en el namespace "diplomados" bajo profesores.items.<clave>. */
const PROFESSORS = [
  {
    id: "roxana-munoz",
    name: "Roxana Muñoz",
    i18nKey: "roxanaMunoz",
    numParagraphs: 3,
  },
  {
    id: "ivan-lopez-carmona",
    name: "Iván López Carmona",
    i18nKey: "ivanLopezCarmona",
    numParagraphs: 3,
  },
  {
    id: "carlos-romero",
    name: "Carlos Romero",
    i18nKey: "carlosRomero",
    numParagraphs: 3,
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

  const photoWrapperClasses = "w-full h-full";
  const photoImageClasses =
    "rounded-t-2xl transition-transform duration-500 ease-out group-hover:scale-105";

  switch (id) {
    case "roxana-munoz":
      return (
        <StaticImage
          src="../images/professors/roxana-munoz.webp"
          alt={name}
          placeholder="blurred"
          className={photoWrapperClasses}
          imgClassName={photoImageClasses}
          objectPosition="50% 8%"
        />
      );
    case "ivan-lopez-carmona":
      return (
        <StaticImage
          src="../images/professors/ivan-lopez-carmona.webp"
          alt={name}
          placeholder="blurred"
          className={photoWrapperClasses}
          imgClassName={photoImageClasses}
          objectPosition="50% 8%"
        />
      );
    case "carlos-romero":
      return (
        <StaticImage
          src="../images/professors/carlos-romero.webp"
          alt={name}
          placeholder="blurred"
          className={photoWrapperClasses}
          imgClassName={photoImageClasses}
          objectPosition="50% 50%"
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
  const { t } = useTranslation("diplomados");
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
              {expanded ? t("profesores.leerMenos") : t("profesores.leerMas")}
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
  const { t } = useTranslation("diplomados");
  const isDesktop = useIsDesktop();

  /* Gatsby no hace scroll automático a anchors — lo manejamos aquí */
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#profesores") {
      const el = document.getElementById("profesores");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 300);
      }
    }
  }, []);

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

  const professors = PROFESSORS.map((professor) => ({
    ...professor,
    badge: t(`profesores.items.${professor.i18nKey}.badge`),
    description: Array.from({ length: professor.numParagraphs }, (_, i) => (
      <Trans
        key={`${professor.id}-p${i}`}
        i18nKey={`profesores.items.${professor.i18nKey}.parrafos.${i}`}
        ns="diplomados"
        components={{ fuerte: <strong /> }}
      />
    )),
  }));

  return (
    <section
      id="profesores"
      className="relative overflow-hidden bg-gradient-to-r from-blue via-purple to-green py-16 sm:py-20"
    >
      <div className="container mx-auto w-full max-w-full px-4">
        <div className="max-w-4xl">
          <p className="text-green-300/90 text-sm uppercase tracking-wider mb-2">
            {t("profesores.kicker")}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            {t("profesores.titulo")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/90">
            {t("profesores.intro")}
          </p>
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {professors.map((professor) => (
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
