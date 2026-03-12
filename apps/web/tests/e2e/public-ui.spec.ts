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
