"use client";

import Link from "next/link";

import BrandSignature from "@/components/brand/BrandSignature";
import { siteConfig } from "@/lib/site";

export default function AuthBrandStrip() {
  return (
    <div className="auth-brand-strip" data-testid="auth-chrome-hidden-marker">
      <Link href="/" className="auth-brand-strip__home" aria-label={siteConfig.name}>
        <BrandSignature
          mode="auth"
          priority
          logoSizes="(max-width: 640px) 80px, 96px"
          logoClassName="auth-brand-strip__logo w-20 sm:w-24"
        />
      </Link>
    </div>
  );
}
