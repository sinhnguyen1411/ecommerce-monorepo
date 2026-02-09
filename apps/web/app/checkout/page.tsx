"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Address, getProfile, listAddresses } from "@/lib/account";
import {
  CheckoutConfig,
  GeoDistrict,
  GeoProvince,
  PaymentSettings,
  createOrder,
  getCheckoutConfig,
  getGeoDistricts,
  getGeoProvinces,
  getPaymentSettings,
  validatePromoCode
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { getCartSubtotal, useCartStore } from "@/store/cart";

const paymentOptions = [
  { value: "cod", label: "Thanh toán khi nhận hàng" },
  { value: "bank_transfer", label: "Chuyển khoản/QR ngân hàng" }
];

const shippingOptions = [
  { value: "standard", label: "Giao tiêu chuẩn (24-48h)" },
  { value: "express", label: "Giao nhanh (2-4h)" }
];

const vnPrefixes = new Set([
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "52",
  "56",
  "58",
  "59",
  "70",
  "76",
  "77",
  "78",
  "79",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "90",
  "91",
  "92",
  "93",
  "94",
  "96",
  "97",
  "98",
  "99"
]);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const normalizeVNPhone = (input: string) => {
  const digits = input.replace(/\D/g, "");
  let national = "";
  if (digits.startsWith("84") && digits.length === 11) {
    national = "0" + digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 10) {
    national = digits;
  } else {
    return null;
  }

  if (national.length !== 10) {
    return null;
  }

  const prefix = national.slice(1, 3);
  if (!vnPrefixes.has(prefix)) {
    return null;
  }

  return national;
};

const isValidEmail = (value: string) => emailRegex.test(value.trim());

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const promoCode = useCartStore((state) => state.promoCode);
  const note = useCartStore((state) => state.note);
  const deliveryTime = useCartStore((state) => state.deliveryTime);
  const storedShipping = useCartStore((state) => state.shippingMethod);
  const setStoredShipping = useCartStore((state) => state.setShippingMethod);
  const clear = useCartStore((state) => state.clear);
  const setPromoCode = useCartStore((state) => state.setPromoCode);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [shippingMethod, setShippingMethod] = useState(storedShipping || "standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [invoiceEnabled, setInvoiceEnabled] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [error, setError] = useState("");
  const [promoFeedback, setPromoFeedback] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [provinces, setProvinces] = useState<GeoProvince[]>([]);
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const subtotal = getCartSubtotal(items);
  const minOrderAmount = checkoutConfig?.min_order_amount ?? siteConfig.minOrderAmount;
  const freeShippingThreshold =
    checkoutConfig?.free_shipping_threshold ?? siteConfig.freeShippingThreshold;
  const shippingFeeStandard = checkoutConfig?.shipping_fee_standard ?? 30000;
  const shippingFeeExpress = checkoutConfig?.shipping_fee_express ?? 50000;
  const meetsMinOrder = minOrderAmount === 0 || subtotal >= minOrderAmount;

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const availablePaymentOptions = useMemo(() => {
    if (!paymentSettings) {
      return paymentOptions;
    }
    const bankTransferEnabled =
      paymentSettings.bank_transfer_enabled || paymentSettings.bank_qr_enabled;
    return paymentOptions.filter((option) => {
      if (option.value === "cod") return paymentSettings.cod_enabled;
      if (option.value === "bank_transfer") return bankTransferEnabled;
      return false;
    });
  }, [paymentSettings]);

  const shippingFee = useMemo(() => {
    if (shippingMethod === "express") {
      return shippingFeeExpress;
    }
    if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
      return 0;
    }
    return shippingFeeStandard;
  }, [shippingMethod, shippingFeeExpress, shippingFeeStandard, freeShippingThreshold, subtotal]);

  const total = Math.max(subtotal + shippingFee - promoDiscount, 0);

  useEffect(() => {
    setStoredShipping(shippingMethod);
  }, [setStoredShipping, shippingMethod]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getPaymentSettings().catch(() => null),
      getCheckoutConfig().catch(() => null),
      getGeoProvinces().catch(() => [])
    ]).then(([paymentData, checkoutData, provinceData]) => {
      if (cancelled) {
        return;
      }
      if (paymentData) {
        setPaymentSettings(paymentData);
      }
      if (checkoutData) {
        setCheckoutConfig(checkoutData);
      }
      setProvinces(provinceData);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getProfile().catch(() => null), listAddresses().catch(() => [])])
      .then(([profile, addressList]) => {
        if (cancelled) {
          return;
        }
        if (!profile) {
          setIsLoggedIn(false);
          setAddresses([]);
          setSelectedAddressId("");
          return;
        }

        setIsLoggedIn(true);
        setAddresses(addressList);
        const defaultAddress = addressList.find((item) => item.is_default) || addressList[0];
        if (defaultAddress) {
          setSelectedAddressId(String(defaultAddress.id));
          setCustomerName(defaultAddress.full_name || "");
          setPhone(defaultAddress.phone || "");
          setAddressLine(defaultAddress.address_line || "");
          setProvince(defaultAddress.province || "");
          setDistrict(defaultAddress.district || "");
        }
        if (profile?.email) {
          setEmail((prev) => (prev ? prev : profile.email));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoggedIn(false);
          setAddresses([]);
          setSelectedAddressId("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!province || provinces.length === 0) {
      setDistricts([]);
      setDistrict("");
      return;
    }

    const selected = provinces.find((item) => item.name === province);
    if (!selected) {
      setDistricts([]);
      setDistrict("");
      return;
    }

    getGeoDistricts(selected.code)
      .then((data) => {
        setDistricts(data);
        if (district && !data.some((item) => item.name === district)) {
          setDistrict("");
        }
      })
      .catch(() => {
        setDistricts([]);
      });
  }, [province, provinces, district]);

  useEffect(() => {
    if (availablePaymentOptions.length === 0) {
      return;
    }
    if (!availablePaymentOptions.some((option) => option.value === paymentMethod)) {
      setPaymentMethod(availablePaymentOptions[0].value);
    }
  }, [availablePaymentOptions, paymentMethod]);

  useEffect(() => {
    setPromoFeedback("");
    setPromoDiscount(0);
    setPromoApplied(false);
  }, [promoCode, subtotal]);

  const handleApplyPromo = async () => {
    const trimmed = promoCode.trim();
    if (!trimmed) {
      setPromoFeedback("Vui lòng nhập mã khuyến mãi.");
      return;
    }

    setIsApplyingPromo(true);
    setPromoFeedback("");
    try {
      const result = await validatePromoCode({ code: trimmed, subtotal });
      setPromoCode(result.promo_code);
      setPromoDiscount(result.discount_total);
      setPromoApplied(true);
      setPromoFeedback(`Đã áp dụng ${result.promo_code}.`);
    } catch (err) {
      setPromoDiscount(0);
      setPromoApplied(false);
      setPromoFeedback(err instanceof Error ? err.message : "Mã khuyến mãi không hợp lệ.");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const nextInvoiceErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      nextErrors.customerName = "Vui lòng nhập họ và tên.";
    }
    if (!email.trim()) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Email không hợp lệ.";
    }
    if (!phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!normalizeVNPhone(phone)) {
      nextErrors.phone = "Số điện thoại không hợp lệ.";
    }
    if (!addressLine.trim()) {
      nextErrors.addressLine = "Vui lòng nhập địa chỉ.";
    }
    if (!province) {
      nextErrors.province = "Vui lòng chọn tỉnh/thành.";
    }
    if (!district) {
      nextErrors.district = "Vui lòng chọn quận/huyện.";
    }

    if (invoiceEnabled) {
      if (!companyName.trim()) {
        nextInvoiceErrors.companyName = "Vui lòng nhập tên công ty.";
      }
      if (!taxCode.trim()) {
        nextInvoiceErrors.taxCode = "Vui lòng nhập mã số thuế.";
      } else if (!/^[0-9]{10,13}$/.test(taxCode.trim())) {
        nextInvoiceErrors.taxCode = "Mã số thuế không hợp lệ.";
      }
      if (!invoiceEmail.trim()) {
        nextInvoiceErrors.invoiceEmail = "Vui lòng nhập email nhận hóa đơn.";
      } else if (!isValidEmail(invoiceEmail)) {
        nextInvoiceErrors.invoiceEmail = "Email hóa đơn không hợp lệ.";
      }
      if (!invoiceAddress.trim()) {
        nextInvoiceErrors.invoiceAddress = "Vui lòng nhập địa chỉ công ty.";
      }
    }

    setFieldErrors(nextErrors);
    setInvoiceErrors(nextInvoiceErrors);

    return Object.keys(nextErrors).length === 0 && Object.keys(nextInvoiceErrors).length === 0;
  };

  const handleSubmit = async () => {
    setError("");

    if (!meetsMinOrder) {
      setError("Đơn hàng chưa đạt giá trị tối thiểu.");
      return;
    }

    if (items.length === 0) {
      setError("Giỏ hàng đang trống.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneNormalized = normalizeVNPhone(phone) || phone.trim();
      const addressParts = [addressLine.trim(), district, province].filter(Boolean);
      const fullAddress = addressParts.join(", ");
      const paymentMethodForOrder =
        paymentMethod === "bank_transfer" &&
        paymentSettings &&
        !paymentSettings.bank_transfer_enabled &&
        paymentSettings.bank_qr_enabled
          ? "bank_qr"
          : paymentMethod;

      const response = await createOrder({
        customer_name: customerName.trim(),
        email: email.trim(),
        phone: phoneNormalized,
        address: fullAddress,
        address_line: addressLine.trim(),
        district,
        province,
        note: [
          note,
          invoiceEnabled
            ? `Hóa đơn: ${companyName} | ${taxCode} | ${invoiceEmail} | ${invoiceAddress}`
            : ""
        ]
          .filter(Boolean)
          .join(" - "),
        delivery_time: deliveryTime || shippingMethod,
        shipping_method: shippingMethod,
        payment_method: paymentMethodForOrder,
        promo_code: promoCode,
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      });

      window.localStorage.setItem(
        "ttc_last_order",
        JSON.stringify({
          ...response,
          customer_name: customerName,
          email,
          phone: phoneNormalized,
          address: fullAddress,
          payment_method: paymentMethodForOrder
        })
      );
      clear();
      router.push(`/checkout/thank-you?order_id=${response.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thanh toán thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-wrapper">
      <div className="breadcrumb-shop">
        <div className="container">
          <div className="breadcrumb-list">
            <ol className="breadcrumb breadcrumb-arrows">
              <li>
                <a href="/" target="_self">
                  Trang chủ
                </a>
              </li>
              <li className="active">
                <strong>Thanh toán</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <section className="section-shell pb-16 pt-6">
        <div className="checkout-heading">
          <h1>Hoàn tất đơn hàng</h1>
          <p>Điền thông tin giao hàng và chọn phương thức thanh toán.</p>
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">
            <div className="checkout-box">
              <h2>Thông tin giao hàng</h2>

              {isLoggedIn && addresses.length > 0 ? (
                <div className="mb-4">
                  <label className="block text-sm font-semibold">
                    Chọn địa chỉ đã lưu
                    <select
                      className="field mt-2"
                      value={selectedAddressId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        setSelectedAddressId(nextId);
                        const selected = addresses.find((item) => String(item.id) === nextId);
                        if (selected) {
                          setCustomerName(selected.full_name || "");
                          setPhone(selected.phone || "");
                          setAddressLine(selected.address_line || "");
                          setProvince(selected.province || "");
                          setDistrict(selected.district || "");
                        }
                      }}
                    >
                      <option value="">Chọn địa chỉ</option>
                      {addresses.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          {item.full_name} - {item.address_line}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              <div className="checkout-grid">
                <div>
                  <input
                    className="field"
                    value={customerName}
                    onChange={(event) => {
                      setCustomerName(event.target.value);
                      if (fieldErrors.customerName) {
                        setFieldErrors((prev) => ({ ...prev, customerName: "" }));
                      }
                    }}
                    placeholder="Họ và tên"
                  />
                  {fieldErrors.customerName ? (
                    <p className="mt-1 text-xs text-clay">{fieldErrors.customerName}</p>
                  ) : null}
                </div>
                <div>
                  <input
                    className="field"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="Email"
                    type="email"
                  />
                  {fieldErrors.email ? (
                    <p className="mt-1 text-xs text-clay">{fieldErrors.email}</p>
                  ) : null}
                </div>
                <div>
                  <input
                    className="field"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      if (fieldErrors.phone) {
                        setFieldErrors((prev) => ({ ...prev, phone: "" }));
                      }
                    }}
                    placeholder="Số điện thoại"
                  />
                  {fieldErrors.phone ? (
                    <p className="mt-1 text-xs text-clay">{fieldErrors.phone}</p>
                  ) : null}
                </div>
                <div>
                  <input
                    className="field"
                    value={addressLine}
                    onChange={(event) => {
                      setAddressLine(event.target.value);
                      if (fieldErrors.addressLine) {
                        setFieldErrors((prev) => ({ ...prev, addressLine: "" }));
                      }
                    }}
                    placeholder="Địa chỉ (số nhà, đường, thôn/xóm)"
                  />
                  {fieldErrors.addressLine ? (
                    <p className="mt-1 text-xs text-clay">{fieldErrors.addressLine}</p>
                  ) : null}
                </div>
                <div>
                  <select
                    className="field"
                    value={province}
                    onChange={(event) => {
                      setProvince(event.target.value);
                      if (fieldErrors.province) {
                        setFieldErrors((prev) => ({ ...prev, province: "" }));
                      }
                    }}
                  >
                    <option value="">Chọn tỉnh/thành</option>
                    {provinces.map((item) => (
                      <option key={item.code} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.province ? (
                    <p className="mt-1 text-xs text-clay">{fieldErrors.province}</p>
                  ) : null}
                </div>
                <div>
                  <select
                    className="field"
                    value={district}
                    onChange={(event) => {
                      setDistrict(event.target.value);
                      if (fieldErrors.district) {
                        setFieldErrors((prev) => ({ ...prev, district: "" }));
                      }
                    }}
                    disabled={!province}
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districts.map((item) => (
                      <option key={item.code} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.district ? (
                    <p className="mt-1 text-xs text-clay">{fieldErrors.district}</p>
                  ) : null}
                </div>
              </div>

              <div className="checkout-checkbox">
                <input
                  id="invoice"
                  type="checkbox"
                  checked={invoiceEnabled}
                  onChange={(event) => setInvoiceEnabled(event.target.checked)}
                />
                <label htmlFor="invoice">Xuất hóa đơn doanh nghiệp</label>
              </div>
              {invoiceEnabled ? (
                <div className="checkout-grid">
                  <div>
                    <input
                      className="field"
                      value={companyName}
                      onChange={(event) => {
                        setCompanyName(event.target.value);
                        if (invoiceErrors.companyName) {
                          setInvoiceErrors((prev) => ({ ...prev, companyName: "" }));
                        }
                      }}
                      placeholder="Tên công ty"
                    />
                    {invoiceErrors.companyName ? (
                      <p className="mt-1 text-xs text-clay">{invoiceErrors.companyName}</p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      className="field"
                      value={taxCode}
                      onChange={(event) => {
                        setTaxCode(event.target.value);
                        if (invoiceErrors.taxCode) {
                          setInvoiceErrors((prev) => ({ ...prev, taxCode: "" }));
                        }
                      }}
                      placeholder="Mã số thuế"
                    />
                    {invoiceErrors.taxCode ? (
                      <p className="mt-1 text-xs text-clay">{invoiceErrors.taxCode}</p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      className="field"
                      value={invoiceEmail}
                      onChange={(event) => {
                        setInvoiceEmail(event.target.value);
                        if (invoiceErrors.invoiceEmail) {
                          setInvoiceErrors((prev) => ({ ...prev, invoiceEmail: "" }));
                        }
                      }}
                      placeholder="Email nhận hóa đơn"
                    />
                    {invoiceErrors.invoiceEmail ? (
                      <p className="mt-1 text-xs text-clay">{invoiceErrors.invoiceEmail}</p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      className="field"
                      value={invoiceAddress}
                      onChange={(event) => {
                        setInvoiceAddress(event.target.value);
                        if (invoiceErrors.invoiceAddress) {
                          setInvoiceErrors((prev) => ({ ...prev, invoiceAddress: "" }));
                        }
                      }}
                      placeholder="Địa chỉ công ty"
                    />
                    {invoiceErrors.invoiceAddress ? (
                      <p className="mt-1 text-xs text-clay">{invoiceErrors.invoiceAddress}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="checkout-box">
              <h2>Phương thức giao hàng</h2>
              <div className="checkout-options">
                {shippingOptions.map((option) => (
                  <label key={option.value} className="checkout-option">
                    <span>{option.label}</span>
                    <input
                      type="radio"
                      name="shipping"
                      value={option.value}
                      checked={shippingMethod === option.value}
                      onChange={(event) => setShippingMethod(event.target.value)}
                    />
                  </label>
                ))}
              </div>
              {promoFeedback ? <p className="mt-2 text-sm text-ink/60">{promoFeedback}</p> : null}
            </div>

            <div className="checkout-box">
              <h2>Phương thức thanh toán</h2>
              <div className="checkout-options">
                {availablePaymentOptions.map((option) => (
                  <label key={option.value} className="checkout-option">
                    <span>{option.label}</span>
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={paymentMethod === option.value}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="checkout-box">
              <h2>Khuyến mãi</h2>
              <div className="checkout-promo">
                <input
                  className="field"
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder="Nhập mã khuyến mãi"
                />
                <button
                  className="button btnlight"
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={isApplyingPromo}
                >
                  {isApplyingPromo ? "Đang kiểm tra..." : "Áp dụng"}
                </button>
              </div>
              {promoFeedback ? <p className="mt-2 text-sm text-ink/60">{promoFeedback}</p> : null}
            </div>
          </div>

          <aside className="checkout-sidebar">
            <div className="checkout-summary">
              <h3>Đơn hàng</h3>
              <div className="checkout-items">
                {items.length === 0 ? (
                  <p>Giỏ hàng đang trống.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="checkout-item">
                      <div>
                        <p className="item-name">{item.name}</p>
                        <p className="item-qty">Số lượng: {item.quantity}</p>
                      </div>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="checkout-totals">
                <div className="row">
                  <span>Số lượng sản phẩm</span>
                  <span>{totalItems}</span>
                </div>
                <div className="row">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="row">
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee)}</span>
                </div>
                {promoApplied ? (
                  <div className="row">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(promoDiscount)}</span>
                  </div>
                ) : null}
                <div className="row total">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              {minOrderAmount > 0 ? (
                <p className="checkout-note">
                  Đơn hàng tối thiểu {formatCurrency(minOrderAmount)}
                </p>
              ) : null}
              {error ? <p className="checkout-error">{error}</p> : null}
              <Button
                className="checkout-submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !meetsMinOrder}
              >
                {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
