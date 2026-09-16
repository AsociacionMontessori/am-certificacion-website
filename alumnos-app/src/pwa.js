let installPrompt = null
let installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const listeners = new Set()
const notify = () => listeners.forEach(listener => listener())

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault()
  installPrompt = event
  notify()
})
window.addEventListener('appinstalled', () => {
  installed = true
  installPrompt = null
  notify()
})

export const subscribe = listener => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const getInstalled = () => installed
export async function promptInstall() {
  if (!installPrompt) return false
  const prompt = installPrompt
  installPrompt = null
  try {
    await prompt.prompt()
    await prompt.userChoice
    return true
  } catch {
    return false
  }
}

export function registerPwa() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => console.warn('No se pudo preparar la instalación de la app.'))
    }, { once: true })
  }
}
