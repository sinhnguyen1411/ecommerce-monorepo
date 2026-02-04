import { expect, test } from "@playwright/test";

import { mockAdminApi, viewports } from "./helpers";

const openAdminNavIfCollapsed = async (page: any, width: number) => {
  if (width < 1024) {
    const menuButton = page.getByRole("button", { name: "Mở menu admin" });
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
  }
};

const clickAdminNav = async (page: any, width: number, label: string) => {
  await openAdminNavIfCollapsed(page, width);

  if (width < 1024) {
    const sheet = page.getByRole("dialog");
    const navButton = sheet.getByRole("button", { name: label });
    await navButton.waitFor();
    await navButton.click();
    await page.keyboard.press("Escape");
    await sheet.waitFor({ state: "hidden" });
    return;
  }

  const navButton = page.locator("aside").getByRole("button", { name: label });
  await navButton.waitFor();
  await navButton.click();
};

for (const viewport of viewports) {
  test.describe(`Admin UI ${viewport.name}`, () => {
    test.use({ viewport });

    test("admin dashboard shows core sections", async ({ page }) => {
      await mockAdminApi(page);
      await page.goto("/admin", { waitUntil: "domcontentloaded" });

      await expect(page.getByText("Hành động nhanh")).toBeVisible();
      await expect(page.getByText("Thông báo hệ thống")).toBeVisible();

      const main = page.getByRole("main");
      await clickAdminNav(page, viewport.width, "Liên hệ");
      await expect(
        main.getByRole("heading", { name: "Thông tin liên hệ" })
      ).toBeVisible();

      await clickAdminNav(page, viewport.width, "Banner trang chủ");
      await expect(
        main.getByRole("heading", { name: "Banner trang chủ" })
      ).toBeVisible();
    });
  });
}

test.describe("Admin UI data flows", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test("filters and paginates products", async ({ page }) => {
    const categories = [
      {
        id: 1,
        name: "Hữu cơ",
        slug: "huu-co",
        description: "Nhóm sản phẩm hữu cơ",
        sort_order: 1
      },
      {
        id: 2,
        name: "Vi sinh",
        slug: "vi-sinh",
        description: "Nhóm sản phẩm vi sinh",
        sort_order: 2
      }
    ];

    const products = Array.from({ length: 8 }, (_, index) => {
      const id = index + 1;
      const category = categories[index % categories.length];
      return {
        id,
        name: `Sản phẩm ${id}`,
        slug: `san-pham-${id}`,
        description: "Mô tả ngắn",
        price: 100000 + id * 1000,
        compare_at_price: id % 2 === 0 ? 120000 + id * 1000 : null,
        featured: id === 1,
        status: id >= 7 ? "hidden" : "published",
        tags: "test",
        sort_order: id,
        images: [
          {
            id: id,
            url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=80",
            sort_order: 1
          }
        ],
        categories: [
          {
            id: category.id,
            name: category.name,
            slug: category.slug
          }
        ]
      };
    });

    await mockAdminApi(page, { products, categories });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, "Sản phẩm");
    const section = page
      .locator("div")
      .filter({ has: page.getByRole("heading", { name: "Quản lý sản phẩm" }) })
      .first();

    await section.getByLabel("Trạng thái").selectOption("hidden");
    await section.getByLabel("Danh mục").selectOption("2");
    await expect(section.getByText("Sản phẩm 8")).toBeVisible();
    await expect(section.getByText("Sản phẩm 7")).not.toBeVisible();

    await section.getByLabel("Trạng thái").selectOption("");
    await section.getByLabel("Danh mục").selectOption("");

    const pageTwo = section.getByRole("button", { name: "2", exact: true });
    await expect(pageTwo).toBeVisible();
    await pageTwo.click();
    await expect(section.getByText("Sản phẩm 7")).toBeVisible();
    await expect(section.getByText("Sản phẩm 1")).not.toBeVisible();
  });

  test("shows error when admin data load fails", async ({ page }) => {
    await mockAdminApi(page, { failPaths: ["/api/admin/products"] });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Không thể tải dữ liệu quản trị.")).toBeVisible();
  });
});
