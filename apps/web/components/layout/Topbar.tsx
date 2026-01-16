import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function Topbar() {
  const phoneDigits = siteConfig.phone.replace(/[^0-9]/g, "");

  return (
    <div className="topbar">
      <div className="topbar-bottom">
        <div className="container-fluid">
          <div className="box-content">
            <div className="box-left">
              <div className="hotline">
                <span>
                  Hotline:{" "}
                  <a className="font-semibold" href={`tel:${phoneDigits}`}>
                    {siteConfig.phone}
                  </a>
                </span>
              </div>
              <div className="contact">
                <Link href="/pages/lien-he">Liên hệ</Link>
              </div>
            </div>

            <div className="box-right">
              <div className="notify">
                <div className="notify-title">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 32 32"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="m29.39355 22.24194c0-1.85809-1.32587-3.40649-3.07745-3.76453v-7.15167c0-5.70001-4.62579-10.32574-10.3161-10.32574s-10.3161 4.62573-10.3161 10.32574v7.15167c-1.75159.35803-3.07745 1.90643-3.07745 3.76453 0 2.10968 1.7226 3.83221 3.84192 3.83221h19.10327c2.11932.00001 3.84191-1.72253 3.84191-3.83221z"></path>
                    <path d="m16 31c2.32263 0 4.32581-1.43231 5.15808-3.47424h-10.31616c.83227 2.04193 2.83545 3.47424 5.15808 3.47424z"></path>
                  </svg>
                  <span>Thông báo</span>
                </div>
              </div>
              <span className="hidden md:inline">
                Giao hàng tận nhà - Đổi trả trong 24h
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
