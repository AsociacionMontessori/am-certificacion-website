import * as React from "react"
import { Dialog } from "@headlessui/react"
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { useTranslation } from "react-i18next"

const SUPPORT_EMAIL = "admin@certificacionmontessori.com"

const PaymentReferenceHelp = () => {
  const { t, i18n } = useTranslation("checkout")
  const [isOpen, setIsOpen] = React.useState(false)
  const currentLanguage = String(
    i18n.resolvedLanguage || i18n.language || "es"
  ).toLowerCase()
  const imageLocale = currentLanguage.startsWith("pt")
    ? "pt-br"
    : currentLanguage.startsWith("en")
    ? "en"
    : "es"

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-blue hover:bg-blue/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
        aria-label={t("completePage.referenceHelpButtonLabel")}
      >
        <InformationCircleIcon className="h-5 w-5" aria-hidden="true" />
        <span className="underline decoration-blue/30 underline-offset-2">
          {t("completePage.referenceHelpButton")}
        </span>
      </button>

      <Dialog
        open={isOpen}
        onClose={setIsOpen}
        className="relative"
        style={{ zIndex: 1000000000 }}
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
          <div className="flex min-h-full items-center justify-center">
            <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-start gap-3 border-b border-gray/10 px-5 py-4 sm:px-6">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue/10 text-blue">
                  <InformationCircleIcon
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="text-lg font-bold leading-snug text-blue">
                    {t("completePage.referenceHelpTitle")}
                  </Dialog.Title>
                  <p className="mt-1 text-sm leading-relaxed text-gray">
                    {t("completePage.referenceHelpIntro")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray hover:bg-gray/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                  aria-label={t("completePage.referenceHelpCloseLabel")}
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-5 px-5 py-5 sm:px-6">
                <figure>
                  <img
                    src={`/images/checkout-referencia-pago-ejemplo-${imageLocale}.png`}
                    alt={t("completePage.referenceHelpImageAlt")}
                    width="896"
                    height="270"
                    loading="lazy"
                    className="h-auto w-full rounded-2xl border border-blue/20 bg-white shadow-sm"
                  />
                  <figcaption className="mt-2 text-center text-xs text-gray">
                    {t("completePage.referenceHelpImageCaption")}
                  </figcaption>
                </figure>

                <ol className="space-y-3 text-sm leading-relaxed text-gray">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue text-xs font-bold text-white">
                      1
                    </span>
                    <span>{t("completePage.referenceHelpStep1")}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue text-xs font-bold text-white">
                      2
                    </span>
                    <span>{t("completePage.referenceHelpStep2")}</span>
                  </li>
                </ol>

                <div className="rounded-2xl border border-yellow/60 bg-yellow/10 px-4 py-3">
                  <p className="text-sm leading-relaxed text-gray">
                    <strong className="text-blue">
                      {t("completePage.referenceHelpImportant")}
                    </strong>{" "}
                    {t("completePage.referenceHelpWarning")}
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-gray">
                  {t("completePage.referenceHelpLost")}{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-semibold text-blue underline underline-offset-2"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </p>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-[48px] w-full rounded-full bg-blue px-6 py-3 font-semibold text-white hover:bg-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
                >
                  {t("completePage.referenceHelpClose")}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </>
  )
}

export default PaymentReferenceHelp
