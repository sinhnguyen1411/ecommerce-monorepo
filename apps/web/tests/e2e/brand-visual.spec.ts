import { expect, test, type Page } from "@playwright/test";

import { seedContentStorage } from "./helpers";

async function gotoStable(page: Page, url: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

test.describe("Brand visual polish", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test("logo keeps clean transparent edges across key brand surfaces", async ({ page }) => {
    await seedContentStorage(page);

    await gotoStable(page, "/");

    await page.evaluate(() => {
      const headerBrand = document.querySelector('[data-testid="site-header-brand"]');
      if (headerBrand instanceof HTMLElement) {
        headerBrand.style.padding = "6px 10px";
        headerBrand.style.borderRadius = "18px";
        headerBrand.style.background =
          "linear-gradient(135deg, rgba(229,241,229,0.98), rgba(244,236,204,0.98))";
      }
    });

    const headerLogo = page.getByTestId("site-header-brand").locator("img");
    await expect.poll(async () => {
      return headerLogo.evaluate((node) => {
        const img = node as HTMLImageElement;
        return img.complete && img.naturalWidth > 0;
      });
    }).toBeTruthy();

    await expect(headerLogo).toHaveScreenshot("header-brand.png", {
      animations: "disabled",
      caret: "hide",
      scale: "css"
    });

    const footerBrand = page.getByTestId("site-footer-brand");
    await footerBrand.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const footerBrand = document.querySelector('[data-testid="site-footer-brand"]');
      if (footerBrand instanceof HTMLElement) {
        footerBrand.style.padding = "4px 6px";
        footerBrand.style.borderRadius = "16px";
        footerBrand.style.background = "rgba(17, 41, 24, 0.18)";
      }
    });

    const footerLogo = footerBrand.locator("img");
    await expect.poll(async () => {
      return footerLogo.evaluate((node) => {
        const img = node as HTMLImageElement;
        return img.complete && img.naturalWidth > 0;
      });
    }).toBeTruthy();

    await expect(footerLogo).toHaveScreenshot("footer-brand.png", {
      animations: "disabled",
      caret: "hide",
      scale: "css"
    });

    await gotoStable(page, "/pages/about-us");

    await page.evaluate(() => {
      const heroSeal = document.querySelector(".about-hero-seal");
      if (heroSeal instanceof HTMLElement) {
        heroSeal.style.padding = "6px";
        heroSeal.style.borderRadius = "999px";
        heroSeal.style.background =
          "radial-gradient(circle at center, rgba(244,248,236,0.88), rgba(255,255,255,0.08) 72%)";
      }
    });

    const heroSealLogo = page.locator(".about-hero-seal img");
    await expect.poll(async () => {
      return heroSealLogo.evaluate((node) => {
        const img = node as HTMLImageElement;
        return img.complete && img.naturalWidth > 0;
      });
    }).toBeTruthy();

    await expect(heroSealLogo).toHaveScreenshot("about-hero-seal.png", {
      animations: "disabled",
      caret: "hide",
      scale: "css"
    });
  });
});
