import React from 'react';
import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import kalpilliLight from "../images/lasc.png"
import { StaticImage } from 'gatsby-plugin-image';

const navigation = [
    // { name: 'CERTIFÍCATE', href: '../certificate', current: false },
    { name: 'DIPLOMADOS', href: '../certificate', current: false },
    { name: 'MASSTERCLASSES', href: '../masterclasses', current: false },
    { name: 'PUBLICACIONES', href: '../publicaciones', current: false },
    { name: 'KALPILLI', href: 'https://kalpilli.com/', current: false },
    { name: 'CONTACTO', href: '../contact', current: false },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Nav({ textColor }) {
    return (
        <Disclosure as="nav" className="bg-white-400 mb-10 relative z-20">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7x1 px-3 sm:px-4 lg:px-6 min-w-fit dark:text-white pt-5" >
                        <div className="relative flex h-16 items-center justify-between sm:justify-center">
                            <div className="absolute inset-y-0 left-0 flex items-center lg:hidden">
                                <Disclosure.Button className="bg-white dark:bg-red inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                    <span className="sr-only">Abrir Menu</span>
                                    {open ? (
                                        <XMarkIcon className="dark:bg-red block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Bars3Icon className="dark:bg-red block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Disclosure.Button>
                            </div>
                            <div className="flex flex-1 items-center justify-center lg:items-stretch lg:justify-between px-7">
                                <div className="flex flex-shrink-0 items-center lg:px-6 md:px-4">
                                    <a href="..">
                                        <img
                                            className="block h-12 w-auto lg:h-20 md:h-15 sm:h-10 mx-auto"
                                            src={kalpilliLight}
                                            alt="Kalpilli Logo (Light Mode)"
                                        />
                                    </a>
                                </div>
                                <div className="hidden lg:ml-6 lg:block pt-6">
                                    <div className="flex space-x-1 text-sm md:text-xs lg:text-base sm:text-xs">
                                        {navigation.map((item) => (
                                            <a
                                                key={item.name}
                                                href={item.href}
                                                className={classNames(
                                                    item.current ? 'text-yellow-400' : 'text-white-300',
                                                    `${textColor} group rounded-md px-4 md:px-6 text-sm xl:text-base py-`
                                                )}
                                                aria-current={item.current ? 'page' : undefined}
                                            >
                                                {item.name}
                                                <div className="inline relative opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out transistion-all">
                                                    <StaticImage className='w-6 h-6 absolute' src="../images/elements/decor2.png" alt="decoration" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="lg:hidden">
                        <div className="space-y-1 y-10 px-2 pb-3 pt-2">
                            {navigation.map((item) => (
                                <Disclosure.Button
                                    key={item.name}
                                    as="a"
                                    href={item.href}
                                    className={classNames(
                                        item.current ? `bg-red ${textColor}` : ' text-black hover:bg-red hover:text-white ',
                                        `${textColor} block rounded-md px-3 py-2 text-base font-medium`
                                    )}
                                    aria-current={item.current ? 'page' : undefined}
                                >
                                    {item.name}
                                </Disclosure.Button>
                            ))}
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    )
}