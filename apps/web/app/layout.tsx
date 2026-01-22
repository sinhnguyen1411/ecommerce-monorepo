import "./globals.css";

import { Nunito_Sans, Rubik } from "next/font/google";

import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Topbar from "@/components/layout/Topbar";
import SocialFloatingButtons from "@/components/common/SocialFloatingButtons";
import { Sonner } from "@/components/ui/sonner";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap"
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata = {
  title: "Nông Dược Tam Bố",
  description: "Sản phẩm nông nghiệp, tin tức mùa vụ và góc chia sẻ của Tam Bố."
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${rubik.variable} ${nunitoSans.variable} text-ink`}>
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
