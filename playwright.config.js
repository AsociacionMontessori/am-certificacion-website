const { defineConfig, devices } = require("@playwright/test")

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  outputDir: "output/playwright/results",
  use: {
    baseURL: "http://127.0.0.1:9000",
    screenshot: "only-on-failure",
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://127.0.0.1:9000",
          localStorage: [
            { name: "ammac-analytics-consent-v1", value: "denied" },
            { name: "cm-language", value: "es" },
          ],
        },
      ],
    },
  },
  webServer: {
    command: "npm run serve:test",
    url: "http://127.0.0.1:9000",
    reuseExistingServer: true,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
})
