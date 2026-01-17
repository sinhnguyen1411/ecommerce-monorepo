import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-forest/10 bg-white/70">
      <div className="section-shell grid gap-8 py-12 lg:grid-cols-[1.3fr_0.9fr_0.8fr]">
        <div>
          <p className="pill">{"Li\u00EAn h\u1EC7"}</p>
          <h2 className="mt-4 text-2xl font-semibold">{siteConfig.name}</h2>
          <p className="mt-3 text-sm text-ink/70">
            {"K\u1EBFt n\u1ED1i v\u1EDBi ngu\u1ED3n n\u00F4ng s\u1EA3n tin c\u1EADy, giao h\u00E0ng nhanh, h\u1ED7 tr\u1EE3 ng\u01B0\u1EDDi mua v\u00E0 ng\u01B0\u1EDDi tr\u1ED3ng tr\u1ECDt."}
          </p>
          <div className="mt-4 space-y-1 text-sm text-ink/70">
            <p>{siteConfig.address}</p>
            <p>{siteConfig.phone}</p>
            <p>{siteConfig.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            {"Danh m\u1EE5c"}
          </p>
          <Link className="block hover:text-clay" href="/products">
            {"S\u1EA3n ph\u1EA9m"}
          </Link>
          <Link className="block hover:text-clay" href="/blog">
            {"Tin t\u1EE9c"}
          </Link>
          <Link className="block hover:text-clay" href="/pages/about-us">
            {"Gi\u1EDBi thi\u1EC7u"}
          </Link>
          <Link className="block hover:text-clay" href="/pages/return-policy">
            {"Ch\u00EDnh s\u00E1ch \u0111\u1ED5i tr\u1EA3"}
          </Link>
          <Link className="block hover:text-clay" href="/pages/terms-of-service">
            {"\u0110i\u1EC1u kho\u1EA3n"}
          </Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
            {"\u0110\u0103ng k\u00FD b\u1EA3n tin"}
          </p>
          <p className="text-ink/70">
            {"Nh\u1EADn th\u00F4ng tin v\u1EC1 m\u00F9a v\u1EE5 m\u1EDBi v\u00E0 \u01B0u \u0111\u00E3i t\u1EEB Tam B\u1ED1."}
          </p>
          <div className="flex flex-col gap-3">
            <input className="field" placeholder={"Email c\u1EE7a b\u1EA1n"} />
            <button className="btn-secondary">{"\u0110\u0103ng k\u00FD"}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
