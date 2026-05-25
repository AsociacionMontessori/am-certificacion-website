import { useEffect, useState } from "react"

/** Desplazamiento suave del fondo fijo al hacer scroll (sustituto ligero de parallax en imagen). */
export function useHeroParallax(multiplier = 0.35) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
    if (prefersReduced) return undefined

    let frame = null
    const onScroll = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(() => {
        setOffset(window.scrollY * multiplier)
        frame = null
      })
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [multiplier])

  return offset
}
