const { test, expect } = require("@playwright/test")

const languageCases = [
  {
    language: "es",
    path: "/diplomados/casa-de-ninos/",
    h1: "Guía Montessori en Casa de Niños",
    duration: "17 meses",
    priceNote: "Colegiatura mensual",
    checkout: "Inscribirme en línea",
    checkoutPath: "/inscripcion/pagar/?programa=casa",
    programPrefix: "/diplomados/",
  },
  {
    language: "en",
    path: "/en/diplomados/casa-de-ninos/",
    h1: "Montessori Guide for Children's House",
    duration: "17 months",
    priceNote: "Monthly tuition",
    checkout: "Enroll online",
    checkoutPath: "/en/inscripcion/pagar/?programa=casa",
    programPrefix: "/en/diplomados/",
  },
  {
    language: "pt-br",
    path: "/pt-br/diplomados/casa-de-ninos/",
    h1: "Guia Montessori de Casa das Crianças",
    duration: "17 meses",
    priceNote: "Mensalidade",
    checkout: "Inscrever-me on-line",
    checkoutPath: "/pt-br/inscripcion/pagar/?programa=casa",
    programPrefix: "/pt-br/diplomados/",
  },
]

const priceCases = [
  {
    path: "/diplomados/casa-de-ninos/",
    price: "$3,500 MXN",
    note: "Colegiatura mensual",
  },
  {
    path: "/diplomados/educacion-cosmica/",
    price: "$2,800 MXN",
    note: "Costo del programa",
  },
  {
    path: "/diplomados/neuroeducacion/",
    price: "$4,500 MXN",
    note: "el programa y la inscripción institucional están incluidos",
  },
]

const directoryCases = [
  {
    path: "/diplomados/",
    details: "Ver programa: Casa de Niños",
    detailsPath: "/diplomados/casa-de-ninos/",
    checkout: "Inscribirme en línea: Casa de Niños",
    checkoutPath: "/inscripcion/pagar/?programa=casa",
  },
  {
    path: "/en/diplomados/",
    details: "View program: Children's House",
    detailsPath: "/en/diplomados/casa-de-ninos/",
    checkout: "Enroll online: Children's House",
    checkoutPath: "/en/inscripcion/pagar/?programa=casa",
  },
  {
    path: "/pt-br/diplomados/",
    details: "Ver programa: Casa das Crianças",
    detailsPath: "/pt-br/diplomados/casa-de-ninos/",
    checkout: "Inscrever-me on-line: Casa das Crianças",
    checkoutPath: "/pt-br/inscripcion/pagar/?programa=casa",
  },
]

test.beforeEach(async ({ page }) => {
  await page.route("https://ipapi.co/json/", route =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ country_code: "MX", country_name: "Mexico" }),
    })
  )
})

for (const entry of languageCases) {
  test(`${entry.language} program page localizes its offer and navigation`, async ({
    page,
  }) => {
    await page.goto(entry.path)

    await expect(page.locator("h1")).toHaveCount(1)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(entry.h1)

    const offer = page.locator("article[data-program-id='casa'] aside")
    await expect(offer).toContainText(entry.duration)
    await expect(offer).toContainText("$3,500 MXN")
    await expect(offer).toContainText(entry.priceNote)
    await expect(
      offer.getByRole("link", { name: entry.checkout })
    ).toHaveAttribute("href", entry.checkoutPath)

    const directory = page.getByRole("navigation", {
      name: /formaciones|training programs|formações/i,
    })
    const links = directory.locator("a")
    await expect(links).toHaveCount(4)
    for (const href of await links.evaluateAll(elements =>
      elements.map(element => element.getAttribute("href"))
    )) {
      expect(href).toMatch(new RegExp(`^${entry.programPrefix}`))
    }

    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }))
    expect(overflow.document).toBeLessThanOrEqual(overflow.viewport + 1)
    expect(overflow.body).toBeLessThanOrEqual(overflow.viewport + 1)

    await page.screenshot({
      path: test
        .info()
        .outputPath(`casa-${entry.language}-${test.info().project.name}.png`),
      fullPage: true,
    })
  })
}

for (const entry of priceCases) {
  test(`${entry.path} explains its price model`, async ({ page }) => {
    await page.goto(entry.path)
    const offer = page.locator("article[data-program-id] aside")
    await expect(offer).toContainText(entry.price)
    await expect(offer).toContainText(entry.note)
  })
}

for (const entry of directoryCases) {
  test(`${entry.path} separates program details from checkout`, async ({
    page,
  }) => {
    await page.goto(entry.path)
    const prices = page.locator("#certificacion_internacional")

    await expect(
      prices.getByRole("link", { name: entry.details })
    ).toHaveAttribute("href", entry.detailsPath)
    await expect(
      prices.getByRole("link", { name: entry.checkout })
    ).toHaveAttribute("href", entry.checkoutPath)
  })
}
