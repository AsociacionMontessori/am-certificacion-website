const { test, expect } = require('@playwright/test')
const data = require('../../static/schools.json')

const cases = [
  { path: '/directorio/', scope: 'Países de habla hispana', group: 'Filtrar por país', included: 'México', excluded: 'Estados Unidos', all: '🌎 Todos' },
  { path: '/en/directorio/', scope: 'English-speaking countries', group: 'Filter by country', included: 'Estados Unidos', excluded: 'México', all: '🌎 All' },
  { path: '/pt-br/directorio/', scope: 'Países de língua portuguesa', group: 'Filtrar por país', included: 'Portugal', excluded: 'México', all: '🌎 Todos' },
]

for (const entry of cases) {
  test(`language scope, all countries, search and return: ${entry.path}`, async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(entry.path)
    const countries = page.getByRole('group', { name: entry.group })
    const scope = page.getByRole('button', { name: entry.scope, exact: true })
    const all = page.getByRole('button', { name: entry.all, exact: true })
    await expect(scope).toHaveAttribute('aria-pressed', 'true')
    await expect(countries.getByRole('button', { name: new RegExp(entry.included) })).toBeVisible()
    await expect(countries.getByRole('button', { name: new RegExp(entry.excluded) })).toHaveCount(0)
    await countries.getByRole('button', { name: new RegExp(entry.included) }).click()
    const expected = data.schools.filter(s => s.country === entry.included).length
    await expect(page.locator('main').last()).toContainText(String(expected))
    await all.click()
    await expect(all).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('main').last()).toContainText(String(data.schools.length))
    await expect(countries.getByRole('button', { name: new RegExp(entry.excluded) })).toBeVisible()
    await page.getByRole('searchbox').fill('unmatched-school-xyz')
    await expect(page.locator('main .grid > a, main .grid > div')).toHaveCount(0)
    await page.getByRole('searchbox').fill('')
    await scope.click()
    await expect(scope).toHaveAttribute('aria-pressed', 'true')
    await expect(countries.getByRole('button', { name: new RegExp(entry.excluded) })).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('browser language automatically selects the corresponding directory', async ({ browser }) => {
  for (const locale of ['es-MX', 'en-US', 'pt-BR']) {
    const context = await browser.newContext({ locale, storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:9000/directorio/')
    const entry = cases[locale.startsWith('es') ? 0 : locale.startsWith('en') ? 1 : 2]
    await expect(page).toHaveURL(new RegExp(`${entry.path}$`))
    await expect(page.getByRole('button', { name: entry.scope, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await context.close()
  }
})
