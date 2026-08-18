const { test, expect } = require("@playwright/test")

test("explains where to find the payment reference", async ({ page }) => {
  await page.goto("/inscripcion/completar/")

  await page
    .getByRole("button", {
      name: "Información para encontrar tu referencia de pago",
    })
    .click()

  const dialog = page.getByRole("dialog")
  const title = dialog.getByRole("heading", {
    name: "Dónde encontrar tu referencia de pago",
  })
  await expect(title).toBeVisible()
  await expect(
    dialog.getByAltText(
      "Ejemplo de la pantalla de pago recibido con el recuadro de referencia de pago resaltado"
    )
  ).toBeVisible()
  await expect(dialog).toContainText("no uses el número de recibo")

  await dialog.getByRole("button", { name: "Entendido" }).click()
  await expect(dialog).toHaveCount(0)
})

test("highlights the site payment reference after Stripe returns", async ({
  page,
}) => {
  const exampleReference = "A1b2C3d4E5f6G7h8J9kL"
  await page.goto(
    `/checkout/success/?orden=${exampleReference}&tipo=inscripcion`
  )

  const card = page.getByTestId("payment-reference-card")
  await expect(card).toBeVisible()
  await expect(card).toContainText("Referencia de pago")
  await expect(page.getByTestId("payment-reference-value")).toHaveText(
    exampleReference
  )
  await expect(card).toContainText("Guarda o copia este código")
})
