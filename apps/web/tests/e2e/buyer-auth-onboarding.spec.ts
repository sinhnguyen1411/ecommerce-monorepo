import { expect, test, type Page } from "@playwright/test";

type BuyerProfile = {
  id: number;
  email: string;
  name: string;
  phone?: string;
  birthdate?: string;
  has_password: boolean;
  onboarding_required: boolean;
  is_email_verified?: boolean;
  emailVerificationStatus?: string;
};

type BuyerAddress = {
  id: number;
  full_name: string;
  phone: string;
  address_line: string;
  province: string;
  district: string;
  is_default: boolean;
};

const provinceList = [{ code: 79, name: "Ho Chi Minh" }];
const districtList = [
  { code: 760, name: "District 1" },
  { code: 770, name: "District 3" }
];

const onboardingProfile: BuyerProfile = {
  id: 7,
  email: "buyer@gmail.com",
  name: "Buyer Demo",
  phone: "0901234567",
  birthdate: "2000-01-02",
  has_password: false,
  onboarding_required: true,
  is_email_verified: true,
  emailVerificationStatus: "VERIFIED"
};

const completedProfile: BuyerProfile = {
  ...onboardingProfile,
  has_password: true,
  onboarding_required: false
};

const defaultAddress: BuyerAddress = {
  id: 11,
  full_name: "Buyer Demo",
  phone: "0901234567",
  address_line: "123 Demo Street",
  province: "Ho Chi Minh",
  district: "District 1",
  is_default: true
};

const accountOrderSummary = {
  id: 301,
  order_number: "TB170326N0005",
  customer_name: "Buyer Demo",
  email: "buyer@gmail.com",
  phone: "0901234567",
  address: "123 Demo Street, District 1, Ho Chi Minh",
  note: "",
  delivery_time: "Trong ngày",
  promo_code: "",
  shipping_method: "standard",
  subtotal: 1050000,
  shipping_fee: 0,
  discount_total: 0,
  total: 1050000,
  payment_method: "bank_transfer",
  payment_status: "pending",
  status: "pending",
  payment_proof_url: "",
  created_at: "2026-03-17T12:18:00Z",
  updated_at: "2026-03-17T12:18:00Z",
  items: []
};

const accountOrderDetail = {
  ...accountOrderSummary,
  items: [
    {
      product_id: 501,
      name: "Organic Master",
      quantity: 1,
      unit_price: 1050000,
      line_total: 1050000
    }
  ]
};

const querySep = String.fromCharCode(63);
const escapedQuerySep = `${String.fromCharCode(92)}${querySep}`;

function withRawNext(path: string, nextPath: string) {
  return `${path}${querySep}next=${nextPath}`;
}

function ok(data: unknown) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data })
  };
}

function fail(status: number, code: string, message: string) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify({
      success: false,
      error: { code, message }
    })
  };
}

async function mockSharedCheckoutApis(page: Page) {
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill(fail(401, "unauthorized", "Unauthorized"));
  });

  await page.route("**/api/payment-settings", async (route) => {
    await route.fulfill(
      ok({
        id: 1,
        cod_enabled: true,
        bank_transfer_enabled: true,
        bank_qr_enabled: true,
        bank_name: "Vietcombank",
        bank_account: "0123456789",
        bank_holder: "Tam Bo",
        bank_qr_payload: "000201010212",
        bank_id: "VCB",
        bank_qr_template: "compact"
      })
    );
  });

  await page.route("**/api/checkout/config", async (route) => {
    await route.fulfill(
      ok({
        min_order_amount: 0,
        free_shipping_threshold: 0,
        shipping_fee_standard: 30000,
        shipping_fee_express: 50000
      })
    );
  });

  await page.route("**/api/geo/provinces", async (route) => {
    await route.fulfill(ok(provinceList));
  });

  await page.route("**/api/geo/districts**", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("province_code") !== "79") {
      await route.fulfill(ok([]));
      return;
    }
    await route.fulfill(ok(districtList));
  });
}

