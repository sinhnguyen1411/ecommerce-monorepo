import "./globals.css";

import { Newsreader, Work_Sans } from "next/font/google";

import CartDrawer from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SocialButtons from "@/components/SocialButtons";

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
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 pb-16">{children}</main>
            <SiteFooter />
          </div>
          <CartDrawer />
          <SocialButtons />
        </CartProvider>
      </body>
    </html>
  );
}
