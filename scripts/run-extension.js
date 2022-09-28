const { chromium } = require('@playwright/test')
const path = require('path')

async function run() {
  const pathToExtension = path.join(__dirname, '../test-extension/dist')
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    devtools: true,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
    ignoreDefaultArgs: ['--enable-automation'],
    viewport: null,
  })

  let [background] = context.serviceWorkers()
  if (!background) background = await context.waitForEvent('serviceworker')

  const extensionId = background.url().split('/')[2]
  console.log('extensionId', extensionId)

  const page = await context.newPage()
  await page.goto('http://example.com')

  const tab = await context.newPage()
  await tab.goto(`chrome-extension://${extensionId}/tab.html`, {
    waitUntil: 'networkidle',
  })

  background.evaluate(() => {
    chrome.action.openPopup()
  })

  const openPages = context.pages()

  const omnilogPage = openPages.find(
    (page) => page.url() === `chrome-extension://${extensionId}/omnilog.html`,
  )

  await omnilogPage.bringToFront()
}

run()