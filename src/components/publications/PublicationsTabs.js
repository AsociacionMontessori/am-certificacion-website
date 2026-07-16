import * as React from "react"
import { Tab } from "@headlessui/react"
import { useTranslation } from "react-i18next"
import RoxanaBooksSection from "../RoxanaBooksSection"
import ArticleGrid from "./ArticleGrid"

const hashForIndex = index => (index === 1 ? "#libros" : "#articulos")
const indexForHash = hash => (hash === "#libros" ? 1 : 0)

const PublicationsTabs = ({ posts }) => {
  const { t } = useTranslation("publicaciones")
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  React.useEffect(() => {
    const syncFromLocation = () =>
      setSelectedIndex(indexForHash(window.location.hash))

    syncFromLocation()
    window.addEventListener("hashchange", syncFromLocation)
    window.addEventListener("popstate", syncFromLocation)

    return () => {
      window.removeEventListener("hashchange", syncFromLocation)
      window.removeEventListener("popstate", syncFromLocation)
    }
  }, [])

  const changeTab = index => {
    setSelectedIndex(index)
    window.history.replaceState(null, "", hashForIndex(index))
  }

  return (
    <Tab.Group selectedIndex={selectedIndex} onChange={changeTab}>
      <Tab.List
        className="mx-auto grid w-full max-w-md grid-cols-2 border border-blue/20 bg-white p-1"
        aria-label={t("tabs.label")}
      >
        {[t("tabs.articles"), t("tabs.books")].map(label => (
          <Tab
            key={label}
            className={({ selected }) =>
              `min-h-[44px] px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue ${
                selected ? "bg-blue text-white" : "text-blue"
              }`
            }
          >
            {label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel unmount={false}>
          <ArticleGrid initialPosts={posts} />
        </Tab.Panel>
        <Tab.Panel unmount={false}>
          <RoxanaBooksSection
            id="libros"
            headingId="publicaciones-libros-heading"
            className="bg-blue py-10"
          />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  )
}

export default PublicationsTabs
