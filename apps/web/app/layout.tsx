import "./globals.css";

import { Roboto } from "next/font/google";

import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Topbar from "@/components/layout/Topbar";
import SocialFloatingButtons from "@/components/common/SocialFloatingButtons";
import { Sonner } from "@/components/ui/sonner";

const displayFont = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-display"
});

const baseFont = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans"
});

export const metadata = {
  title: "Nông nghiệp TTC",
  description: "Sản phẩm nông nghiệp, tin tức mùa vụ và góc chia sẻ của TTC."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${displayFont.variable} ${baseFont.variable} text-ink`}>
        <Topbar />
        <Header />
        <div className="min-h-screen pb-16">{children}</div>
        <Footer />
        <CartDrawer />
        <SocialFloatingButtons />
        <Sonner />
      </body>
    </html>
  );
}
