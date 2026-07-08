import {
  STORAGE_KEY_LANGUAGE,
  parsePath,
  localizePath,
  isLocalizedPath,
  detectLanguage,
} from "./config"

const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|googlebot|yandex|baidu|duckduck|facebookexternalhit|lighthouse/i

export const getStoredLanguage = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY_LANGUAGE)
  } catch (e) {
    return null
  }
}

export const storeLanguageChoice = language => {
  try {
    window.localStorage.setItem(STORAGE_KEY_LANGUAGE, language)
  } catch (e) {
    // almacenamiento bloqueado (modo privado estricto): seguimos sin persistir
  }
}

/**
 * Redirección de primera visita, SOLO por idioma del navegador
 * (navigator.languages), nunca por geolocalización.
 *
 * - Si hay una elección explícita guardada (selector), se respeta y NO se
 *   vuelve a auto-redirigir jamás.
 * - Bots/crawlers quedan excluidos (Googlebot navega en en-US y no debe
 *   sacar la raíz en español del índice).
 * - Solo se redirige entre versiones de la misma página localizada.
 */
export const maybeRedirectToBrowserLanguage = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return
  if (BOT_UA.test(navigator.userAgent || "")) return
  if (getStoredLanguage()) return

  const { language: currentLanguage, originalPath } = parsePath(
    window.location.pathname
  )
  if (!isLocalizedPath(originalPath)) return

  const browserLanguages =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language]
  const detected = detectLanguage(browserLanguages)

  if (detected === currentLanguage) return

  const target =
    localizePath(detected, originalPath) +
    window.location.search +
    window.location.hash
  window.location.replace(target)
}
