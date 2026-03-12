"use client";

import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function AuthBrandStrip() {
  return (
    <div className="auth-brand-strip" data-testid="auth-chrome-hidden-marker">
      <p className="auth-brand-strip__eyebrow">Tai khoan bao mat</p>
      <Link href="/" className="auth-brand-strip__name">
        {siteConfig.name}
      </Link>
    </div>
  );
}

