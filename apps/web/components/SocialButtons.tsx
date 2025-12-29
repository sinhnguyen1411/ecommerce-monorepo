import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function SocialButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <Link
        href={siteConfig.social.zalo}
        target="_blank"
        rel="noreferrer"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-cream shadow-lg transition hover:scale-105"
        aria-label="Zalo"
      >
        Z
      </Link>
      <Link
        href={siteConfig.social.messenger}
        target="_blank"
        rel="noreferrer"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-sun text-ink shadow-lg transition hover:scale-105"
        aria-label="Messenger"
      >
        M
      </Link>
      <Link
        href={siteConfig.social.facebook}
        target="_blank"
        rel="noreferrer"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-clay text-cream shadow-lg transition hover:scale-105"
        aria-label="Facebook"
      >
        F
      </Link>
    </div>
  );
}
