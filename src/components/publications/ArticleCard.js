import * as React from "react"
import { useTranslation } from "react-i18next"
import { useLocalization } from "../../i18n"

const { trackEvent } = require("../../utils/analytics")

const ArticleCard = ({ post }) => {
  const { t } = useTranslation("publicaciones")
  const { language } = useLocalization()
  const locale = language === "pt-br" ? "pt-BR" : language
  const date = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.date))

  return (
    <article className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-blue/15 bg-white shadow-md">
      {post.imageUrl ? (
        <div className="aspect-[16/9] overflow-hidden bg-blue/5">
          <img
            src={post.imageCardUrl || post.imageUrl}
            srcSet={post.imageSrcSet || undefined}
            sizes="(min-width: 1280px) 368px, (min-width: 768px) calc((100vw - 68px) / 2), calc(100vw - 34px)"
            alt={post.imageAlt}
            width={post.imageWidth || 1200}
            height={post.imageHeight || 630}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col p-5">
        <p className="text-xs text-gray">
          {date} · {post.author}
        </p>
        {language !== "es" ? (
          <p className="mt-2 text-xs font-semibold text-green">
            {t("articles.spanishLabel")}
          </p>
        ) : null}
        <h3 className="mt-2 text-lg font-bold leading-snug text-blue">
          {post.title}
        </h3>
        <p className="mt-3 line-clamp-4 flex-grow text-sm leading-relaxed text-gray">
          {post.excerpt}
        </p>
        <a
          href={post.url}
          onClick={() =>
            trackEvent("click_article", {
              language,
              source_hostname: "certificacionmontessori.com",
              source_content_id: post.sourceContentId,
              landing_path:
                typeof window === "undefined" ? "" : window.location.pathname,
              cta_position: "article_card",
            })
          }
          className="mt-5 inline-flex min-h-[44px] items-center font-semibold text-blue underline decoration-green decoration-2 underline-offset-4"
        >
          {t("articles.read")}
        </a>
      </div>
    </article>
  )
}

export default ArticleCard
