export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Nong Nghiep TTC",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "0900000000",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "hello@example.com",
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "123 Rural Road, District 1",
  social: {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "https://facebook.com",
    messenger: process.env.NEXT_PUBLIC_SOCIAL_MESSENGER || "https://m.me",
    zalo: process.env.NEXT_PUBLIC_SOCIAL_ZALO || "https://zalo.me"
  },
  freeShippingThreshold: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING || 0),
  minOrderAmount: Number(process.env.NEXT_PUBLIC_MIN_ORDER || 0),
  bank: {
    name: process.env.NEXT_PUBLIC_BANK_NAME || "Nong Nghiep Bank",
    account: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "123456789",
    holder: process.env.NEXT_PUBLIC_BANK_HOLDER || "Nong Nghiep TTC"
  }
};
