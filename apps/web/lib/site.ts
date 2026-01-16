export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Nông Dược Tam Bố",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "0942.204.279",
  fax: process.env.NEXT_PUBLIC_COMPANY_FAX || "0915.192.579",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "cskh@nongduoctambo.vn",
  address:
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
    "179, Hiệp Thành 2, Tam Bố, Di Linh, Lâm Đồng",
  social: {
    facebook:
      process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ||
      "https://www.facebook.com/nongduoctambo",
    messenger:
      process.env.NEXT_PUBLIC_SOCIAL_MESSENGER || "https://m.me/nongduoctambo",
    zalo: process.env.NEXT_PUBLIC_SOCIAL_ZALO || "https://zalo.me/0942204279"
  },
  policies: {
    returnPolicy:
      process.env.NEXT_PUBLIC_POLICY_RETURN || "/pages/chinh-sach-doi-tra",
    privacyPolicy:
      process.env.NEXT_PUBLIC_POLICY_PRIVACY || "/pages/chinh-sach-bao-mat",
    termsOfService:
      process.env.NEXT_PUBLIC_POLICY_TERMS || "/pages/dieu-khoan-dich-vu"
  },
  freeShippingThreshold: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING || 300000),
  minOrderAmount: Number(process.env.NEXT_PUBLIC_MIN_ORDER || 100000),
  bank: {
    name: process.env.NEXT_PUBLIC_BANK_NAME || "Vietcombank",
    account: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "0123456789",
    holder:
      process.env.NEXT_PUBLIC_BANK_HOLDER ||
      "Công ty Cổ phần Nông Dược Tam Bố"
  }
};
