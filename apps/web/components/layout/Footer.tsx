import Link from "next/link";
import { Facebook, MessageCircle, MessageSquare } from "lucide-react";

import { siteConfig } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="footer-main">
      <div className="footer-top">
        <div className="section-shell py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="footer-widget-title">Bản tin</p>
              <h3 className="text-lg font-semibold">
                Đăng ký nhận thông tin ưu đãi từ TTC
              </h3>
              <p className="mt-2 text-sm text-white/70">
                Nhập email để nhận tin về sản phẩm và khuyến mãi mới.
              </p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                className="h-10 flex-1 border border-white/20 bg-white px-3 text-sm text-ink"
                placeholder="Email của bạn"
              />
              <button className="button">Đăng ký</button>
            </div>
          </div>
        </div>
      </div>

      <div className="section-shell grid gap-10 py-10 lg:grid-cols-[1.2fr_1fr_0.8fr_1fr]">
        <div>
          <h2 className="text-lg font-semibold">{siteConfig.name}</h2>
          <p className="mt-3 text-sm text-white/70">
            Kết nối nông sản sạch và người tiêu dùng. Hỗ trợ tư vấn và giao hàng nhanh.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Link href={siteConfig.social.facebook} target="_blank" rel="noreferrer">
              <span className="flex h-8 w-8 items-center justify-center border border-white/20">
                <Facebook className="h-4 w-4" />
              </span>
            </Link>
            <Link href={siteConfig.social.messenger} target="_blank" rel="noreferrer">
              <span className="flex h-8 w-8 items-center justify-center border border-white/20">
                <MessageSquare className="h-4 w-4" />
              </span>
            </Link>
            <Link href={siteConfig.social.zalo} target="_blank" rel="noreferrer">
              <span className="flex h-8 w-8 items-center justify-center border border-white/20">
                <MessageCircle className="h-4 w-4" />
              </span>
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <img src="/ttc/footer/payment_1_img.png" alt="payment" className="h-7" />
            <img src="/ttc/footer/payment_2_img.png" alt="payment" className="h-7" />
          </div>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <p className="footer-widget-title">Liên hệ</p>
          <p>{siteConfig.address}</p>
          <p>Hotline: {siteConfig.phone}</p>
          <p>Fax: {siteConfig.fax}</p>
          <p>Email: {siteConfig.email}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <img src="/ttc/footer/shipment_1_img.png" alt="shipping" className="h-8" />
            <img src="/ttc/footer/shipment_2_img.png" alt="shipping" className="h-8" />
            <img src="/ttc/footer/shipment_4_img.png" alt="shipping" className="h-8" />
          </div>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <p className="footer-widget-title">Nhóm liên kết</p>
          <p>Đang cập nhật.</p>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <p className="footer-widget-title">Hỗ trợ</p>
          <Link href="/search" className="block text-white/70 hover:text-white">
            Tìm kiếm
          </Link>
          <Link href="/pages/about-us" className="block text-white/70 hover:text-white">
            Giới thiệu
          </Link>
          <Link href="/pages/chinh-sach-doi-tra" className="block text-white/70 hover:text-white">
            Chính sách đổi trả
          </Link>
          <Link href="/pages/chinh-sach-bao-mat" className="block text-white/70 hover:text-white">
            Chính sách bảo mật
          </Link>
          <Link href="/pages/dieu-khoan-dich-vu" className="block text-white/70 hover:text-white">
            Điều khoản dịch vụ
          </Link>
          <Link href="/pages/lien-he" className="block text-white/70 hover:text-white">
            Liên hệ
          </Link>
        </div>
      </div>
      <div className="footer-bottom">TTC Ecommerce. Bảo lưu mọi quyền.</div>
    </footer>
  );
}
