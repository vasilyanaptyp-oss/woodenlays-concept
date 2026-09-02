const { chromium } = require("C:/Users/vasil/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js");
const fs = require("node:fs");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const failedRequests = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || "failed"}`));

  await page.goto("http://127.0.0.1:4176/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Atvērt izvēlni" }).click();
  const menuOpen = await page.locator("#mobile-menu").getAttribute("aria-hidden");
  await page.keyboard.press("Escape");
  const menuClosed = await page.locator(".menu-toggle").getAttribute("aria-expanded");

  await page.getByRole("button", { name: "Fasādes", exact: true }).click();
  const filterState = await page.locator("[data-category]").evaluateAll((cards) => cards.map((card) => ({ category: card.dataset.category, hidden: card.hidden })));
  await page.getByRole("button", { name: "Visi darbi", exact: true }).click();

  await page.locator("[data-project='house']").click();
  const singleGalleryHidden = await page.locator("[data-dialog-controls]").isVisible();
  await page.locator("[data-dialog-close]").click();
  await page.locator("[data-project='facade']").click();
  const firstFacadeSource = await page.locator("[data-dialog-image]").getAttribute("src");
  await page.locator("[data-gallery-next]").click();
  const secondFacadeSource = await page.locator("[data-dialog-image]").getAttribute("src");
  await page.locator("[data-dialog-close]").click();

  await page.locator("#contact-form").scrollIntoViewIfNeeded();
  await page.locator("#contact-form button[type='submit']").click();
  const emptyFormStatus = await page.locator(".form-status").innerText();
  await page.locator("#contact-form input[name='name']").fill("Test");
  await page.locator("#contact-form input[name='phone']").fill("<script>alert(1)</script>");
  await page.locator("#contact-form select[name='project']").selectOption({ label: "Mājas būvniecība" });
  await page.locator("#contact-form button[type='submit']").click();
  const hostileFormStatus = await page.locator(".form-status").innerText();
  const injectedScripts = await page.locator("#contact-form script").count();

  const viewports = [[320,800],[360,800],[390,844],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080]];
  const results = [];
  fs.mkdirSync("reports/screenshots", { recursive: true });
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto("http://127.0.0.1:4176/", { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    const result = await page.evaluate(() => {
      const smallTargets = [...document.querySelectorAll("a,button,input,select,textarea")]
        .filter((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
        })
        .map((node) => ({ text: node.textContent?.trim().slice(0,30), tag: node.tagName, width: Math.round(node.getBoundingClientRect().width), height: Math.round(node.getBoundingClientRect().height) }));
      return {
        viewport: `${innerWidth}x${innerHeight}`,
        overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
        smallTargets,
        h1: document.querySelector("h1")?.innerText.replace(/\n/g, " "),
        visibleProjectCards: [...document.querySelectorAll("[data-category]")].filter((card) => !card.hidden).length
      };
    });
    results.push(result);
    if ([[320,800],[390,844],[1280,720],[1440,900]].some(([w,h]) => w === width && h === height)) {
      await page.screenshot({ path: `reports/screenshots/hero-${width}x${height}.png`, fullPage: false });
    }
  }

  const externalAssets = await Promise.all([
    "https://woodenlays.lv/",
    "https://wa.link/1q2208"
  ].map(async (url) => {
    const response = await page.request.get(url, { maxRedirects: 8 });
    return { url, status: response.status() };
  }));

  console.log(JSON.stringify({
    interactions: { menuOpen, menuClosed, filterState, singleGalleryVisible: singleGalleryHidden, facadeImageChanged: firstFacadeSource !== secondFacadeSource, emptyFormStatus, hostileFormStatus, injectedScripts },
    results,
    externalAssets,
    errors,
    failedRequests
  }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
