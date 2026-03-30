import "./globals.css";

import { Be_Vietnam_Pro, Noto_Sans } from "next/font/google";

import CheckoutConfigProvider from "@/components/cart/CheckoutConfigProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import StorefrontAnalyticsTracker from "@/components/analytics/StorefrontAnalyticsTracker";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Topbar from "@/components/layout/Topbar";
import SocialFloatingButtons from "@/components/common/SocialFloatingButtons";
import { Sonner } from "@/components/ui/sonner";
import { getCheckoutConfig, getPage } from "@/lib/api";
import { resolveHomePageContent } from "@/lib/content";

const displayFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: false
});

const bodyFont = Noto_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: false
});

export const metadata = {
  title: "Nông Dược Tam Bố",
  description: "Sản phẩm nông nghiệp, tin tức mùa vụ và góc chia sẻ của Tam Bố."
};

export const revalidate = 300;

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const homePage = await getPage("home").catch(() => null);
  const homeContent = resolveHomePageContent(homePage?.content);
  const checkoutConfig = await getCheckoutConfig().catch(() => null);

  return (
    <html lang="vi">
      <body className={`${displayFont.variable} ${bodyFont.variable} text-ink`}>
        <CheckoutConfigProvider initialConfig={checkoutConfig}>
          <Topbar
            promoSettings={homeContent.promoPopup}
            notificationSettings={homeContent.notifications}
            contactSettings={homeContent.contactSettings}
          />
          <StorefrontAnalyticsTracker />
          <Header />
          <div className="min-h-screen pb-16">{children}</div>
          <Footer contactSettings={homeContent.contactSettings} />
          <CartDrawer />
          <SocialFloatingButtons contactSettings={homeContent.contactSettings} />
          <Sonner />
        </CheckoutConfigProvider>
      </body>
    </html>
  );
}
