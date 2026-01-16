import "./globals.css";

import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Topbar from "@/components/layout/Topbar";
import SocialFloatingButtons from "@/components/common/SocialFloatingButtons";
import { Sonner } from "@/components/ui/sonner";

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
      <body className="text-ink">
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
