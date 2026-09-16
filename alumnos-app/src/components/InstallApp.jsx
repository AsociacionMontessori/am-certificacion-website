import { useState, useSyncExternalStore } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { getInstalled, promptInstall, subscribe } from '../pwa'

export default function InstallApp() {
  const installed = useSyncExternalStore(subscribe, getInstalled)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function install() {
    setBusy(true)
    if (!(await promptInstall())) setOpen(true)
    setBusy(false)
  }

  if (installed) return null
  return <>
    <button type="button" disabled={busy} onClick={install}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
      <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
      Instalar app
    </button>
    <Dialog open={open} onClose={setOpen} className="relative z-[100]">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 text-slate-700 shadow-xl dark:bg-slate-900 dark:text-slate-200">
          <DialogTitle className="text-xl font-bold">Tu portal, como app</DialogTitle>
          <p className="mt-3 text-sm">Añade Alumnos Montessori a tu pantalla de inicio. Es gratis y entrarás con tu cuenta habitual.</p>
          <dl className="mt-5 space-y-4 text-sm">
            <div><dt className="font-bold">iPhone o iPad</dt><dd>Abre este sitio en Safari, toca Compartir y elige Añadir a pantalla de inicio. Si aparece, activa Abrir como app web y pulsa Añadir.</dd></div>
            <div><dt className="font-bold">Android</dt><dd>Abre este sitio en Chrome. En el menú ⋮, elige Instalar aplicación o Añadir a pantalla de inicio.</dd></div>
            <div><dt className="font-bold">Computadora</dt><dd>En Chrome o Edge, usa el icono de instalación en la barra de direcciones o la opción Instalar del menú. En Safari para Mac compatible, elige Archivo → Añadir al Dock.</dd></div>
          </dl>
          <p className="mt-5 text-sm">Necesitas internet para consultar tu información. Si abriste el enlace desde WhatsApp u otra app, ábrelo primero en tu navegador.</p>
          <button type="button" onClick={() => setOpen(false)} className="mt-5 min-h-11 w-full rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white dark:bg-slate-200 dark:text-slate-900">Entendido</button>
        </DialogPanel>
      </div>
    </Dialog>
  </>
}
