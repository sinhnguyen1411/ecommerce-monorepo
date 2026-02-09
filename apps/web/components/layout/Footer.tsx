"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, MessageCircle, MessageSquare } from "lucide-react";

import { useContactSettings } from "@/lib/client-content";
import { siteConfig } from "@/lib/site";

export default function Footer() {
  const settings = useContactSettings();

  return (
    <footer className="footer-main">
      <div className="footer-top">
        <div className="section-shell py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="footer-widget-title">{"B\u1EA3n tin"}</p>
              <h3 className="text-lg font-semibold">
                {"\u0110\u0103ng k\u00FD nh\u1EADn th\u00F4ng tin \u01B0u \u0111\u00E3i t\u1EEB Tam B\u1ED1"}
              </h3>
              <p className="mt-2 text-sm text-white/70">
                {"Nh\u1EADp email \u0111\u1EC3 nh\u1EADn tin v\u1EC1 s\u1EA3n ph\u1EA9m v\u00E0 khuy\u1EBFn m\u00E3i m\u1EDBi."}
              </p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                className="h-10 flex-1 border border-white/20 bg-white px-3 text-sm text-ink"
                placeholder={"Email c\u1EE7a b\u1EA1n"}
              />
              <button className="button">{"\u0110\u0103ng k\u00FD"}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="section-shell grid gap-10 py-10 lg:grid-cols-[1.2fr_1fr_0.8fr_1fr]">
        <div>
          <h2 className="text-lg font-semibold">{siteConfig.name}</h2>
          <p className="mt-3 text-sm text-white/70">
            {"K\u1EBFt n\u1ED1i n\u00F4ng s\u1EA3n s\u1EA1ch v\u00E0 ng\u01B0\u1EDDi ti\u00EAu d\u00F9ng. H\u1ED7 tr\u1EE3 t\u01B0 v\u1EA5n v\u00E0 giao h\u00E0ng nhanh."}
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
            <Image src="/tam-bo/footer/payment_1_img.png" alt="payment" width={80} height={28} className="h-7 w-auto" sizes="80px" />
            <Image src="/tam-bo/footer/payment_2_img.png" alt="payment" width={80} height={28} className="h-7 w-auto" sizes="80px" />
          </div>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <p className="footer-widget-title">{"Li\u00EAn h\u1EC7"}</p>
          <p>{settings.address}</p>
          <p>Hotline: {settings.phone}</p>
          <p>KTV: {settings.fax}</p>
          <p>Email: {settings.email}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Image src="/tam-bo/footer/shipment_1_img.png" alt="shipping" width={90} height={32} className="h-8 w-auto" sizes="90px" />
            <Image src="/tam-bo/footer/shipment_2_img.png" alt="shipping" width={90} height={32} className="h-8 w-auto" sizes="90px" />
            <Image src="/tam-bo/footer/shipment_4_img.png" alt="shipping" width={90} height={32} className="h-8 w-auto" sizes="90px" />
          </div>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <p className="footer-widget-title">{"Nh\u00F3m li\u00EAn k\u1EBFt"}</p>
          <p>{"\u0110ang c\u1EADp nh\u1EADt."}</p>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <p className="footer-widget-title">{"H\u1ED7 tr\u1EE3"}</p>
          <Link href="/search" className="block text-white/70 hover:text-white">
            {"T\u00ECm ki\u1EBFm"}
          </Link>
          <Link href="/pages/about-us" className="block text-white/70 hover:text-white">
            {"Gi\u1EDBi thi\u1EC7u"}
          </Link>
          <Link href="/pages/chinh-sach-doi-tra" className="block text-white/70 hover:text-white">
            {"Ch\u00EDnh s\u00E1ch \u0111\u1ED5i tr\u1EA3"}
          </Link>
          <Link href="/pages/chinh-sach-bao-mat" className="block text-white/70 hover:text-white">
            {"Ch\u00EDnh s\u00E1ch b\u1EA3o m\u1EADt"}
          </Link>
          <Link href="/pages/dieu-khoan-dich-vu" className="block text-white/70 hover:text-white">
            {"\u0110i\u1EC1u kho\u1EA3n d\u1ECBch v\u1EE5"}
          </Link>
          <Link href="/pages/lien-he" className="block text-white/70 hover:text-white">
            {"Li\u00EAn h\u1EC7"}
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        {"Tam B\u1ED1 Ecommerce. B\u1EA3o l\u01B0u m\u1ECDi quy\u1EC1n."}
      </div>
    </footer>
  );
}
