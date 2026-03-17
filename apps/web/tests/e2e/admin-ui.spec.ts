import { expect, test } from "@playwright/test";

import { mockAdminApi, viewports } from "./helpers";

const openAdminNavIfCollapsed = async (page: any, width: number) => {
  if (width < 1024) {
    const menuButton = page.getByRole("button", { name: /menu admin/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
  }
};

const clickAdminNav = async (page: any, width: number, navId: string) => {
  await openAdminNavIfCollapsed(page, width);
  const testId = `admin-nav-${navId}`;

  if (width < 1024) {
    const sheet = page.getByRole("dialog");
    const navButton = sheet.getByTestId(testId);
    await navButton.waitFor();
    await navButton.click();
    await page.keyboard.press("Escape");
    await sheet.waitFor({ state: "hidden" });
    return;
  }

  const navButton = page.locator("aside").getByTestId(testId);
  await navButton.waitFor();
  await navButton.click();
  const overlay = page.getByTestId("admin-sidebar-overlay");
  await page.mouse.move(Math.max(980, width + 180), 140);
  await page.waitForTimeout(220);
  if (await overlay.isVisible().catch(() => false)) {
    await overlay.click({ force: true });
    await expect(overlay).toBeHidden();
  }
};

for (const viewport of viewports) {
  test.describe(`Admin UI ${viewport.name}`, () => {
    test.use({ viewport });

    test("admin dashboard shows core sections", async ({ page }) => {
      await mockAdminApi(page);
      await page.goto("/admin", { waitUntil: "domcontentloaded" });

      if (viewport.width >= 1024) {
        await expect(
          page.locator("aside").getByRole("heading", { name: /admin/i })
        ).toBeVisible();
      }
      await expect(page.getByRole("main")).toBeVisible();
      await clickAdminNav(page, viewport.width, "contact");
      await expect(page.getByRole("main")).toBeVisible();
      await clickAdminNav(page, viewport.width, "home");
      await expect(page.getByRole("main")).toBeVisible();
    });
  });
}

test.describe("Admin UI data flows", () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test("filters and paginates products", async ({ page }) => {
    const categories = [
      {
        id: 1,
        name: "Huu co",
        slug: "huu-co",
        description: "Nhom san pham huu co",
        sort_order: 1
      },
      {
        id: 2,
        name: "Vi sinh",
        slug: "vi-sinh",
        description: "Nhom san pham vi sinh",
        sort_order: 2
      }
    ];

    const products = Array.from({ length: 8 }, (_, index) => {
      const id = index + 1;
      const category = categories[index % categories.length];
      return {
        id,
        name: `SÃƒÂ¡Ã‚ÂºÃ‚Â£n phÃƒÂ¡Ã‚ÂºÃ‚Â©m ${id}`,
        slug: `san-pham-${id}`,
        description: "Mo ta ngan",
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

    await clickAdminNav(page, 1024, "products");
    const section = page.getByRole("main");

    const statusSelect = section.getByTestId("admin-products-filter-status");
    const categorySelect = section.getByTestId("admin-products-filter-category");

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

  test("reorders admin menu and persists after reload", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    const aside = page.locator("aside");
    await expect(aside.getByRole("heading", { name: /admin/i })).toBeVisible();
    const navList = aside.locator("div.space-y-1");
    await expect(navList).toBeVisible();
    const navBox = await navList.boundingBox();
    const sortBox = await aside.getByTestId("admin-nav-sort-toggle").boundingBox();
    expect(navBox).not.toBeNull();
    expect(sortBox).not.toBeNull();
    if (navBox && sortBox) {
      expect(sortBox.y).toBeGreaterThan(navBox.y + navBox.height - 1);
    }

    await page.getByTestId("admin-nav-sort-toggle").click();
    await expect(page.getByTestId("admin-nav-sort-item-overview")).toContainText(/C/i);

    await page.getByTestId("admin-nav-sort-move-down-home").click();
    await expect(page.getByTestId("admin-nav-sort-item-products")).toBeVisible();

    await page
      .getByTestId("admin-nav-sort-drag-orders")
      .dragTo(page.getByTestId("admin-nav-sort-item-products"));

    await page.getByTestId("admin-nav-sort-save").click();

    const normalNavButtons = aside.locator("div.space-y-1 > button");
    await expect(normalNavButtons.nth(1)).toHaveAttribute("data-testid", "admin-nav-orders");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(aside.locator("div.space-y-1 > button").nth(1)).toHaveAttribute(
      "data-testid",
      "admin-nav-orders"
    );
  });

  test("uses hover-expand sidebar and persists density preferences", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    const aside = page.locator("aside");
    await expect(page.getByTestId("admin-sidebar-collapse-toggle-header")).toHaveCount(0);
    await expect(page.getByTestId("admin-sidebar-collapse-toggle")).toHaveCount(0);
    await expect(aside).toContainText(/ADMIN/i);
    await expect(aside).not.toContainText(/Bang dieu khien/i);
    await expect(page.getByRole("banner")).toContainText(/TAM/i);
    await expect(aside.getByTestId("admin-nav-rail")).toBeVisible();

    await aside.hover();
    await expect(aside.getByTestId("admin-nav-full")).toBeVisible();
    const overlay = page.getByTestId("admin-sidebar-overlay");
    await expect(overlay).toBeVisible();

    await aside.getByTestId("admin-nav-products").click();
    await expect(aside.getByTestId("admin-nav-full")).toBeVisible();

    await page.mouse.move(1200, 200);
    await expect(aside.getByTestId("admin-nav-rail")).toBeVisible();

    const densityReqPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      return /\/api\/admin\/me\/preferences$/.test(new URL(request.url()).pathname);
    });
    await page.getByTestId("admin-density-toggle").click();
    const densityReq = await densityReqPromise;
    const densityPayload = (densityReq.postDataJSON() || {}) as {
      ui_preferences?: { density?: string };
    };
    expect(densityPayload.ui_preferences?.density).toBe("comfortable");
    await expect(page.getByTestId("admin-density-toggle")).toContainText(/Tho/i);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("aside").getByTestId("admin-nav-rail")).toBeVisible();
    await expect(page.getByTestId("admin-density-toggle")).toContainText(/Tho/i);
  });

  test("renders overview charts and removes quick upload block", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    const main = page.getByRole("main");
    const grainSelect = main.getByTestId("admin-overview-grain");
    await expect(grainSelect).toBeVisible();
    await expect(main.getByTestId("admin-overview-orders-chart")).toBeVisible();
    await expect(main.getByTestId("admin-overview-visits-chart")).toBeVisible();
    await expect(main.getByTestId("admin-overview-order-status")).toBeVisible();
    await expect(main.getByTestId("admin-overview-payment-status")).toBeVisible();
    await expect(main.getByTestId("admin-overview-top-products")).toBeVisible();
    await expect(main.getByTestId("admin-overview-recent-orders")).toBeVisible();

    const monthRequest = page.waitForRequest((request) => {
      if (request.method() !== "GET") {
        return false;
      }
      const url = new URL(request.url());
      return (
        url.pathname.endsWith("/api/admin/dashboard") &&
        url.searchParams.get("grain") === "month"
      );
    });
    await grainSelect.selectOption("month");
    await monthRequest;

    await expect(main.getByText(/Tai len nhanh/i)).toHaveCount(0);
  });

  test("closes mobile admin sheet after nav selection", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    const menuButton = page.getByRole("button", { name: /menu admin/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await sheet.getByTestId("admin-nav-products").click();
    await expect(sheet).toBeHidden();
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

    await clickAdminNav(page, 1024, "products");
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

    await clickAdminNav(page, 1024, "home");
    const main = page.getByRole("main");
    await main.getByTestId("admin-home-tab-spotlights").click();

    const cards = main.getByTestId("admin-spotlight-card");
    await expect(cards).toHaveCount(2);

    const secondTitle = await cards.nth(1).locator("input").first().inputValue();

    await main.getByTestId("admin-spotlight-add").click();
    await expect(cards).toHaveCount(3);
    const clonedTitleInput = cards.nth(2).locator("input").first();
    await expect(clonedTitleInput).toHaveValue(/B.*sao/);

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

  test("saves dual intro CTA configuration", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, "home");
    const main = page.getByRole("main");
    await main.getByTestId("admin-home-tab-intro").click();

    await main.getByTestId("admin-intro-secondary-cta-label").fill("Tim hieu them moi");
    await main.getByTestId("admin-intro-secondary-cta-link").fill("/pages/about-us");
    await main.getByTestId("admin-intro-primary-cta-label").fill("Dat hang ngay moi");
    await main.getByTestId("admin-intro-primary-cta-link").fill("/collections/all");

    const saveRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      const pathname = new URL(request.url()).pathname;
      return /\/api\/admin\/pages\/\d+$/.test(pathname);
    });

    await main.getByTestId("admin-home-save-intro").click();

    const saveRequest = await saveRequestPromise;
    const payload = (saveRequest.postDataJSON() || {}) as { content?: string };
    expect(payload.content).toBeTruthy();

    const parsed = JSON.parse(payload.content || "{}") as {
      intro?: {
        primaryCtaLabel?: string;
        primaryCtaHref?: string;
        secondaryCtaLabel?: string;
        secondaryCtaHref?: string;
      };
    };
    expect(parsed.intro?.secondaryCtaLabel).toBe("Tim hieu them moi");
    expect(parsed.intro?.secondaryCtaHref).toBe("/pages/about-us");
    expect(parsed.intro?.primaryCtaLabel).toBe("Dat hang ngay moi");
    expect(parsed.intro?.primaryCtaHref).toBe("/collections/all");
  });

  test("shows error when admin data load fails", async ({ page }) => {
    await mockAdminApi(page, { failPaths: ["/api/admin/products"] });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page.locator("main .border-rose-200")).toBeVisible();
  });

  test("renders orders as list rows and updates via detail panel", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, "orders");
    const main = page.getByRole("main");
    const orderRow = main.getByTestId("admin-order-row-20");

    await expect(orderRow).toBeVisible();
    await expect(main.getByTestId("admin-order-detail-20")).toHaveCount(0);
    await expect(main.getByTestId("admin-order-toggle-20")).toHaveAttribute(
      "aria-label",
      /chi/i
    );

    const quickStatusRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      return /\/api\/admin\/orders\/20$/.test(new URL(request.url()).pathname);
    });
    await main.getByTestId("admin-order-quick-status-20").selectOption("confirmed");
    const quickStatusRequest = await quickStatusRequestPromise;
    const quickStatusPayload = (quickStatusRequest.postDataJSON() || {}) as {
      status?: string;
    };
    expect(quickStatusPayload.status).toBe("confirmed");

    await main.getByTestId("admin-order-toggle-20").click();
    const detail = main.getByTestId("admin-order-detail-20");
    await expect(detail).toBeVisible();
    await expect(detail.getByTestId("admin-order-save-20")).toHaveCount(0);

    await detail.getByTestId("admin-order-phone-20").fill("0900123456");

    const saveRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      return /\/api\/admin\/orders\/20$/.test(new URL(request.url()).pathname);
    });

    await detail.getByTestId("admin-order-phone-20").blur();
    const saveRequest = await saveRequestPromise;
    const payload = (saveRequest.postDataJSON() || {}) as { phone?: string };
    expect(payload.phone).toBe("0900123456");
    await expect(detail.getByTestId("admin-order-save-state-20")).toContainText(
      /Đang lưu|Đã lưu|Lưu thất bại|Dang luu|Da luu|Luu that bai/i
    );
  });
});
