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
    try {
      await overlay.click({ force: true, timeout: 2000 });
    } catch {
      await page.mouse.click(Math.max(980, width + 180), 140).catch(() => {});
    }
    await expect(overlay).toBeHidden({ timeout: 5000 }).catch(() => {});
  }
};

for (const viewport of viewports) {
  test.describe(`Admin UI ${viewport.name}`, () => {
    test.use({ viewport });

    test("admin dashboard shows core sections", async ({ page }) => {
      await mockAdminApi(page);
      await page.goto("/admin", { waitUntil: "domcontentloaded" });

      await expect(page.getByRole("main")).toBeVisible({ timeout: 15000 });
      await clickAdminNav(page, viewport.width, "contact");
      await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
      await clickAdminNav(page, viewport.width, "home");
      await expect(page.getByRole("main")).toBeVisible({ timeout: 10000 });
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
        name: `Sản phẩm ${id}`,
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

  test("uses hover-expand sidebar and hides header density/refresh controls", async ({ page }) => {
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

    await expect(page.getByTestId("admin-density-toggle")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /làm mới dữ liệu/i })).toHaveCount(0);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("aside").getByTestId("admin-nav-rail")).toBeVisible();
    await expect(page.getByTestId("admin-density-toggle")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /làm mới dữ liệu/i })).toHaveCount(0);
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
    await expect(main.getByTestId("admin-overview-order-status")).toContainText(/Chờ xử lý|Đã xác nhận|Đang vận chuyển|Hoàn tất|Đã hủy/i);
    await expect(main.getByTestId("admin-overview-payment-status")).toContainText(/Chờ thanh toán|Đã gửi chứng từ|Đã thanh toán|Bị từ chối/i);

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

    await expect(main.getByText(/Tải lên nhanh/i)).toHaveCount(0);
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

  test("supports spotlight edit with autosave draft and publish", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, "home");
    const main = page.getByRole("main");
    await main.getByTestId("admin-home-edit-spotlight-content-0").click();
    const dialog = page.getByRole("dialog");
    await dialog.getByTestId("admin-spotlight-select").selectOption("0");

    const draftRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      const pathname = new URL(request.url()).pathname;
      if (!/\/api\/admin\/pages\/\d+$/.test(pathname)) {
        return false;
      }
      const payload = (request.postDataJSON() || {}) as { save_mode?: string };
      return payload.save_mode === "draft";
    });

    await dialog.getByTestId("admin-spotlight-title-input").fill("Block clone test");
    await draftRequestPromise;
    await page.keyboard.press("Escape");

    const publishRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      const pathname = new URL(request.url()).pathname;
      if (!/\/api\/admin\/pages\/\d+$/.test(pathname)) {
        return false;
      }
      const payload = (request.postDataJSON() || {}) as { save_mode?: string };
      return payload.save_mode === "publish";
    });

    await main.getByTestId("admin-home-publish").click();
    const saveRequest = await publishRequestPromise;
    const payload = (saveRequest.postDataJSON() || {}) as {
      content?: string;
      save_mode?: string;
    };
    expect(payload.content).toBeTruthy();
    expect(payload.save_mode).toBe("publish");

    const parsed = JSON.parse(payload.content || "{}") as {
      spotlights?: Array<{
        title?: string;
      }>;
    };
    expect(Array.isArray(parsed.spotlights)).toBeTruthy();
    expect(parsed.spotlights?.[0]?.title).toBe("Block clone test");
  });

  test("publishes dual intro CTA configuration", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, "home");
    const main = page.getByRole("main");
    await main.getByTestId("admin-home-edit-intro").click();
    const dialog = page.getByRole("dialog");

    await dialog.getByTestId("admin-intro-secondary-cta-label").fill("Tim hieu them moi");
    await dialog.getByTestId("admin-intro-secondary-cta-link").selectOption("/pages/about-us");
    await dialog.getByTestId("admin-intro-primary-cta-label").fill("Dat hang ngay moi");
    await dialog.getByTestId("admin-intro-primary-cta-link").selectOption("/collections/all");
    await page.keyboard.press("Escape");

    const saveRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      const pathname = new URL(request.url()).pathname;
      if (!/\/api\/admin\/pages\/\d+$/.test(pathname)) {
        return false;
      }
      const payload = (request.postDataJSON() || {}) as { save_mode?: string };
      return payload.save_mode === "publish";
    });

    await main.getByTestId("admin-home-publish").click();

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

  test("uses separated banner desktop/mobile images on publish", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, "home");
    const main = page.getByRole("main");
    await main.getByTestId("admin-home-edit-banners-0").click();
    const dialog = page.getByRole("dialog");

    await expect(dialog.getByTestId("admin-banner-image-desktop-url")).toHaveCount(1);
    await dialog.getByTestId("admin-banner-image-desktop-url").fill(
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80"
    );
    await dialog.getByTestId("admin-banner-image-desktop-apply-url").click();
    await dialog.getByTestId("admin-banner-image-mobile-url").fill(
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=720&q=80"
    );
    await dialog.getByTestId("admin-banner-image-mobile-apply-url").click();
    await page.keyboard.press("Escape");

    const saveRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      const pathname = new URL(request.url()).pathname;
      if (!/\/api\/admin\/pages\/\d+$/.test(pathname)) {
        return false;
      }
      const payload = (request.postDataJSON() || {}) as { save_mode?: string };
      return payload.save_mode === "publish";
    });

    await main.getByTestId("admin-home-publish").click();
    const saveRequest = await saveRequestPromise;
    const payload = (saveRequest.postDataJSON() || {}) as { content?: string };
    const parsed = JSON.parse(payload.content || "{}") as {
      banners?: Array<{ desktopSrc?: string; mobileSrc?: string }>;
    };
    expect(parsed.banners?.[0]?.desktopSrc).toBeTruthy();
    expect(parsed.banners?.[0]?.mobileSrc).toBeTruthy();
    expect(parsed.banners?.[0]?.desktopSrc).not.toBe(parsed.banners?.[0]?.mobileSrc);
  });

  test("localizes home editor labels and warns when eyebrow duplicates badge", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, "home");
    const main = page.getByRole("main");

    await expect(main.getByTestId("admin-home-edit-contact")).toContainText("Topbar & Liên hệ");
    await expect(main.getByText("Topbar & Lien he")).toHaveCount(0);

    await expect(main.getByTestId("admin-home-edit-banner-content")).toHaveCount(0);
    await expect(main.locator("[data-testid^='admin-home-edit-banner-content-']")).toHaveCount(0);
    await main.getByTestId("admin-home-edit-banners-0").click();
    const dialog = page.getByRole("dialog");

    await expect(dialog).toContainText("Sửa banner");
    await expect(dialog).toContainText("Chỉnh nội dung theo block và lưu nháp tự động.");
    await expect(dialog.getByText(/^Banner 1$/)).toBeVisible();
    await expect(dialog.getByText("Tiêu đề")).toBeVisible();
    await expect(dialog.getByText("Mô tả")).toBeVisible();
    await expect(dialog.getByText("Nhãn CTA")).toBeVisible();
    await expect(dialog.getByText("Liên kết CTA")).toBeVisible();
    await expect(dialog.getByText(/^Ảnh desktop$/)).toBeVisible();
    await expect(dialog.getByText(/^Ảnh mobile$/)).toBeVisible();
    await expect(dialog.getByText("Tieu de")).toHaveCount(0);
    await expect(dialog.getByText("Mo ta")).toHaveCount(0);
    await expect(dialog.getByTestId("admin-banner-select")).toHaveCount(0);
    await expect(dialog.getByText("Để trống sẽ fallback về ảnh desktop.")).toBeVisible();
    await expect(dialog.getByText("De trong se fallback ve anh desktop.")).toHaveCount(0);

    const duplicateIdentity = "CÔNG TY CỔ PHẦN NÔNG DƯỢC TAM BỐ";
    await dialog.getByTestId("admin-banner-eyebrow-input").fill(duplicateIdentity);
    await dialog.getByTestId("admin-banner-badge-input").fill(duplicateIdentity);
    await dialog.getByTestId("admin-banner-badge-input").blur();
    await expect(
      dialog.getByText(
        "Eyebrow đang trùng Badge. Nên dùng Eyebrow như thông điệp ngắn khác với định danh công ty."
      )
    ).toBeVisible();
    await page.keyboard.press("Escape");

  });

  test("locks banner preview to the selected banner while the editor is open", async ({
    page
  }) => {
    const previewBanners = [
      {
        id: "banner-preview-1",
        eyebrow: "CÔNG TY CỔ PHẦN NÔNG DƯỢC TAM BỐ",
        badge: "Banner 1",
        title: "Nông Dược Tam Bố",
        description: "Giải pháp sinh học đồng hành cùng nhà nông bền vững.",
        ctaLabel: "Khám phá sản phẩm",
        ctaHref: "/collections/all",
        desktopSrc:
          "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1400&q=80",
        mobileSrc:
          "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=720&q=80",
        alt: "Nông Dược Tam Bố",
        order: 1,
        isActive: true
      },
      {
        id: "banner-preview-2",
        eyebrow: "CÔNG TY CỔ PHẦN NÔNG DƯỢC TAM BỐ",
        badge: "Banner 2",
        title: "Giải pháp sinh học",
        description: "Tối ưu dinh dưỡng và cải thiện năng suất canh tác.",
        ctaLabel: "Xem giải pháp",
        ctaHref: "/collections/all",
        desktopSrc:
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80",
        mobileSrc:
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=720&q=80",
        alt: "Giải pháp sinh học",
        order: 2,
        isActive: true
      },
      {
        id: "banner-preview-3",
        eyebrow: "CÔNG TY CỔ PHẦN NÔNG DƯỢC TAM BỐ",
        badge: "Banner 3",
        title: "Đồng hành cùng nhà nông",
        description: "Tư vấn kỹ thuật tại vườn và hỗ trợ vận hành 24/7.",
        ctaLabel: "Liên hệ tư vấn",
        ctaHref: "/pages/lien-he",
        desktopSrc:
          "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80",
        mobileSrc:
          "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=720&q=80",
        alt: "Đồng hành cùng nhà nông",
        order: 3,
        isActive: true
      }
    ];

    await mockAdminApi(page, {
      pages: [
        {
          id: 6,
          title: "Trang chủ",
          slug: "home",
          content: JSON.stringify({ banners: previewBanners }),
          draft_content: JSON.stringify({ banners: previewBanners }),
          updated_at: "2024-06-01T08:00:00Z"
        }
      ]
    });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, "home");
    const main = page.getByRole("main");

    const bannerEditButtons = main.locator("[data-testid^='admin-home-edit-banners-']");
    await expect(bannerEditButtons).toHaveCount(3);
    await bannerEditButtons.nth(1).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/^Banner 2$/)).toBeVisible();
    await expect(dialog.getByTestId("admin-banner-title-input")).toHaveValue("Giải pháp sinh học");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    const track = main.locator(".home-slider__track");
    const initialScrollLeft = await track.evaluate((node) =>
      Math.round((node as HTMLDivElement).scrollLeft)
    );
    expect(initialScrollLeft).toBeGreaterThan(0);

    const trackLockState = await track.evaluate((node) => {
      const styles = window.getComputedStyle(node as HTMLElement);
      return {
        overflowX: styles.overflowX,
        pointerEvents: styles.pointerEvents
      };
    });
    expect(trackLockState.overflowX).toBe("hidden");
    expect(trackLockState.pointerEvents).toBe("none");
  });

  test("blocks storefront navigation inside admin home canvas and removes legacy tabs", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, "home");
    const main = page.getByRole("main");

    await expect(main.locator("[data-testid^='admin-home-tab-']")).toHaveCount(0);
    await expect(page).toHaveURL(/\/admin$/);

    await main
      .locator(".footer-main a[href='/pages/about-us']")
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("autosaves footer contact into home draft payload", async ({ page }) => {
    await mockAdminApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await clickAdminNav(page, 1024, "home");
    const main = page.getByRole("main");
    const contactBox = main.getByTestId("admin-home-footer-contact");

    const draftRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      const pathname = new URL(request.url()).pathname;
      if (!/\/api\/admin\/pages\/\d+$/.test(pathname)) {
        return false;
      }
      const payload = (request.postDataJSON() || {}) as { save_mode?: string };
      return payload.save_mode === "draft";
    });

    await contactBox.getByTestId("admin-home-footer-phone").click();
    const phoneInput = contactBox.getByTestId("admin-home-footer-phone-input");
    await phoneInput.fill("0909 000 111");
    await phoneInput.blur();

    const draftRequest = await draftRequestPromise;
    const payload = (draftRequest.postDataJSON() || {}) as { content?: string };
    const parsed = JSON.parse(payload.content || "{}") as {
      contactSettings?: { phone?: string };
    };
    expect(parsed.contactSettings?.phone).toBe("0909 000 111");

    await page.reload({ waitUntil: "domcontentloaded" });
    await clickAdminNav(page, 1024, "home");
    await expect(page.getByRole("main").getByTestId("admin-home-footer-phone")).toContainText("0909 000 111");
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
    await expect(main.getByTestId("admin-order-quick-payment-20")).toHaveClass(
      /border-green-200|border-amber-200|border-red-200|border-slate-200/
    );
    await expect(main.getByTestId("admin-order-quick-status-20")).toHaveClass(
      /border-green-200|border-blue-200|border-amber-200|border-red-200|border-slate-200/
    );

    const quickStatusRequestPromise = page.waitForRequest((request) => {
      if (request.method() !== "PATCH") {
        return false;
      }
      return /\/api\/admin\/orders\/20$/.test(new URL(request.url()).pathname);
    });
    await main.getByTestId("admin-order-quick-status-20").click();
    await page.getByRole("option", { name: "Đã xác nhận" }).click();
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
