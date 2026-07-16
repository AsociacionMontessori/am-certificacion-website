import * as React from "react"
import { useTranslation } from "react-i18next"
import ArticleCard from "./ArticleCard"

const {
  fetchRecentWordPressPosts,
} = require("../../services/wordpressPosts")

const ArticleGrid = ({ initialPosts = [] }) => {
  const { t } = useTranslation("publicaciones")
  const [posts, setPosts] = React.useState(initialPosts)

  React.useEffect(() => {
    let active = true

    fetchRecentWordPressPosts({ limit: 12 })
      .then(freshPosts => {
        if (active && freshPosts.length) setPosts(freshPosts)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  return (
    <section id="articulos" aria-labelledby="articles-heading" className="py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="articles-heading"
            className="text-2xl font-bold text-blue md:text-3xl"
          >
            {t("articles.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray md:text-base">
            {t("articles.description")}
          </p>
        </div>
        <a
          href="https://montessorimexico.org/"
          className="inline-flex min-h-[44px] items-center font-semibold text-blue underline decoration-green decoration-2 underline-offset-4"
        >
          {t("articles.all")}
        </a>
      </div>
      <ul className="mt-7 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
        {posts.map(post => (
          <li key={post.id}>
            <ArticleCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ArticleGrid
