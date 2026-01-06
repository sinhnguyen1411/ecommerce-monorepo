import "./globals.css";

import { Newsreader, Work_Sans } from "next/font/google";

import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Topbar from "@/components/layout/Topbar";
import SocialFloatingButtons from "@/components/common/SocialFloatingButtons";
import { Sonner } from "@/components/ui/sonner";

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display"
});

const sansFont = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans"
});

export const metadata = {
  title: "Nong Nghiep TTC",
  description: "Fresh harvests, pantry staples, and field stories."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${displayFont.variable} ${sansFont.variable} text-ink`}>
        <Topbar />
        <Header />
        <main className="min-h-screen pb-16">{children}</main>
        <Footer />
        <CartDrawer />
        <SocialFloatingButtons />
        <Sonner />
      </body>
    </html>
  );
}
