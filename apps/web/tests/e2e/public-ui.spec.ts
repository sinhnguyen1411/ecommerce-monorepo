import { expect, test } from "@playwright/test";

import { seedContentStorage, viewports } from "./helpers";

for (const viewport of viewports) {
  test.describe(`Public UI ${viewport.name}`, () => {
    test.use({ viewport });

    test("home shows banner and hero content", async ({ page }) => {
      await seedContentStorage(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const slider = page.locator(".home-slider");
      await expect(slider).toBeVisible();
      await expect(slider.locator(".home-slide").first()).toBeVisible();
    });

    test("home intro shows dual CTA and no horizontal overflow", async ({ page }) => {
      await seedContentStorage(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const introSection = page.locator(".section-home-introduce");
      await expect(introSection).toBeVisible();
      const secondaryCta = introSection.getByTestId("home-intro-secondary-cta");
      const primaryCta = introSection.getByTestId("home-intro-primary-cta");
      await expect(secondaryCta).toBeVisible();
      await expect(primaryCta).toBeVisible();
      await expect(secondaryCta).toHaveAttribute("href", "/pages/about-us");
      await expect(primaryCta).toHaveAttribute("href", "/collections/all");

      const introOverflow = await introSection.evaluate((node) => {
        const element = node as HTMLElement;
        return element.scrollWidth > element.clientWidth + 1;
      });
      expect(introOverflow).toBeFalsy();
    });

    test("contact shows seeded information", async ({ page }) => {
      await seedContentStorage(page);
      await page.goto("/pages/lien-he", { waitUntil: "domcontentloaded" });

      const contactPanel = page.locator(".contact-info");
      await expect(contactPanel).toBeVisible();
      await expect(contactPanel.getByText("0900 111 222")).toBeVisible();
    });

    test("admin login renders form", async ({ page }) => {
      await page.goto("/admin/login", { waitUntil: "domcontentloaded" });

      await expect(page.locator("form input").first()).toBeVisible();
      await expect(page.locator("form input").nth(1)).toBeVisible();
    });
  });
}
