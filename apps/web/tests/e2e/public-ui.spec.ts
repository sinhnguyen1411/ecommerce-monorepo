import { expect, test } from "@playwright/test";

import { seedContentStorage, viewports } from "./helpers";

for (const viewport of viewports) {
  test.describe(`Public UI ${viewport.name}`, () => {
    test.use({ viewport });

    test("home shows banner and hero content", async ({ page }) => {
      await seedContentStorage(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const slider = page.locator(".home-slider");
      await expect(slider.getByText("Banner nổi bật").first()).toBeVisible();
      await expect(
        slider.getByRole("heading", { name: "Nông Dược Tam Bố" }).first()
      ).toBeVisible();
    });

    test("contact shows seeded information", async ({ page }) => {
      await seedContentStorage(page);
      await page.goto("/pages/lien-he", { waitUntil: "domcontentloaded" });

      await expect(
        page.getByRole("heading", { name: "Thông tin liên hệ" })
      ).toBeVisible();
      const contactPanel = page.locator(".contact-info");
      await expect(contactPanel.getByText("0900 111 222")).toBeVisible();
      await expect(contactPanel.getByText("123 Đường Nông Nghiệp")).toBeVisible();
    });

    test("admin login renders form", async ({ page }) => {
      await page.goto("/admin/login", { waitUntil: "domcontentloaded" });

      await expect(
        page.getByRole("heading", { name: "Đăng nhập quản trị" })
      ).toBeVisible();
      await expect(page.getByLabel("Email đăng nhập")).toBeVisible();
      await expect(page.getByLabel("Mật khẩu")).toBeVisible();
    });
  });
}
