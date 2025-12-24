import "./globals.css";

import { Fraunces, Manrope } from "next/font/google";

import CartDrawer from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartContext";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display"
});

const sansFont = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans"
});

export const metadata = {
  title: "Harvest & Hearth",
  description: "Seasonal produce, small-batch pantry goods, and thoughtful journal entries."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${sansFont.variable} text-ink`}>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 pb-16">{children}</main>
            <SiteFooter />
          </div>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}

