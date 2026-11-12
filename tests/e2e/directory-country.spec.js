const { test, expect } = require('@playwright/test')

test.beforeEach(async ({ page }) => {
  await page.route('https://get.geojs.io/v1/ip/country.json', route => route.abort())
})
const { schools } = require('../../static/schools.json')
const cards = page => page.locator('main .grid > a, main .grid > div')
const geo = (page, code) => page.route('https://ipapi.co/json/', route => route.fulfill({ json: { country_code: code } }))

for (const entry of [
  { code: 'MX', country: 'México', path: '/directorio/', label: 'Mi país:', others: 'Otros países' },
  { code: 'AR', country: 'Argentina', path: '/en/directorio/', label: 'My country:', others: 'Other countries' },
  { code: 'US', country: 'Estados Unidos', path: '/pt-br/directorio/', label: 'Meu país:', others: 'Outros países' },
]) {
  test(`IP country overrides page language: ${entry.code} ${entry.path}`, async ({ page }) => {
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await geo(page, entry.code)
    await page.goto(entry.path)
    const local = page.getByRole('button', { name: `${entry.label} ${entry.country}`, exact: false })
    await expect(local).toHaveAttribute('aria-pressed', 'true')
    const total = schools.filter(s => s.country === entry.country).length
    await expect(cards(page)).toHaveCount(Math.min(120, total))
    for (const text of await cards(page).allTextContents()) expect(text).toContain(entry.country)
    await page.getByRole('button', { name: entry.others, exact: true }).click()
    await expect(local).toHaveAttribute('aria-pressed', 'false')
    const group = page.getByRole('group', { name: entry.code === 'AR' ? 'Filter by country' : 'Filtrar por país' })
    await expect(group.getByRole('button', { name: new RegExp(entry.country) })).toHaveCount(0)
    await page.getByRole('button', { name: /^🌎/ }).click()
    await expect(group.getByRole('button', { name: new RegExp(entry.country) })).toBeVisible()
    await local.click()
    await expect(local).toHaveAttribute('aria-pressed', 'true')
    expect(errors).toEqual([])
  })
}

for (const entry of [
  { name: 'no catalog entries', payload: { country_code: 'BR' } },
  { name: 'invalid response', payload: { country_code: 'INVALID' } },
  { name: 'provider error', payload: { error: true, country_code: 'MX' } },
  { name: 'network failure', abort: true },
]) {
  test(`falls back to language: ${entry.name}`, async ({ page }) => {
    await page.route('https://ipapi.co/json/', route => entry.abort ? route.abort() : route.fulfill({ json: entry.payload }))
    await page.goto('/en/directorio/')
    await expect(page.getByRole('button', { name: 'English-speaking countries', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: /My country:/ })).toHaveCount(0)
    await expect(cards(page)).not.toHaveCount(0)
  })
}

test('late geolocation does not override a manual choice', async ({ page }) => {
  let complete
  const pending = new Promise(resolve => { complete = resolve })
  await page.route('https://ipapi.co/json/', async route => {
    await pending
    await route.fulfill({ json: { country_code: 'MX' } })
  })
  await page.goto('/directorio/')
  await page.getByRole('button', { name: '🌎 Todos', exact: true }).click()
  complete()
  await expect(page.getByRole('button', { name: /Mi país: México/ })).toBeVisible()
  await expect(page.getByRole('button', { name: '🌎 Todos', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(cards(page)).toHaveCount(120)
})

test('provider timeout leaves language filtering usable', async ({ page }) => {
  await page.route('https://ipapi.co/json/', () => {})
  await page.goto('/directorio/')
  await page.waitForTimeout(5500)
  await expect(page.getByRole('button', { name: 'Países de habla hispana', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /Mi país:/ })).toHaveCount(0)
  await page.getByRole('button', { name: '🌎 Todos', exact: true }).click()
  await expect(cards(page)).toHaveCount(120)
})

test('load more, reach last school, reset after filters and certification', async ({ page }) => {
  await geo(page, 'MX')
  await page.goto('/directorio/')
  await expect(page.getByRole('button', { name: /Mi país: México/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '🌎 Todos', exact: true }).click()
  const more = page.getByRole('button', { name: 'Cargar más', exact: true })
  await expect(cards(page)).toHaveCount(120)
  await more.click()
  await expect(cards(page)).toHaveCount(240)
  await expect(page.getByRole('status')).toContainText('240')
  for (let count = 240; count < schools.length; count += 120) {
    await more.click()
    await expect(cards(page)).toHaveCount(Math.min(count + 120, schools.length))
  }
  await expect(more).toHaveCount(0)
  await page.getByRole('searchbox').fill('unmatched-school-xyz')
  await expect(cards(page)).toHaveCount(0)
  await page.getByRole('searchbox').fill('')
  await expect(cards(page)).toHaveCount(120)
  await page.getByRole('checkbox', { name: 'Solo certificadas AMMAC' }).check()
  await expect(cards(page)).toHaveCount(Math.min(120, schools.filter(s => s.ammacCertified).length))
  await page.getByRole('checkbox', { name: 'Solo certificadas AMMAC' }).uncheck()
  await expect(cards(page)).toHaveCount(120)
})


test('free fallback detects country when primary provider rate-limits', async ({ page }) => {
  await page.route('https://ipapi.co/json/', route => route.fulfill({ status: 429, json: { error: true } }))
  await page.route('https://get.geojs.io/v1/ip/country.json', route => route.fulfill({ json: { country: 'AR' } }))
  await page.goto('/directorio/')
  await expect(page.getByRole('button', { name: /Mi país: Argentina/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(cards(page)).toHaveCount(Math.min(120, schools.filter(s => s.country === 'Argentina').length))
})