test.describe("Buyer auth onboarding", () => {
  test("password login redirects completed buyer to next destination", async ({ page }) => {
    let authed = false;
    let loginRequested = false;
    let profileRequested = 0;

    await mockSharedCheckoutApis(page);

    await page.route("**/api/account/profile", async (route) => {
      profileRequested += 1;
      if (!authed) {
        await route.fulfill(fail(401, "unauthorized", "Unauthorized"));
        return;
      }
      await route.fulfill(ok(completedProfile));
    });

    await page.route("**/api/auth/login", async (route) => {
      loginRequested = true;
      authed = true;
      await route.fulfill(
        ok({
          access_token: "access",
          refresh_token: "refresh",
          user: {
            id: completedProfile.id,
            email: completedProfile.email,
            full_name: completedProfile.name,
            is_email_verified: true,
            is_phone_verified: false,
            status: "active",
            onboarding_required: false,
            has_password: true
          }
        })
      );
    });

    await page.goto(withRawNext("/login", "/cart"), {
      waitUntil: "domcontentloaded"
    });
    await expect.poll(() => profileRequested).toBeGreaterThan(0);

    await page.getByTestId("login-email").fill("buyer@gmail.com");
    await page.getByTestId("login-password").fill("Password9");
    await page.getByTestId("login-password-submit").click();

    await expect.poll(() => loginRequested).toBe(true);
    await expect.poll(() => new URL(page.url()).pathname).toBe("/cart");
  });

  test("login page exposes OTP Gmail flow", async ({ page }) => {
    let otpRequested = false;
    let profileRequested = 0;

    await mockSharedCheckoutApis(page);

    await page.route("**/api/account/profile", async (route) => {
      profileRequested += 1;
      await route.fulfill(fail(401, "unauthorized", "Unauthorized"));
    });

    await page.route("**/api/auth/otp/request**", async (route) => {
      otpRequested = true;
      await route.fulfill(ok({ request_id: 99, cooldown_seconds: 30 }));
    });

    await page.goto(withRawNext("/login", "/cart"), {
      waitUntil: "domcontentloaded"
    });
    await expect.poll(() => profileRequested).toBeGreaterThan(0);

    await page.getByTestId("login-otp-toggle").click();
    await page.getByTestId("login-email").fill("buyer@gmail.com");
    await page.getByTestId("login-otp-request").click();

    await expect.poll(() => otpRequested).toBe(true);
    await expect(page.getByTestId("login-otp-code")).toBeVisible();
  });

  test("OTP signup redirects incomplete buyer to account onboarding", async ({ page }) => {
    let authed = false;
    let otpRequested = false;
    let otpVerified = false;
    let profileRequested = 0;

    await mockSharedCheckoutApis(page);

    await page.route("**/api/account/profile", async (route) => {
      profileRequested += 1;
      if (!authed) {
        await route.fulfill(fail(401, "unauthorized", "Unauthorized"));
        return;
      }
      await route.fulfill(ok(onboardingProfile));
    });

    await page.route("**/api/auth/otp/request**", async (route) => {
      otpRequested = true;
      await route.fulfill(ok({ request_id: 101, cooldown_seconds: 30 }));
    });

    await page.route("**/api/auth/otp/verify", async (route) => {
      otpVerified = true;
      authed = true;
      await route.fulfill(
        ok({
          access_token: "access",
          refresh_token: "refresh",
          user: {
            id: onboardingProfile.id,
            email: onboardingProfile.email,
            full_name: onboardingProfile.name,
            is_email_verified: true,
            is_phone_verified: false,
            status: "active",
            onboarding_required: true,
            has_password: false
          }
        })
      );
    });

    await page.goto(withRawNext("/signup", "/cart"), {
      waitUntil: "domcontentloaded"
    });
    await expect.poll(() => profileRequested).toBeGreaterThan(0);

    await page.getByTestId("signup-otp-toggle").click();
    await page.getByTestId("signup-otp-email").fill("buyer@gmail.com");
    await page.getByTestId("signup-otp-request").click();
    await expect.poll(() => otpRequested).toBe(true);

    await page.getByTestId("signup-otp-code").fill("123456");
    await page.getByTestId("signup-otp-verify").click();
    await expect.poll(() => otpVerified).toBe(true);

    await expect(page).toHaveURL(new RegExp(`/account${escapedQuerySep}next=%2Fcart$`));
  });

  test("account onboarding submits and redirects back to next", async ({ page }) => {
    let completed = false;
    let onboardingPayload: Record<string, unknown> | null = null;

    await mockSharedCheckoutApis(page);

    await page.route("**/api/account/profile", async (route) => {
      await route.fulfill(ok(completed ? completedProfile : onboardingProfile));
    });

    await page.route("**/api/account/addresses", async (route) => {
      await route.fulfill(ok([defaultAddress]));
    });

    await page.route("**/api/account/onboarding/complete", async (route) => {
      onboardingPayload = (route.request().postDataJSON() || {}) as Record<string, unknown>;
      completed = true;
      await route.fulfill(ok(completedProfile));
    });

    await page.goto(withRawNext("/account", "/cart"), {
      waitUntil: "domcontentloaded"
    });

    await expect(page.locator('input[value="buyer@gmail.com"]')).toBeVisible();
    await expect(page.locator('input[value="Buyer Demo"]')).toBeVisible();
    await expect(page.locator('input[value="123 Demo Street"]')).toBeVisible();

    await page.locator("#onboarding-password").fill("Password9");
    await page.locator("#onboarding-password-confirm").fill("Password9");
    await page.getByTestId("onboarding-submit").click();

    await expect.poll(() => new URL(page.url()).pathname).toBe("/cart");

    expect(onboardingPayload).toEqual({
      full_name: "Buyer Demo",
      phone: "0901234567",
      birthdate: "2000-01-02",
      address_line: "123 Demo Street",
      province: "Ho Chi Minh",
      district: "District 1",
      password: "Password9",
      password_confirm: "Password9"
    });
  });

  test("account page is locked with onboarding form when incomplete", async ({ page }) => {
    await mockSharedCheckoutApis(page);

    await page.route("**/api/account/profile", async (route) => {
      await route.fulfill(ok(onboardingProfile));
    });

    await page.route("**/api/account/addresses", async (route) => {
      await route.fulfill(ok([defaultAddress]));
    });

    await page.goto("/account", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#onboarding-email")).toBeVisible();
    await expect(page.getByTestId("onboarding-submit")).toBeVisible();
  });

  test("account tabs stay visible and highlight active route", async ({ page }) => {
    await mockSharedCheckoutApis(page);

    await page.route("**/api/account/profile", async (route) => {
      await route.fulfill(ok(completedProfile));
    });

    await page.route("**/api/account/orders", async (route) => {
      await route.fulfill(ok([]));
    });

    await page.route("**/api/account/addresses", async (route) => {
      await route.fulfill(ok([defaultAddress]));
    });

    await page.goto("/account/orders", { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-account-tab="/account"]')).toBeVisible();
    await expect(page.locator('[data-account-tab="/account/orders"]')).toHaveAttribute("aria-current", "page");
    await expect(page.locator('[data-account-tab="/account/addresses"]')).toBeVisible();

    await page.locator('[data-account-tab="/account/addresses"]').click();
    await expect(page).toHaveURL(/\/account\/addresses$/);
    await expect(page.locator('[data-account-tab="/account/addresses"]')).toHaveAttribute("aria-current", "page");
  });

  test("recent orders deep-link opens matching order detail", async ({ page }) => {
    await mockSharedCheckoutApis(page);

    await page.route("**/api/account/profile", async (route) => {
      await route.fulfill(ok(completedProfile));
    });

    await page.route("**/api/account/addresses", async (route) => {
      await route.fulfill(ok([defaultAddress]));
    });

    await page.route("**/api/account/orders**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname.endsWith(`/api/account/orders/${accountOrderSummary.id}`)) {
        await route.fulfill(ok(accountOrderDetail));
        return;
      }
      await route.fulfill(ok([accountOrderSummary]));
    });

    await page.goto("/account", { waitUntil: "domcontentloaded" });
    await page.locator(`[href="/account/orders?orderId=${accountOrderSummary.id}"]`).click();

    await expect(page).toHaveURL(new RegExp(`/account/orders${escapedQuerySep}orderId=${accountOrderSummary.id}$`));
    await expect(page.getByTestId(`account-order-detail-${accountOrderSummary.id}`)).toBeVisible();
  });

  test("account supports password change modal validation and submit", async ({ page }) => {
    let payload: Record<string, string> | null = null;

    await mockSharedCheckoutApis(page);

    await page.route("**/api/account/profile", async (route) => {
      await route.fulfill(ok(completedProfile));
    });

    await page.route("**/api/account/orders", async (route) => {
      await route.fulfill(ok([]));
    });

    await page.route("**/api/account/addresses", async (route) => {
      await route.fulfill(ok([defaultAddress]));
    });

    await page.route("**/api/auth/change-password", async (route) => {
      payload = (route.request().postDataJSON() || {}) as Record<string, string>;
      await route.fulfill(ok({ changed: true }));
    });

    await page.goto("/account", { waitUntil: "domcontentloaded" });
    await page.getByTestId("account-change-password-trigger").click();

    await page.locator("#account-old-password").fill("Password9");
    await page.locator("#account-new-password").fill("Password10");
    await page.locator("#account-new-password-confirm").fill("Password11");
    await page.getByTestId("account-change-password-submit").click();

    await expect(page.getByText("Mật khẩu xác nhận chưa khớp.")).toBeVisible();

    await page.locator("#account-new-password-confirm").fill("Password10");
    await page.getByTestId("account-change-password-submit").click();

    await expect.poll(() => payload).toEqual({
      old_password: "Password9",
      new_password: "Password10"
    });
    await expect(page.getByText("Đổi mật khẩu thành công.")).toBeVisible();
  });

  for (const path of ["/login", "/signup", "/forgot-password"]) {
    test(`hides storefront chrome on ${path}`, async ({ page }) => {
      await page.route("**/api/account/profile", async (route) => {
        await route.fulfill(fail(401, "unauthorized", "Unauthorized"));
      });

      await page.goto(path, { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("auth-chrome-hidden-marker")).toBeVisible();
      await expect(page.locator(".topbar")).toHaveCount(0);
      await expect(page.locator("#main-header")).toHaveCount(0);
      await expect(page.locator(".footer-main")).toHaveCount(0);
      await expect(page.locator(".social-floating")).toHaveCount(0);
    });
  }

  test.fixme("password login supports Enter submit", async ({ page }) => {
    let authed = false;
    let loginRequested = false;

    await mockSharedCheckoutApis(page);

    await page.route("**/api/account/profile", async (route) => {
      if (!authed) {
        await route.fulfill(fail(401, "unauthorized", "Unauthorized"));
        return;
      }
      await route.fulfill(ok(completedProfile));
    });

    await page.route("**/api/auth/login", async (route) => {
      loginRequested = true;
      authed = true;
      await route.fulfill(
        ok({
          access_token: "access",
          refresh_token: "refresh",
          user: {
            id: completedProfile.id,
            email: completedProfile.email,
            full_name: completedProfile.name,
            is_email_verified: true,
            is_phone_verified: false,
            status: "active",
            onboarding_required: false,
            has_password: true
          }
        })
      );
    });

    await page.goto(withRawNext("/login", "/cart"), {
      waitUntil: "domcontentloaded"
    });
    await page.getByTestId("login-email").fill("buyer@gmail.com");
    await page.getByTestId("login-password").fill("Password9");
    await page.getByTestId("login-password-submit").focus();
    await page.keyboard.press("Enter");

    await expect.poll(() => loginRequested).toBe(true);
    await expect.poll(() => new URL(page.url()).pathname).toBe("/cart");
  });

  for (const path of ["/account/orders", "/account/addresses", "/cart"]) {
    test(`gates ${path} to account when onboarding is required`, async ({ page }) => {
      await mockSharedCheckoutApis(page);

      await page.route("**/api/account/profile", async (route) => {
        await route.fulfill(ok(onboardingProfile));
      });

      await page.route("**/api/account/addresses", async (route) => {
        await route.fulfill(ok([defaultAddress]));
      });

      await page.route("**/api/account/orders", async (route) => {
        await route.fulfill(ok([]));
      });

      await page.goto(path, { waitUntil: "domcontentloaded" });

      const encodedPath = encodeURIComponent(path);
      await expect(page).toHaveURL(new RegExp(`/account${escapedQuerySep}next=${encodedPath}$`));
    });
  }
});
