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

const clickAdminNav = async (page: any, width: number, label: string | RegExp) => {
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

      await clickAdminNav(page, viewport.width, /Trang chủ/i);
      await expect(
        main.getByRole("heading", { name: "Trang chủ", exact: true })
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

    const statusSelect = section.locator("select").first();
    const categorySelect = section.locator("select").nth(1);

    await statusSelect.selectOption("hidden");
    await categorySelect.selectOption("2");
    await expect(section.getByText("/san-pham-8")).toBeVisible();
    await expect(section.getByText("/san-pham-7")).not.toBeVisible();

    await statusSelect.selectOption("");
    await categorySelect.selectOption("");

    const pageTwo = section.getByRole("button", { name: "2", exact: true });
    await expect(pageTwo).toBeVisible();
    await pageTwo.click();
    await expect(section.getByText("/san-pham-7")).toBeVisible();
    await expect(section.getByText("/san-pham-1")).not.toBeVisible();
  });

  test("opens product dialogs when editing and creating", async ({ page }) => {
    const categories = [
      {
        id: 1,
        name: "Category A",
        slug: "category-a",
        description: "Category A",
        sort_order: 1
      }
    ];

    const products = [
      {
        id: 1,
        name: "Product A",
        slug: "product-a",
        description: "Short description",
        price: 100000,
        compare_at_price: null,
        featured: false,
        status: "published",
        tags: "test",
        sort_order: 1,
        images: [
          {
            id: 1,
            url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=80",
            sort_order: 1
          },
          {
            id: 2,
            url: "",
            sort_order: 2
          }
        ],
        categories: [
          {
            id: 1,
            name: "Category A",
            slug: "category-a"
          }
        ]
      }
    ];

    await mockAdminApi(page, { products, categories });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await page
      .locator("aside")
      .getByRole("button", { name: /Sản phẩm/i })
      .click();
    const main = page.getByRole("main");

    await main.getByTestId("admin-product-edit-1").click();
    const editDialog = page.getByRole("dialog").last();
    await expect(editDialog).toBeVisible();
    await expect(editDialog).toBeInViewport();
    await expect(editDialog.locator("input").first()).toHaveValue("Product A");

    await page.keyboard.press("Escape");
    await expect(editDialog).toBeHidden();

    await main.getByTestId("admin-product-create").click();
    const createDialog = page.getByRole("dialog").last();
    await expect(createDialog).toBeVisible();
    await expect(createDialog).toBeInViewport();
    await expect(createDialog.locator("input").first()).toHaveValue("");
  });

  test("supports spotlight CRUD and reorder with manual save", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, /Trang chủ/i);
    const main = page.getByRole("main");
    await main.getByRole("button", { name: "Banner sản phẩm", exact: true }).click();

    const cards = main.getByTestId("admin-spotlight-card");
    await expect(cards).toHaveCount(2);

    const secondTitle = await cards.nth(1).locator("input").first().inputValue();

    await main.getByTestId("admin-spotlight-add").click();
    await expect(cards).toHaveCount(3);
    const clonedTitleInput = cards.nth(2).locator("input").first();
    await expect(clonedTitleInput).toHaveValue(`${secondTitle} (Bản sao)`);

    await clonedTitleInput.fill("Block clone test");
    await expect(clonedTitleInput).toHaveValue("Block clone test");

    await main.getByTestId("admin-spotlight-move-up-2").click();
    await expect(cards.nth(1).locator("input").first()).toHaveValue("Block clone test");

    await main.getByTestId("admin-spotlight-drag-1").dragTo(cards.nth(0));
    await expect(cards.nth(0).locator("input").first()).toHaveValue("Block clone test");

    page.once("dialog", (dialog) => {
      void dialog.accept();
    });
    await main.getByTestId("admin-spotlight-delete-2").click();
    await expect(cards).toHaveCount(2);

    page.once("dialog", (dialog) => {
      void dialog.accept();
    });
    await main.getByTestId("admin-spotlight-delete-1").click();
    await expect(cards).toHaveCount(1);

    await expect(main.getByTestId("admin-spotlight-delete-0")).toBeDisabled();
    await expect(main.getByText("Tối thiểu 1 block.")).toBeVisible();

    const saveRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      const pathname = new URL(request.url()).pathname;
      return /\/api\/admin\/pages\/\d+$/.test(pathname);
    });

    await main.getByTestId("admin-spotlight-save").click();

    const saveRequest = await saveRequestPromise;
    const payload = (saveRequest.postDataJSON() || {}) as { content?: string };
    expect(payload.content).toBeTruthy();

    const parsed = JSON.parse(payload.content || "{}") as {
      spotlights?: Array<{ title?: string }>;
    };
    expect(Array.isArray(parsed.spotlights)).toBeTruthy();
    expect(parsed.spotlights?.length).toBe(1);
    expect(parsed.spotlights?.[0]?.title).toBe("Block clone test");
  });

  test("shows error when admin data load fails", async ({ page }) => {
    await mockAdminApi(page, { failPaths: ["/api/admin/products"] });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page.locator("main .border-rose-200")).toBeVisible();
  });
});
