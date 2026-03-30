import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { seedContentStorage, viewports } from "./helpers";

const spotlightStressContent = {
  banners: [],
  intro: {
    eyebrow: "Định hướng phát triển sản phẩm",
    title: "Nông Dược Tam Bố",
    headline: "Giải pháp cho tương lai thông minh",
    description: "Giới thiệu ngắn cho section đầu trang.",
    primaryCtaLabel: "Đặt hàng ngay",
    primaryCtaHref: "/collections/all",
    secondaryCtaLabel: "Tìm hiểu thêm",
    secondaryCtaHref: "/pages/about-us",
    imageSrc:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Nông Dược Tam Bố"
  },
  spotlights: [
    {
      id: "home-spotlight-1",
      title: "ORGANIC MASTER",
      description:
        "Phân bón hữu cơ giúp cải tạo đất, nuôi cây khỏe và tối ưu năng suất theo hướng canh tác bền vững.",
      bullets: [
        "OM 60% giúp cải tạo đất và tăng độ tơi xốp.",
        "Axit Fulvic 36% hỗ trợ hấp thụ dinh dưỡng nhanh.",
        "Amino Acid 26,5% tăng sức đề kháng cho cây."
      ],
      ctaLabel: "Xem chi tiết",
      ctaHref: "/collections/all",
      imageSrc:
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Organic Master"
    },
    {
      id: "home-spotlight-2",
      title: "MICROBIAL",
      description:
        "Chế phẩm vi sinh giúp cải thiện môi trường đất và hỗ trợ bộ rễ phát triển đều, khỏe, bền.",
      bullets: [
        "Tiêu diệt và ngăn chặn tuyến trùng hiệu quả.",
        "Cân bằng độ pH và cải tạo môi trường đất.",
        "Duy trì hệ vi sinh vật có lợi lâu dài."
      ],
      ctaLabel: "Xem chi tiết",
      ctaHref: "/collections/all",
      imageSrc:
        "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Microbial"
    },
    {
      id: "home-spotlight-3",
      title: "ORGANIC MASTER (Bản sao) (Bản sao)",
      description:
        "Block thử nghiệm thứ ba với phần mô tả dài hơn bình thường để xác nhận title, text, bullet và CTA vẫn khóa cùng quy cách hiển thị như hai block đầu, không nở card và không lệch hàng.",
      bullets: [
        "Bullet dài hơn bình thường để xác nhận chip vẫn giữ chiều cao đồng nhất và không đẩy nút CTA xuống thấp hơn các block khác.",
        "Nội dung thêm vài cụm mô tả để kiểm tra clamp hai dòng cho bullet trong tình huống admin tạo spotlight clone.",
        "Kiểm tra trường hợp dữ liệu lặp hậu tố bản sao nhưng layout vẫn nằm trong cùng khuôn hiển thị."
      ],
      ctaLabel: "Xem chi tiết",
      ctaHref: "/collections/all",
      imageSrc:
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Organic Master bản sao"
    }
  ],
  features: [
    {
      id: "home-feature-1",
      title: "FREESHIP TOÀN QUỐC",
      description: "Miễn phí vận chuyển cho các đơn đủ điều kiện."
    }
  ],
  aboutTeaser: {
    eyebrow: "Nông Dược Tam Bố",
    title: "Nông nghiệp hữu cơ bền vững",
    subtitle: "Giải pháp cho tương lai thông minh",
    primaryCtaLabel: "Liên hệ đặt hàng",
    primaryCtaHref: "/pages/lien-he",
    secondaryCtaLabel: "Tìm hiểu thêm",
    secondaryCtaHref: "/pages/locations"
  },
  promoPopup: {
    title: "Ưu đãi hôm nay",
    subtitle: "Xem lại ưu đãi và mã giảm giá",
    imageSrc:
      "https://images.unsplash.com/photo-1457530378978-8bac673b8062?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Ưu đãi",
    programs: [],
    coupons: [],
    ctaLabel: "Xem chi tiết",
    ctaHref: "/collections/all",
    isActive: true,
    delaySeconds: 2
  },
  notifications: {
    items: []
  }
};

