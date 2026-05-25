// L5 Android smoke (Appium + WebdriverIO) — Capacitor WebView app.
//
// Prerequisites (manual, environment-dependent — NOT run in CI):
//   npm i -D webdriverio          # or `npm i -g`
//   npm i -g appium
//   appium driver install uiautomator2
//   # Android 13 (API 33) emulator running, app installed:
//   #   npm run build && npx cap sync android && npx cap run android
//   # Start the Appium server in another terminal:  appium
//
// Run:  node android-tests/appium/items.smoke.test.mjs
//
// DATA DEPENDENCY: MSW only runs in the Vite DEV build (main.ts gates it on
// import.meta.env.DEV). A production `cap run android` has no mock backend, so
// the login call and items list will fail. The `items-list` assertion below
// therefore needs MSW-in-build or a reachable backend — see README.md. Without
// it, only the "login screen renders" portion is meaningful.
import { remote } from 'webdriverio'

const capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:platformVersion': '13',
  'appium:appPackage': 'com.example.ionicvueorval',
  'appium:appActivity': '.MainActivity',
  'appium:autoWebview': true, // start directly in the WebView context
  'appium:chromedriverAutodownload': true, // match the device's WebView/Chrome
}

const driver = await remote({
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',
  capabilities,
})

try {
  // Ensure we are in the Capacitor WebView context (WEBVIEW_<package>).
  const contexts = await driver.getContexts()
  const webview = contexts.find((c) => String(c).startsWith('WEBVIEW'))
  if (webview) await driver.switchContext(webview)

  // Login screen renders without a backend; CSS/data-testid selectors work
  // here because we are in the WebView (DOM) context.
  await (await driver.$('[data-testid="login-username"] input')).setValue('demo')
  await (await driver.$('[data-testid="login-password"] input')).setValue('password1')
  await (await driver.$('[data-testid="login-submit"]')).click()

  // Requires MSW-in-build or a backend (see DATA DEPENDENCY above).
  const list = await driver.$('[data-testid="items-list"]')
  await list.waitForDisplayed({ timeout: 5000 })

  await driver.saveScreenshot('./android-tests/screenshots/items-screen.png')
  console.log('L5 appium smoke: OK')
} finally {
  await driver.deleteSession()
}
