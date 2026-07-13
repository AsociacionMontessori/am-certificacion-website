import React from 'react';
import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import kalpilliLight from "../images/lasc.png"
import { StaticImage } from 'gatsby-plugin-image';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '../i18n';
import LanguageSelector from './LanguageSelector';


const navigation = [
    { key: 'nav.diplomados', path: '/diplomados/', current: false },
    { key: 'nav.publicaciones', path: '/publicaciones/', current: false },
    { key: 'nav.escuelaParaNinos', href: 'https://kalpilli.com/', current: false, external: true },
    { key: 'nav.directorioEscuelas', path: '/directorio/', current: false },
    { key: 'nav.contacto', path: '/contact/', current: false },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Nav({ textColor }) {

    const { t } = useTranslation()
    const { localizedPath } = useLocalization()

    const itemHref = item => (item.external ? item.href : localizedPath(item.path))

    return (
        <Disclosure as="nav" className="bg-white-400 mb-10 relative z-20">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7x1 px-3 sm:px-4 lg:px-6 min-w-fit dark:text-white pt-5" >
                        <div className="relative flex h-16 items-center justify-between sm:justify-center">
                            <div className="absolute inset-y-0 left-0 flex items-center lg:hidden">
                                <Disclosure.Button className="bg-white text-gray inline-flex items-center justify-center rounded-md p-2 hover:bg-gray hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                    <span className="sr-only">{t('nav.abrirMenu')}</span>
                                    {open ? (
                                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Disclosure.Button>
                            </div>
                            <div className="absolute inset-y-0 right-0 flex items-center lg:hidden pr-3">
                                <LanguageSelector textColor={textColor} />
                            </div>
                            <div className="flex flex-1 items-center justify-center lg:items-stretch lg:justify-between px-7">
                                <div className="flex flex-shrink-0 items-center lg:px-6 md:px-4">
                                    <a href={localizedPath('/')}>
                                        <img
                                            className="block h-12 w-auto lg:h-20 md:h-15 sm:h-10 mx-auto"
                                            src={kalpilliLight}
                                            alt={t('nav.logoAlt')}
                                        />
                                    </a>
                                </div>
                                <div className="hidden lg:ml-6 lg:block pt-6">
                                    <div className="flex items-center space-x-1 text-sm md:text-xs lg:text-base sm:text-xs">
                                        {navigation.map((item) => (
                                            <a
                                                key={item.key}
                                                href={itemHref(item)}
                                                className={classNames(
                                                    item.current ? 'text-yellow-400' : 'text-white-300',
                                                    `${textColor} group rounded-md px-4 md:px-6 text-sm xl:text-base py- font-semibold [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]`
                                                )}
                                                aria-current={item.current ? 'page' : undefined}
                                                target={item.external ? '_blank' : undefined}
                                                rel={item.external ? 'noopener noreferrer' : undefined}
                                            >
                                                {t(item.key)}
                                                <div className="inline relative opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                                    <StaticImage className='w-6 h-6 absolute' src="../images/elements/decor2.png" alt="decoration" />
                                                </div>
                                            </a>
                                        ))}
                                        <LanguageSelector
                                            textColor={`${textColor} [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]`}
                                            className="pl-4"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="lg:hidden">
                        <div className="space-y-1 y-10 px-2 pb-3 pt-2">
                            {navigation.map((item) => (
                                <Disclosure.Button
                                    key={item.key}
                                    as="a"
                                    href={itemHref(item)}
                                    className={classNames(
                                        item.current ? `bg-red ${textColor}` : ' text-black hover:bg-red hover:text-white ',
                                        `${textColor} block rounded-md px-3 py-2 text-base font-medium`
                                    )}
                                    aria-current={item.current ? 'page' : undefined}
                                    target={item.external ? '_blank' : undefined}
                                    rel={item.external ? 'noopener noreferrer' : undefined}
                                >
                                    {t(item.key)}
                                </Disclosure.Button>
                            ))}
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    )
}
