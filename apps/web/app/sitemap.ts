import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/collections/all",
    "/blogs/news",
    "/cart",
    "/search",
    "/pages/about-us",
    "/pages/hoi-dap-cung-nha-nong",
    "/pages/lien-he",
    "/pages/chinh-sach-doi-tra",
    "/pages/chinh-sach-bao-mat",
    "/pages/dieu-khoan-dich-vu"
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date()
  }));
}
