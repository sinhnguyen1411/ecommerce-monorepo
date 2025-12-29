import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/products",
    "/blog",
    "/blogs/news",
    "/cart",
    "/checkout",
    "/pages/about-us",
    "/pages/hoi-dap-cung-nha-nong",
    "/pages/locations",
    "/pages/return-policy",
    "/pages/terms-of-service"
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date()
  }));
}
