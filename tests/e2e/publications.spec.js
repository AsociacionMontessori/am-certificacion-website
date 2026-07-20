const { test, expect } = require("@playwright/test")

test.beforeEach(async ({ page }) => {
  await page.route("**/wp-json/wp/v2/posts**", route => route.abort())
})

test("articles are first and snapshot survives API failure", async ({
  page,
}) => {
  await page.goto("/publicaciones/")
  await expect(page.locator("iframe")).toHaveCount(0)
  await expect(page.getByRole("tab", { name: "Artículos" })).toHaveAttribute(
    "aria-selected",
    "true"
  )
  await expect(page.locator("#articulos article").first()).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Ver todos los artículos" })
  ).toBeVisible()
  const articleImages = page.locator("#articulos article img")
  await expect(articleImages).toHaveCount(12)
  for (let index = 0; index < 12; index += 1) {
    const image = articleImages.nth(index)
    await image.scrollIntoViewIfNeeded()
    await expect
      .poll(() => image.evaluate(node => node.naturalWidth))
      .toBeGreaterThan(0)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await page.screenshot({
    path: test
      .info()
      .outputPath(`publicaciones-${test.info().project.name}.png`),
    fullPage: true,
  })
})

test("book hash and hero link open books and preserve Amazon destinations", async ({
  page,
}) => {
  await page.goto("/publicaciones/#articulos")
  await expect(page.getByRole("tab", { name: "Artículos" })).toHaveAttribute(
    "aria-selected",
    "true"
  )
  await page.locator('a[href="#libros"]').first().click()
  await expect(page).toHaveURL(/#libros$/)
  await expect(page.getByRole("tab", { name: "Libros AMMAC" })).toHaveAttribute(
    "aria-selected",
    "true"
  )

  const amazonLinks = page.getByRole("link", { name: /Ver en Amazon/ })
  await expect(amazonLinks.first()).toBeVisible()
  const hrefs = await amazonLinks.evaluateAll(links =>
    links.map(link => link.href).sort()
  )
  expect(hrefs).toEqual(
    [
      "https://www.amazon.com.mx/dp/B0GZY8N61G",
      "https://www.amazon.com.mx/dp/B0H13SC1QK",
      "https://www.amazon.com.mx/dp/B0H143L8GN",
      "https://www.amazon.com.mx/dp/B0H14FT9K4",
      "https://www.amazon.com.mx/dp/B0H3R8YX6Q",
    ].sort()
  )
})

test("keyboard switches tabs without layout overlap", async ({ page }) => {
  await page.goto("/publicaciones/")
  const articles = page.getByRole("tab", { name: "Artículos" })
  await expect(articles).toHaveAttribute("aria-controls", /.+/)
  await articles.focus()
  await page.keyboard.press("ArrowRight")
  await expect(page.getByRole("tab", { name: "Libros AMMAC" })).toHaveAttribute(
    "aria-selected",
    "true"
  )

  const boxes = await page
    .locator("main, footer, [role=tablist]")
    .evaluateAll(elements =>
      elements.map(element => {
        const rect = element.getBoundingClientRect()
        return { width: rect.width, height: rect.height }
      })
    )
  expect(boxes.every(box => box.width > 0 && box.height > 0)).toBe(true)
})

for (const [url, tabName, languageNotice] of [
  ["/en/publicaciones/", "Articles", "Article in Spanish"],
  ["/pt-br/publicaciones/", "Artigos", "Artigo em espanhol"],
]) {
  test(`${url} labels Spanish editorial content explicitly`, async ({
    page,
  }) => {
    await page.goto(url)
    await expect(page.getByRole("tab", { name: tabName })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    await expect(page.getByText(languageNotice).first()).toBeVisible()
  })
}

test("analytics tag waits for consent and preferences remain reversible", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.removeItem("ammac-analytics-consent-v1")
  )
  const analyticsRequests = []
  page.on("request", request => {
    if (/googletagmanager\.com|google-analytics\.com/.test(request.url())) {
      analyticsRequests.push(request.url())
    }
  })

  await page.goto("/publicaciones/")
  await expect(
    page.getByRole("dialog", { name: "Privacidad y analítica" })
  ).toBeVisible()
  expect(analyticsRequests).toHaveLength(0)
  await page.getByRole("button", { name: "Aceptar analítica" }).click()
  await expect.poll(() => analyticsRequests.length).toBeGreaterThan(0)

  await page.getByRole("button", { name: "Preferencias de privacidad" }).click()
  await expect(
    page.getByRole("dialog", { name: "Privacidad y analítica" })
  ).toBeVisible()
  await page.getByRole("button", { name: "No aceptar" }).click()
  await expect(
    page.getByRole("dialog", { name: "Privacidad y analítica" })
  ).toHaveCount(0)
})
