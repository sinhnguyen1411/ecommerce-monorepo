export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Nông nghiệp TTC",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "0559.588.666",
  fax: process.env.NEXT_PUBLIC_COMPANY_FAX || "0559.588.666",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "congtyttc.bg@gmail.com",
  address:
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
    "Tân Sơn, Quỳnh Sơn, Thành phố Bắc Giang, Bắc Giang, Việt Nam",
  social: {
    facebook:
      process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ||
      "https://www.facebook.com/nongnghiepxanhTTC",
    messenger:
      process.env.NEXT_PUBLIC_SOCIAL_MESSENGER || "https://m.me/108520260558644",
    zalo: process.env.NEXT_PUBLIC_SOCIAL_ZALO || "https://zalo.me/0559588666"
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
    name: process.env.NEXT_PUBLIC_BANK_NAME || "Ngân hàng Nông nghiệp",
    account: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "123456789",
    holder: process.env.NEXT_PUBLIC_BANK_HOLDER || "Nông nghiệp TTC"
  }
};