async function stubHomeSpotlights(page: Page) {
  await page.route("**/api/pages/home", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: 12,
          title: "Trang chủ",
          slug: "home",
          content: JSON.stringify(spotlightStressContent)
        }
      })
    });
  });
}

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

    test("home spotlight keeps responsive order and no horizontal overflow", async ({ page }) => {
      const requireBox = async (locator: ReturnType<typeof page.locator>) => {
        let box = null as Awaited<ReturnType<typeof locator.boundingBox>>;
        await expect
          .poll(
            async () => {
              await locator.scrollIntoViewIfNeeded().catch(() => {});
              box = await locator.boundingBox();
              return box ? 1 : 0;
            },
            { timeout: 15000 }
          )
          .toBe(1);
        if (!box) {
          throw new Error("Expected spotlight geometry but no bounding box was found.");
        }
        return box;
      };
      const requireDocumentMetrics = async (
        locator: ReturnType<typeof page.locator>
      ): Promise<{ top: number; height: number }> => {
        let metrics: { top: number; height: number } | null = null;
        await expect
          .poll(
            async () => {
              metrics = await locator
                .evaluate((node) => {
                  const rect = (node as HTMLElement).getBoundingClientRect();
                  if (rect.width <= 0 || rect.height <= 0) {
                    return null;
                  }
                  return {
                    top: rect.top + window.scrollY,
                    height: rect.height
                  };
                })
                .catch(() => null);
              return metrics ? 1 : 0;
            },
            { timeout: 15000 }
          )
          .toBe(1);
        if (!metrics) {
          throw new Error("Expected spotlight geometry metrics but element was not measurable.");
        }
        return metrics;
      };

      await seedContentStorage(page);
      await stubHomeSpotlights(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const section = page.getByTestId("home-spotlight-section");
      await expect(section).toBeVisible();
      await expect(page.getByTestId("home-spotlight-0")).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("home-spotlight-1")).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("home-spotlight-2")).toBeVisible({ timeout: 15000 });

      const spotlightOverflow = await section.evaluate((node) => {
        const element = node as HTMLElement;
        return element.scrollWidth > element.clientWidth + 1;
      });
      expect(spotlightOverflow).toBeFalsy();

      const media0 = page.getByTestId("home-spotlight-media-0");
      const content0 = page.getByTestId("home-spotlight-content-0");
      const media1 = page.getByTestId("home-spotlight-media-1");
      const content1 = page.getByTestId("home-spotlight-content-1");
      const media2 = page.getByTestId("home-spotlight-media-2");
      const content2 = page.getByTestId("home-spotlight-content-2");

      await expect(media0).toBeVisible({ timeout: 15000 });
      await expect(content0).toBeVisible({ timeout: 15000 });
      await expect(media1).toBeVisible({ timeout: 15000 });
      await expect(content1).toBeVisible({ timeout: 15000 });
      await expect(media2).toBeVisible({ timeout: 15000 });
      await expect(content2).toBeVisible({ timeout: 15000 });

      await page.waitForTimeout(120);

      const media0Box = await requireBox(media0);
      const content0Box = await requireBox(content0);
      const media1Box = await requireBox(media1);
      const content1Box = await requireBox(content1);
      const media2Box = await requireBox(media2);
      const content2Box = await requireBox(content2);

      if (viewport.width >= 992) {
        const row0SameLine = Math.abs(media0Box.y - content0Box.y);
        const row1SameLine = Math.abs(media1Box.y - content1Box.y);
        const row2SameLine = Math.abs(media2Box.y - content2Box.y);
        expect(row0SameLine).toBeLessThanOrEqual(12);
        expect(row1SameLine).toBeLessThanOrEqual(12);
        expect(row2SameLine).toBeLessThanOrEqual(12);

        expect(Math.abs(media0Box.height - content0Box.height)).toBeLessThanOrEqual(12);
        expect(Math.abs(media1Box.height - content1Box.height)).toBeLessThanOrEqual(12);
        expect(Math.abs(media2Box.height - content2Box.height)).toBeLessThanOrEqual(12);

        expect(media0Box.x + 40).toBeLessThan(content0Box.x);
        expect(content1Box.x + 40).toBeLessThan(media1Box.x);
        expect(media2Box.x + 40).toBeLessThan(content2Box.x);
      } else {
        expect(media0Box.y + 40).toBeLessThan(content0Box.y);
        expect(media1Box.y + 40).toBeLessThan(content1Box.y);
        expect(media2Box.y + 40).toBeLessThan(content2Box.y);

        expect(Math.abs(media0Box.x - content0Box.x)).toBeLessThanOrEqual(12);
        expect(Math.abs(media1Box.x - content1Box.x)).toBeLessThanOrEqual(12);
        expect(Math.abs(media2Box.x - content2Box.x)).toBeLessThanOrEqual(12);
      }

      const spotlightItems = section.locator(".spotlight3d-item");
      const itemCount = await spotlightItems.count();
      expect(itemCount).toBeGreaterThanOrEqual(3);

      const ctas = section.locator(".spotlight3d-card__cta");
      const ctaCount = await ctas.count();
      expect(ctaCount).toBeGreaterThanOrEqual(3);
      for (let index = 0; index < ctaCount; index += 1) {
        await expect(ctas.nth(index)).toBeVisible({ timeout: 15000 });
      }

      const cardMetrics = await spotlightItems.evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = (element: Element | null) => {
            if (!element) {
              return null;
            }
            const box = element.getBoundingClientRect();
            return {
              top: box.top,
              bottom: box.bottom,
              height: box.height
            };
          };

          const card = node.querySelector(".spotlight3d-card");
          const cta = node.querySelector(".spotlight3d-card__cta");
          const lastChip = node.querySelector(".spotlight3d-card__chips li:last-child");
          const cardRect = rect(card);
          const ctaRect = rect(cta);
          const chipRect = rect(lastChip);

          return {
            cardHeight: cardRect?.height ?? 0,
            ctaBottomGap:
              cardRect && ctaRect ? Math.max(0, cardRect.bottom - ctaRect.bottom) : Number.POSITIVE_INFINITY,
            deadZone:
              chipRect && ctaRect ? Math.max(0, ctaRect.top - chipRect.bottom) : Number.POSITIVE_INFINITY
          };
        })
      );

      for (const metric of cardMetrics) {
        expect(metric.ctaBottomGap).toBeLessThanOrEqual(28);
        if (viewport.width >= 992) {
          expect(metric.deadZone).toBeLessThanOrEqual(Math.max(140, metric.cardHeight * 0.34));
        }
      }

      const featureSection = page.locator(".section-home-feature");
      await expect(featureSection).toBeVisible();
      const lastSpotlight = spotlightItems.last();
      const lastSpotlightMetrics = await requireDocumentMetrics(lastSpotlight);
      const featureMetrics = await requireDocumentMetrics(featureSection);
      expect(featureMetrics.top).toBeGreaterThanOrEqual(
        lastSpotlightMetrics.top + lastSpotlightMetrics.height + 12
      );
    });

    test("contact shows published information", async ({ page }) => {
      await page.goto("/pages/lien-he", { waitUntil: "domcontentloaded" });

      const contactPanel = page.locator(".contact-info");
      await expect(contactPanel).toBeVisible();
      await expect(contactPanel.getByText(/Dien thoai|Điện thoại/i)).toBeVisible();
      const phoneBlock = contactPanel.locator(".contact-info__item").nth(1);
      await expect(phoneBlock).toContainText(/[0-9]{3,}/);
    });

    test("qna supports pagination, topic filter via URL and no horizontal overflow", async ({
      page
    }) => {
      await page.goto("/pages/hoi-dap-cung-nha-nong", { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("qna-card")).toHaveCount(6);

      const topicLink = page.getByTestId("qna-topic-link-dinh-duong-cay-trong").first();
      await topicLink.focus();
      await expect(topicLink).toBeFocused();

      const pageTwo = page.getByTestId("qna-page-link-2");
      await pageTwo.focus();
      await expect(pageTwo).toBeFocused();
      await pageTwo.click();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByTestId("qna-card")).toHaveCount(6);

      await page.getByTestId("qna-topic-link-phong-tru-sau-benh").first().click();
      await expect(page).toHaveURL(/topic=phong-tru-sau-benh/);
      await expect(page).not.toHaveURL(/page=2/);
      await expect
        .poll(() => page.getByTestId("qna-card").count(), { timeout: 15000 })
        .toBeGreaterThan(0);
      const filteredCount = await page.getByTestId("qna-card").count();
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(6);

      const clampedUrl = new URL("/pages/hoi-dap-cung-nha-nong", page.url());
      clampedUrl.searchParams.set("page", "999");
      await page.goto(clampedUrl.toString(), { waitUntil: "domcontentloaded" });
      await expect
        .poll(() => page.getByTestId("qna-card").count(), { timeout: 15000 })
        .toBeGreaterThan(0);
      const clampedCount = await page.getByTestId("qna-card").count();
      expect(clampedCount).toBeGreaterThan(0);
      expect(clampedCount).toBeLessThanOrEqual(6);
      await expect(page.locator(".qna-page-link.is-active")).toHaveCount(1);

      const qnaRoot = page.locator(".layout-pageDetail.qna-page");
      const hasOverflow = await qnaRoot.evaluate((node) => {
        const element = node as HTMLElement;
        return element.scrollWidth > element.clientWidth + 1;
      });
      expect(hasOverflow).toBeFalsy();
    });

    test("admin login renders form", async ({ page }) => {
      await page.goto("/admin/login", { waitUntil: "domcontentloaded" });

      await expect(page.locator("form input").first()).toBeVisible();
      await expect(page.locator("form input").nth(1)).toBeVisible();
    });
  });
}
